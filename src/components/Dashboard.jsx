import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { format, startOfWeek, addDays } from 'date-fns';

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
        membersMap.set(doc.id, {
          name: data.name,
          joinedDate: data.joinedDate
        });
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
          // Calculate Saturday (weekStart is Monday, so add 5 days)
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
      <div className="container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  const currentWeek = weeklyStats[0] || { totalAttendance: 0, newMembers: 0, returningMembers: 0 };
  const avgAttendance = weeklyStats.length > 0
    ? Math.round(weeklyStats.reduce((sum, week) => sum + week.totalAttendance, 0) / weeklyStats.length)
    : 0;

  return (
    <div className="container">
      <div className="card">
        <h2>Weekly Dashboard</h2>

        <div className="stats-grid">
          <div className="stat-card blue">
            <h3>This Week's Attendance</h3>
            <div className="value">{currentWeek.totalAttendance}</div>
          </div>

          <div className="stat-card green">
            <h3>New Members This Week</h3>
            <div className="value">{currentWeek.newMembers}</div>
          </div>

          <div className="stat-card orange">
            <h3>Returning Members</h3>
            <div className="value">{currentWeek.returningMembers}</div>
          </div>

          <div className="stat-card">
            <h3>Average Weekly Attendance</h3>
            <div className="value">{avgAttendance}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Weekly Trends</h2>

        {weeklyStats.length === 0 ? (
          <div className="empty-state">
            <h3>No data yet</h3>
            <p>Start checking in members to see weekly trends</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Total Attendance</th>
                  <th>New Members</th>
                  <th>Returning Members</th>
                </tr>
              </thead>
              <tbody>
                {weeklyStats.map(week => (
                  <tr key={week.weekStart}>
                    <td style={{ fontWeight: '500' }}>
                      {format(new Date(week.saturday), 'MMM d')}
                    </td>
                    <td>{week.totalAttendance}</td>
                    <td>
                      <span style={{ color: '#27ae60', fontWeight: '500' }}>
                        {week.newMembers}
                      </span>
                    </td>
                    <td>{week.returningMembers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
