import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { format, startOfWeek, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function SideStat({ label, value, emphasize }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-l-[3px] py-2 pl-4 ${
        emphasize ? 'border-primary bg-primary/[0.06]' : 'border-primary/25'
      }`}
    >
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="font-display text-2xl font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function Dashboard() {
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyStats();
  }, []);

  const loadWeeklyStats = async () => {
    try {
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const membersMap = new Map();
      membersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        membersMap.set(doc.id, { name: data.name, joinedDate: data.joinedDate });
      });

      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      const weeklyData = new Map();

      attendanceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const weekStart = data.weekStart;

        if (!weeklyData.has(weekStart)) {
          weeklyData.set(weekStart, {
            weekStart,
            members: new Set(),
            newMembers: new Set(),
            returningMembers: new Set()
          });
        }

        const week = weeklyData.get(weekStart);
        week.members.add(data.memberId);

        const member = membersMap.get(data.memberId);
        if (member && member.joinedDate) {
          const joinedWeekStart = format(startOfWeek(new Date(member.joinedDate)), 'yyyy-MM-dd');
          if (joinedWeekStart === weekStart) {
            week.newMembers.add(data.memberId);
          } else {
            week.returningMembers.add(data.memberId);
          }
        }
      });

      const stats = Array.from(weeklyData.values())
        .map(week => {
          const saturday = addDays(new Date(week.weekStart), 5);
          return {
            weekStart: week.weekStart,
            saturday: format(saturday, 'yyyy-MM-dd'),
            totalAttendance: week.members.size,
            newMembers: week.newMembers.size,
            returningMembers: week.returningMembers.size
          };
        })
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

      const memberCounts = new Map();
      attendanceSnapshot.docs.forEach(doc => {
        const { memberId } = doc.data();
        memberCounts.set(memberId, (memberCounts.get(memberId) || 0) + 1);
      });

      const top5 = Array.from(memberCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([memberId, count]) => ({
          name: membersMap.get(memberId)?.name ?? 'Unknown',
          count,
        }));

      setWeeklyStats(stats);
      setLeaderboard(top5);
      setLoading(false);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="py-16 text-center font-medium text-muted-foreground motion-safe:animate-pulse motion-reduce:animate-none">
          Loading dashboard…
        </div>
      </div>
    );
  }

  const currentWeek = weeklyStats[0] || { totalAttendance: 0, newMembers: 0, returningMembers: 0 };
  const avgAttendance = weeklyStats.length > 0
    ? Math.round(weeklyStats.reduce((sum, week) => sum + week.totalAttendance, 0) / weeklyStats.length)
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Card className="overflow-hidden border-2 border-primary/12 shadow-[0_24px_60px_-28px_color-mix(in_oklch,var(--foreground)_22%,transparent)]">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/[0.08] via-transparent to-transparent pb-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">Pulse of the club</p>
          <CardTitle className="font-display pt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Weekly dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-10 lg:items-stretch">
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/[0.07] to-background p-6 sm:p-8 lg:col-span-3">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-primary">This week</p>
                <p className="mt-1 text-sm text-muted-foreground">Total runners checked in for the current week.</p>
              </div>
              <p
                className="mt-6 font-display text-6xl font-bold leading-none tracking-tight text-primary sm:text-7xl"
                aria-live="polite"
              >
                {currentWeek.totalAttendance}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">attendance</p>
            </div>
            <div className="flex flex-col justify-center gap-1 lg:col-span-2">
              <SideStat label="New members this week" value={currentWeek.newMembers} emphasize />
              <SideStat label="Returning runners" value={currentWeek.returningMembers} />
              <SideStat label="Avg per week (all time)" value={avgAttendance} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 border-primary/10 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl font-bold tracking-tight">Weekly trends</CardTitle>
          <p className="text-sm text-muted-foreground">Recent weeks, newest first.</p>
        </CardHeader>
        <CardContent>
          {weeklyStats.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <h3 className="mb-2 font-medium text-foreground">No data yet</h3>
              <p>Start checking in members to see weekly trends</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Total Attendance</TableHead>
                  <TableHead>New Members</TableHead>
                  <TableHead>Returning Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyStats.map(week => (
                  <TableRow key={week.weekStart}>
                    <TableCell className="font-medium">{format(new Date(week.saturday), 'MMM d')}</TableCell>
                    <TableCell>{week.totalAttendance}</TableCell>
                    <TableCell className="font-medium text-primary">{week.newMembers}</TableCell>
                    <TableCell>{week.returningMembers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8 border-primary/10 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl font-bold tracking-tight">Leaderboard</CardTitle>
          <p className="text-sm text-muted-foreground">Top 5 members by all-time attendance.</p>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No data yet</div>
          ) : (
            <div className="flex flex-col gap-2">
              {leaderboard.map((member, index) => (
                <div
                  key={member.name}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 ${
                    index === 0
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-muted/40'
                  }`}
                >
                  <span
                    className={`font-display w-6 text-center text-lg font-bold tabular-nums ${
                      index === 0 ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className={`flex-1 font-medium ${index === 0 ? 'text-foreground' : 'text-foreground/80'}`}>
                    {member.name}
                  </span>
                  <span className={`font-display text-xl font-bold tabular-nums ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                    {member.count}
                  </span>
                  <span className="text-xs text-muted-foreground">check-ins</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
