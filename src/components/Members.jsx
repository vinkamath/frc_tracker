import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [memberStats, setMemberStats] = useState({});

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
        stats[member.id] = {
          totalRuns: 0,
          lastAttendance: null
        };
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

    try {
      await addDoc(collection(db, 'members'), {
        name: newMemberName.trim(),
        joinedDate: format(new Date(), 'yyyy-MM-dd'),
        createdAt: new Date().toISOString()
      });

      setNewMemberName('');
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
      <div className="container">
        <div className="loading">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Members</h2>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Add Member
          </button>
        </div>

        {members.length === 0 ? (
          <div className="empty-state">
            <h3>No members yet</h3>
            <p>Click "Add Member" to add your first member</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Joined</th>
                  <th>Total Runs</th>
                  <th>Last Attendance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  const stats = memberStats[member.id] || { totalRuns: 0, lastAttendance: null };
                  return (
                    <tr key={member.id}>
                      <td style={{ fontWeight: '500' }}>{member.name}</td>
                      <td>
                        {member.joinedDate
                          ? format(new Date(member.joinedDate), 'MMM d, yyyy')
                          : 'N/A'}
                      </td>
                      <td>{stats.totalRuns}</td>
                      <td>
                        {stats.lastAttendance
                          ? format(new Date(stats.lastAttendance), 'MMM d, yyyy')
                          : 'Never'}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="input-group">
                <label>Member Name</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter member name"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;
