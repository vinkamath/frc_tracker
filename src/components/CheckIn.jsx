import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { format, startOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

function CheckIn() {
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [checkedInToday, setCheckedInToday] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMembers();
    loadTodayAttendance();
  }, []);

  const loadMembers = async () => {
    try {
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    } catch (error) {
      console.error('Error loading members:', error);
      setLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, where('date', '==', today));
      const snapshot = await getDocs(q);

      const checkedIn = new Set();
      snapshot.docs.forEach(doc => {
        checkedIn.add(doc.data().memberId);
      });
      setCheckedInToday(checkedIn);
    } catch (error) {
      console.error('Error loading today\'s attendance:', error);
    }
  };

  const toggleMember = (memberId) => {
    if (checkedInToday.has(memberId)) return;
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCheckIn = async () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');

      for (const memberId of selectedMembers) {
        await addDoc(collection(db, 'attendance'), {
          memberId,
          date: today,
          weekStart,
          timestamp: new Date().toISOString()
        });
      }

      setSuccessMessage(`${selectedMembers.length} member(s) checked in successfully!`);
      setSelectedMembers([]);
      await loadTodayAttendance();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Error checking in. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="py-12 text-center text-muted-foreground">Loading members...</div>
      </div>
    );
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Who came to the run today?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {successMessage && (
            <Alert className="border-primary/50 bg-primary/10 text-primary">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {members.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <h3 className="mb-2 font-medium text-foreground">No members found</h3>
              <p>Add members in the Members section to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Search for your name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-base"
                />
              </div>

              {filteredMembers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No members found matching "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                  {filteredMembers.map(member => (
                    <div
                      key={member.id}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 p-4 text-center transition-all",
                        "hover:border-primary/50 hover:shadow-md",
                        selectedMembers.includes(member.id) && "border-primary bg-primary/10",
                        checkedInToday.has(member.id) && "cursor-default border-muted bg-muted/50 opacity-70"
                      )}
                      onClick={() => toggleMember(member.id)}
                    >
                      <div className="font-medium">{member.name}</div>
                      {checkedInToday.has(member.id) && (
                        <div className="mt-1 text-sm text-primary">✓ Checked in</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button
                  onClick={handleCheckIn}
                  disabled={selectedMembers.length === 0}
                >
                  Check In ({selectedMembers.length})
                </Button>
                {selectedMembers.length > 0 && (
                  <Button variant="secondary" onClick={() => setSelectedMembers([])}>
                    Clear Selection
                  </Button>
                )}
                {searchQuery && (
                  <Button variant="secondary" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </p>
    </div>
  );
}

export default CheckIn;
