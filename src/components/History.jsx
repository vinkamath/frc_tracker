import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { format, startOfWeek } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [pendingUndo, setPendingUndo] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const undoTimeoutRef = useRef(null);

  const clearUndoTimer = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  useEffect(() => () => clearUndoTimer(), []);

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
      const attendance = attendanceSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const dateStr = data.date;
        const weekStart =
          data.weekStart ||
          format(startOfWeek(new Date(`${dateStr}T12:00:00`)), 'yyyy-MM-dd');
        return {
          id: docSnap.id,
          memberName: membersMap.get(data.memberId) || 'Unknown',
          memberId: data.memberId,
          date: dateStr,
          weekStart,
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

  const handleRemoveCheckIn = async (record) => {
    const dateLabel = format(new Date(record.date), 'MMM d, yyyy');
    if (
      !confirm(
        `Remove check-in for ${record.memberName} on ${dateLabel} at ${format(new Date(record.timestamp), 'h:mm a')}?`
      )
    ) {
      return;
    }

    clearUndoTimer();
    setPendingUndo(null);
    setDeletingId(record.id);
    try {
      await deleteDoc(doc(db, 'attendance', record.id));
      setAttendanceData(prev => prev.filter(r => r.id !== record.id));
      setPendingUndo(record);
      undoTimeoutRef.current = setTimeout(() => {
        setPendingUndo(null);
        undoTimeoutRef.current = null;
      }, 10000);
    } catch (error) {
      console.error('Error removing check-in:', error);
      alert('Could not remove check-in. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUndoRemove = async () => {
    if (!pendingUndo) return;
    clearUndoTimer();
    const snapshot = pendingUndo;
    setPendingUndo(null);
    try {
      await setDoc(doc(db, 'attendance', snapshot.id), {
        memberId: snapshot.memberId,
        date: snapshot.date,
        weekStart: snapshot.weekStart,
        timestamp: snapshot.timestamp
      });
      await loadAttendanceHistory();
    } catch (error) {
      console.error('Error restoring check-in:', error);
      alert('Could not undo. The check-in was removed; add it again from Check In if needed.');
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
        <div className="py-16 text-center font-medium text-muted-foreground motion-safe:animate-pulse motion-reduce:animate-none">
          Loading attendance history…
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const groupedData = groupByDate(filteredData);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Card className="border-primary/10 shadow-md">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">Log</p>
            <CardTitle className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Attendance history
            </CardTitle>
          </div>
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
        <CardContent className="space-y-4">
          {pendingUndo && (
            <Alert className="flex flex-col gap-3 border-primary/20 bg-primary/5 sm:flex-row sm:items-center sm:justify-between">
              <AlertDescription className="text-foreground">
                Check-in removed for{' '}
                <span className="font-medium">{pendingUndo.memberName}</span> (
                {format(new Date(pendingUndo.timestamp), 'h:mm a')}
                ).
              </AlertDescription>
              <div className="flex shrink-0 gap-2 sm:justify-end">
                <Button type="button" size="sm" variant="outline" onClick={() => {
                  clearUndoTimer();
                  setPendingUndo(null);
                }}>
                  Dismiss
                </Button>
                <Button type="button" size="sm" onClick={handleUndoRemove}>
                  Undo
                </Button>
              </div>
            </Alert>
          )}
          {filteredData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <h3 className="mb-2 font-medium text-foreground">No attendance records</h3>
              <p>Start checking in members to see history</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedData.map(({ date, records }) => (
                <div key={date}>
                  <h3 className="mb-4 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
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
                        <TableHead className="w-[1%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.memberName}</TableCell>
                          <TableCell>{format(new Date(record.timestamp), 'h:mm a')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={deletingId === record.id}
                              aria-label={`Remove check-in for ${record.memberName}`}
                              onClick={() => handleRemoveCheckIn(record)}
                            >
                              <Trash2 />
                            </Button>
                          </TableCell>
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
