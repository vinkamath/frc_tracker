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

function StatCard({ title, value, variant = 'default' }) {
  const variants = {
    default: 'border-primary/20 bg-primary/5',
    green: 'border-primary/30 bg-primary/10',
    blue: 'border-primary/20 bg-primary/5',
    orange: 'border-primary/25 bg-primary/8',
  };
  return (
    <Card className={variants[variant]}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [weeklyStats, setWeeklyStats] = useState([]);
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

      setWeeklyStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="py-12 text-center text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const currentWeek = weeklyStats[0] || { totalAttendance: 0, newMembers: 0, returningMembers: 0 };
  const avgAttendance = weeklyStats.length > 0
    ? Math.round(weeklyStats.reduce((sum, week) => sum + week.totalAttendance, 0) / weeklyStats.length)
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="This Week's Attendance" value={currentWeek.totalAttendance} variant="blue" />
            <StatCard title="New Members This Week" value={currentWeek.newMembers} variant="green" />
            <StatCard title="Returning Members" value={currentWeek.returningMembers} variant="orange" />
            <StatCard title="Average Weekly Attendance" value={avgAttendance} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Weekly Trends</CardTitle>
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
    </div>
  );
}

export default Dashboard;
