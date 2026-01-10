import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek } from 'date-fns';

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
    if (checkedInToday.has(memberId)) {
      return;
    }

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
      <div className="container">
        <div className="loading">Loading members...</div>
      </div>
    );
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      <div className="card">
        <h2>Who came to the run today?</h2>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {members.length === 0 ? (
          <div className="empty-state">
            <h3>No members found</h3>
            <p>Add members in the Members section to get started</p>
          </div>
        ) : (
          <>
            <div className="input-group">
              <input
                type="text"
                placeholder="Search for your name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '1.1rem' }}
              />
            </div>

            {filteredMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
                No members found matching "{searchQuery}"
              </div>
            ) : (
              <div className="member-grid">
                {filteredMembers.map(member => (
                <div
                  key={member.id}
                  className={`member-card ${
                    selectedMembers.includes(member.id) ? 'selected' : ''
                  } ${checkedInToday.has(member.id) ? 'checked-in' : ''}`}
                  onClick={() => toggleMember(member.id)}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                    {member.name}
                  </div>
                  {checkedInToday.has(member.id) && (
                    <div style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '0.25rem' }}>
                      ✓ Checked in
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-success"
                onClick={handleCheckIn}
                disabled={selectedMembers.length === 0}
              >
                Check In ({selectedMembers.length})
              </button>
              {selectedMembers.length > 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedMembers([])}
                >
                  Clear Selection
                </button>
              )}
              {searchQuery && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '1rem' }}>
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </div>
    </div>
  );
}

export default CheckIn;
