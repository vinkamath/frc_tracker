import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [memberStats, setMemberStats] = useState({});

  const normalizePhone = (phone) => phone.replace(/\D/g, '');
  const formatPhoneDisplay = (phone) => {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return phone;
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList.sort((a, b) => a.name.localeCompare(b.name)));
      await loadMemberStats(membersList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading members:', error);
      setLoading(false);
    }
  };

  const loadMemberStats = async (membersList) => {
    try {
      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      const stats = {};

      membersList.forEach(member => {
        stats[member.id] = { totalRuns: 0, lastAttendance: null };
      });

      attendanceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (stats[data.memberId]) {
          stats[data.memberId].totalRuns++;
          if (!stats[data.memberId].lastAttendance || data.date > stats[data.memberId].lastAttendance) {
            stats[data.memberId].lastAttendance = data.date;
          }
        }
      });

      setMemberStats(stats);
    } catch (error) {
      console.error('Error loading member stats:', error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      alert('Please enter a member name');
      return;
    }
    if (!newMemberPhone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    const normalizedPhone = normalizePhone(newMemberPhone.trim());
    if (normalizedPhone.length < 10) {
      alert('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    try {
      const existingQuery = query(
        collection(db, 'members'),
        where('phone', '==', normalizedPhone)
      );
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        const existingMember = existingSnapshot.docs[0].data();
        alert(`This phone number is already registered to ${existingMember.name}. Please use a different number or contact the admin.`);
        return;
      }

      await addDoc(collection(db, 'members'), {
        name: newMemberName.trim(),
        phone: normalizedPhone,
        joinedDate: format(new Date(), 'yyyy-MM-dd'),
        createdAt: new Date().toISOString()
      });
      setNewMemberName('');
      setNewMemberPhone('');
      setShowAddModal(false);
      await loadMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Error adding member. Please try again.');
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to delete ${memberName}? This will also remove all their attendance records.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'members', memberId));
      const attendanceQuery = query(collection(db, 'attendance'), where('memberId', '==', memberId));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const deletePromises = attendanceSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      await loadMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Error deleting member. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="py-12 text-center text-muted-foreground">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Members</CardTitle>
          <Button onClick={() => setShowAddModal(true)}>Add Member</Button>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <h3 className="mb-2 font-medium text-foreground">No members yet</h3>
              <p>Click "Add Member" to add your first member</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Total Runs</TableHead>
                  <TableHead>Last Attendance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => {
                  const stats = memberStats[member.id] || { totalRuns: 0, lastAttendance: null };
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.phone ? formatPhoneDisplay(member.phone) : '—'}
                      </TableCell>
                      <TableCell>
                        {member.joinedDate ? format(new Date(member.joinedDate), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>{stats.totalRuns}</TableCell>
                      <TableCell>
                        {stats.lastAttendance ? format(new Date(stats.lastAttendance), 'MMM d, yyyy') : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open);
        if (!open) {
          setNewMemberName('');
          setNewMemberPhone('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>Enter the name and phone number of the new member to add to the run club.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Member Name</Label>
              <Input
                id="member-name"
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Enter member name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-phone">Phone Number</Label>
              <Input
                id="member-phone"
                type="tel"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Members;
