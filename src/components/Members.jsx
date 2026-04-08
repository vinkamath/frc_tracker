import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AddMemberDialog from './AddMemberDialog';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [memberStats, setMemberStats] = useState({});

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
        <div className="py-16 text-center font-medium text-muted-foreground motion-safe:animate-pulse motion-reduce:animate-none">
          Loading members…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Card className="border-primary/10 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-2 sm:items-end">
          <div className="space-y-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">Roster</p>
            <CardTitle className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Members</CardTitle>
          </div>
          <Button onClick={() => { setEditMember(null); setShowAddModal(true); }}>Add Member</Button>
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
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setEditMember(member); setShowAddModal(true); }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id, member.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddMemberDialog
        open={showAddModal}
        onOpenChange={(open) => { if (!open) setEditMember(null); setShowAddModal(open); }}
        onSuccess={loadMembers}
        member={editMember}
      />
    </div>
  );
}

export default Members;
