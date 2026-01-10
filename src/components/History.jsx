import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

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
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
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

    if (filter === 'today') {
      return attendanceData.filter(record => record.date === today);
    } else if (filter === 'last30') {
      return attendanceData.filter(record => record.date >= lastMonth);
    }

    return attendanceData;
  };

  const groupByDate = (data) => {
    const grouped = new Map();

    data.forEach(record => {
      if (!grouped.has(record.date)) {
        grouped.set(record.date, []);
      }
      grouped.get(record.date).push(record);
    });

    return Array.from(grouped.entries()).map(([date, records]) => ({
      date,
      records
    }));
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading attendance history...</div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const groupedData = groupByDate(filteredData);

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Attendance History</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last30">Last 30 Days</option>
            </select>
            <button className="btn btn-primary" onClick={exportToCSV}>
              Export to CSV
            </button>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="empty-state">
            <h3>No attendance records</h3>
            <p>Start checking in members to see history</p>
          </div>
        ) : (
          <div>
            {groupedData.map(({ date, records }) => (
              <div key={date} style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  <span style={{ color: '#7f8c8d', fontSize: '0.9rem', marginLeft: '1rem' }}>
                    ({records.length} {records.length === 1 ? 'member' : 'members'})
                  </span>
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Member Name</th>
                        <th>Check-in Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(record => (
                        <tr key={record.id}>
                          <td style={{ fontWeight: '500' }}>{record.memberName}</td>
                          <td>{format(new Date(record.timestamp), 'h:mm a')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
