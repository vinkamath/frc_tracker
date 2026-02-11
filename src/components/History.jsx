import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
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

function History() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  const loadAttendanceHistory = async () => {
    try {
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const membersMap = new Map();
      membersSnapshot.docs.forEach(doc => {
        membersMap.set(doc.id, doc.data().name);
      });

      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      const attendance = attendanceSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          memberName: membersMap.get(data.memberId) || 'Unknown',
          memberId: data.memberId,
          date: data.date,
          timestamp: data.timestamp
        };
      });

      attendance.sort((a, b) => b.date.localeCompare(a.date) || b.timestamp.localeCompare(a.timestamp));
      setAttendanceData(attendance);
      setLoading(false);
    } catch (error) {
      console.error('Error loading attendance history:', error);
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (attendanceData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Member Name', 'Check-in Time'];
    const rows = attendanceData.map(record => [
      record.date,
      record.memberName,
      format(new Date(record.timestamp), 'h:mm a')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredData = () => {
    if (filter === 'all') return attendanceData;
    const today = format(new Date(), 'yyyy-MM-dd');
    const lastMonth = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    if (filter === 'today') return attendanceData.filter(record => record.date === today);
    if (filter === 'last30') return attendanceData.filter(record => record.date >= lastMonth);
    return attendanceData;
  };

  const groupByDate = (data) => {
    const grouped = new Map();
    data.forEach(record => {
      if (!grouped.has(record.date)) grouped.set(record.date, []);
      grouped.get(record.date).push(record);
    });
    return Array.from(grouped.entries()).map(([date, records]) => ({ date, records }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="py-12 text-center text-muted-foreground">Loading attendance history...</div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const groupedData = groupByDate(filteredData);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Attendance History</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last30">Last 30 Days</option>
            </select>
            <Button onClick={exportToCSV}>Export to CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <h3 className="mb-2 font-medium text-foreground">No attendance records</h3>
              <p>Start checking in members to see history</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedData.map(({ date, records }) => (
                <div key={date}>
                  <h3 className="mb-4 text-base font-medium">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    <span className="ml-3 text-sm font-normal text-muted-foreground">
                      ({records.length} {records.length === 1 ? 'member' : 'members'})
                    </span>
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member Name</TableHead>
                        <TableHead>Check-in Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.memberName}</TableCell>
                          <TableCell>{format(new Date(record.timestamp), 'h:mm a')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default History;
