import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Calendar, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/statistics').then(({ data }) => setStats(data)).catch(() => setStats(null));
    api.get('/admin/users?limit=10').then(({ data }) => setUsers(data)).catch(() => setUsers([]));
    api.get('/admin/appointments?limit=10').then(({ data }) => setAppointments(data)).catch(() => setAppointments([]));
  }, []);

  useEffect(() => {
    if (stats !== null && users.length >= 0) setLoading(false);
  }, [stats, users]);

  const handleVerify = async (doctorId) => {
    try {
      await api.put(`/admin/doctors/${doctorId}/verify`);
      setUsers(prev => prev.map(u => u.id === doctorId ? { ...u, verified: true } : u));
      if (stats) setStats({ ...stats, verifiedDoctors: stats.verifiedDoctors + 1 });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card flex items-center gap-4">
            <Users className="w-10 h-10 text-primary-600" />
            <div>
              <p className="text-2xl font-bold">{stats.users?.patient + stats.users?.doctor || 0}</p>
              <p className="text-gray-600">Total Users</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <Activity className="w-10 h-10 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{stats.verifiedDoctors || 0}</p>
              <p className="text-gray-600">Verified Doctors</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <Calendar className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{stats.totalAppointments || 0}</p>
              <p className="text-gray-600">Total Appointments</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold">{stats.cancellationRate || 0}%</p>
              <p className="text-gray-600">Cancellation Rate</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {users.slice(0, 10).map((u) => (
                <li key={u.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span>{u.full_name} ({u.role})</span>
                  {u.role === 'doctor' && (
                    <button onClick={() => handleVerify(u.id)} className="text-primary-600 text-sm">Verify</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Appointments</h2>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {appointments.slice(0, 10).map((a) => (
                <li key={a.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span>{a.patient_name} → {a.doctor_name}</span>
                  <span className="text-sm text-gray-500">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
