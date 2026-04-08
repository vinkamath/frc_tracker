import { useState, useEffect } from 'react';
import { db, app } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import AddMemberDialog from './AddMemberDialog';

function CheckIn() {
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [checkedInToday, setCheckedInToday] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [checkInPending, setCheckInPending] = useState(false);

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

  const handleAddMemberSuccess = async (newMemberId, options) => {
    await loadMembers();
    if (options?.checkInForToday) {
      setCheckingInMembers(new Set([newMemberId]));
      try {
        const functions = getFunctions(app);
        const checkInFn = httpsCallable(functions, 'checkIn');
        await checkInFn({ memberIds: [newMemberId] });
        await loadTodayAttendance();
        setSuccessMessage('Member added and checked in for today!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error checking in new member:', error);
        setSelectedMembers(prev => [...prev, newMemberId]);
        alert('Member added, but check-in failed. Please select them and click Check In.');
      } finally {
        setCheckingInMembers(new Set());
      }
    } else {
      setSelectedMembers(prev => [...prev, newMemberId]);
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

    setCheckInPending(true);
    try {
      const functions = getFunctions(app);
      const checkInFn = httpsCallable(functions, 'checkIn');
      const { data } = await checkInFn({ memberIds: selectedMembers });
      const { checkedIn = [], alreadyCheckedIn = [] } = data || {};

      const messages = [];
      if (checkedIn.length > 0) {
        messages.push(`${checkedIn.length} member(s) checked in successfully`);
      }
      if (alreadyCheckedIn.length > 0) {
        messages.push(`${alreadyCheckedIn.length} were already checked in today`);
      }
      setSuccessMessage(messages.length ? messages.join('. ') + '!' : 'Check-in complete.');

      setSelectedMembers([]);
      await loadTodayAttendance();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Error checking in. Please try again.');
    } finally {
      setCheckInPending(false);
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

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Card className="overflow-hidden border-2 border-primary/15 shadow-[0_20px_50px_-24px_color-mix(in_oklch,var(--foreground)_25%,transparent)]">
        <CardHeader className="relative space-y-3 border-b border-primary/10 bg-gradient-to-br from-primary/[0.12] via-background to-background pb-8 pt-8 sm:pb-10 sm:pt-10">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">Today&apos;s run</p>
          <CardTitle className="font-display max-w-[22ch] text-balance text-2xl font-bold leading-[1.15] tracking-tight sm:text-4xl">
            Who came to the run today?
          </CardTitle>
          <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
            Tap your name, then check in — built for a phone passed around at the meetup.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          {successMessage && (
            <Alert className="motion-safe:alert-in border-primary/50 bg-primary/10 text-primary">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {members.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <h3 className="mb-2 font-medium text-foreground">No members found</h3>
              <p className="mb-4">Add your first member to get started</p>
              <Button onClick={() => setShowAddModal(true)}>Add Member</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="text"
                  placeholder="Search for your name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px] text-base"
                />
                <Button variant="outline" onClick={() => setShowAddModal(true)}>
                  Add Member
                </Button>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="mb-4">No members found matching "{searchQuery}"</p>
                  <p className="mb-4">Can&apos;t find your name? Add yourself and check in.</p>
                  <Button onClick={() => setShowAddModal(true)}>Add Member</Button>
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-4">
                  {filteredMembers.map(member => (
                    <div
                      key={member.id}
                      className={cn(
                        "min-h-[3.25rem] cursor-pointer rounded-2xl border-2 p-4 text-center transition-[border-color,box-shadow,background-color,transform] duration-200 ease-out",
                        "hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md motion-reduce:hover:translate-y-0",
                        selectedMembers.includes(member.id) &&
                          "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/25 ring-offset-2 ring-offset-background",
                        checkedInToday.has(member.id) &&
                          "cursor-default border-muted bg-muted/50 opacity-75 hover:translate-y-0 hover:shadow-none"
                      )}
                      onClick={() => toggleMember(member.id)}
                    >
                      <div className="font-semibold leading-snug">{member.name}</div>
                      {checkedInToday.has(member.id) && (
                        <div className="mt-1.5 text-xs font-medium uppercase tracking-wide text-primary">Checked in</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-border/80 pt-6">
                <Button
                  size="lg"
                  className="min-h-11 min-w-[10rem] px-8 font-semibold shadow-sm"
                  onClick={handleCheckIn}
                  disabled={checkInPending || selectedMembers.length === 0}
                  aria-busy={checkInPending}
                >
                  {checkInPending ? 'Checking in…' : `Check In (${selectedMembers.length})`}
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

      <AddMemberDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleAddMemberSuccess}
        offerCheckInToday
        initialName={searchQuery}
      />

      <p className="mt-8 text-center font-display text-lg font-semibold tracking-tight text-foreground/85">
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </p>
    </div>
  );
}

export default CheckIn;
