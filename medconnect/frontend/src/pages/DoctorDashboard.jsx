import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Edit2, CalendarRange, FileText } from 'lucide-react';
import { format, isAfter } from 'date-fns';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [availForm, setAvailForm] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/doctors/${user.id}/appointments`).then(({ data }) => setAppointments(data)).catch(() => setAppointments([])).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/doctors/${user.id}/availability`).then(({ data }) => {
      setAvailability(data);
      if (data.length === 0) {
        setAvailForm([{ day_of_week: 'Monday', start_time: '09:00', end_time: '17:00', is_available: true }]);
      } else {
        setAvailForm(data.map(a => ({ day_of_week: a.day_of_week, start_time: a.start_time?.slice(0, 5) || '09:00', end_time: a.end_time?.slice(0, 5) || '17:00', is_available: a.is_available })));
      }
    }).catch(() => setAvailability([]));
  }, [user?.id]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(a => a.appointment_date === today && ['pending', 'confirmed'].includes(a.status));
  const pending = appointments.filter(a => a.status === 'pending').slice(0, 5);
  const upcomingAppointments = appointments
    .filter(a => isAfter(new Date(a.appointment_date), new Date(today)) && ['pending', 'confirmed'].includes(a.status))
    .sort((a, b) => new Date(a.appointment_date + 'T' + a.appointment_time) - new Date(b.appointment_date + 'T' + b.appointment_time))
    .slice(0, 8);
  const recentPrescriptions = appointments
    .filter(a => a.prescription && a.status === 'completed')
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5);

  const handleConfirm = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'confirmed' });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const saveAvailability = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/doctors/availability', { availability: availForm });
      setAvailability(data);
      setShowAvailabilityForm(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save availability');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'rejected' });
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Welcome, {user?.full_name}</h1>
      <p className="text-gray-600 mb-8">Manage your schedule and appointments</p>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Today's Appointments
          </h2>
          {loading ? <p>Loading...</p> : todayAppointments.length === 0 ? (
            <p className="text-gray-500">No appointments today</p>
          ) : (
            <ul className="space-y-3">
              {todayAppointments.map((a) => (
                <li key={a.id} className="border rounded-lg p-3">
                  <p className="font-medium">{a.patient_name}</p>
                  <p className="text-sm text-gray-600">{a.appointment_time?.slice(0, 5)} - {a.consultation_type}</p>
                  <div className="flex gap-2 mt-2">
                    <Link to={`/appointments/${a.id}`} className="text-primary-600 text-sm font-medium">View</Link>
                    {a.consultation_type === 'video' && a.meeting_link && (
                      <a href={a.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm font-medium">Join Video</a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Pending Requests
          </h2>
          {loading ? <p>Loading...</p> : pending.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((a) => (
                <li key={a.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{a.patient_name}</p>
                    <p className="text-sm text-gray-600">{format(new Date(a.appointment_date), 'MMM d')} at {a.appointment_time?.slice(0, 5)}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Link to={`/appointments/${a.id}`} className="text-primary-600 text-sm font-medium">View</Link>
                    <button onClick={() => handleConfirm(a.id)} className="text-green-600 font-medium text-sm">Accept</button>
                    <button onClick={() => handleReject(a.id)} className="text-red-600 font-medium text-sm">Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarRange className="w-5 h-5" /> Upcoming Appointments
          </h2>
          {loading ? <p>Loading...</p> : upcomingAppointments.length === 0 ? (
            <p className="text-gray-500">No upcoming appointments scheduled</p>
          ) : (
            <ul className="space-y-3">
              {upcomingAppointments.map((a) => (
                <li key={a.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{a.patient_name}</p>
                    <p className="text-sm text-gray-600">{format(new Date(a.appointment_date), 'EEE, MMM d')} at {a.appointment_time?.slice(0, 5)} · {a.consultation_type}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/appointments/${a.id}`} className="text-primary-600 text-sm font-medium">View</Link>
                    {a.consultation_type === 'video' && a.meeting_link && (
                      <a href={a.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm font-medium">Join Video</a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Recent Prescriptions
          </h2>
          {loading ? <p>Loading...</p> : recentPrescriptions.length === 0 ? (
            <p className="text-gray-500">No prescriptions written yet</p>
          ) : (
            <ul className="space-y-3">
              {recentPrescriptions.map((a) => (
                <li key={a.id} className="border rounded-lg p-3">
                  <p className="font-medium">{a.patient_name}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{a.prescription}</p>
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(a.appointment_date), 'MMM d, yyyy')}</p>
                  <Link to={`/appointments/${a.id}`} className="text-primary-600 text-sm font-medium mt-2 inline-block">View appointment</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="card mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Availability Schedule</h2>
          <button onClick={() => setShowAvailabilityForm(!showAvailabilityForm)} className="text-primary-600 flex items-center gap-1 text-sm">
            <Edit2 className="w-4 h-4" /> {showAvailabilityForm ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {showAvailabilityForm ? (
          <form onSubmit={saveAvailability} className="space-y-4">
            {availForm.map((a, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-center">
                <select value={a.day_of_week} onChange={(e) => setAvailForm(prev => prev.map((x, j) => j === i ? { ...x, day_of_week: e.target.value } : x))} className="input-field w-32">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="time" value={a.start_time} onChange={(e) => setAvailForm(prev => prev.map((x, j) => j === i ? { ...x, start_time: e.target.value } : x))} className="input-field w-28" />
                <span>-</span>
                <input type="time" value={a.end_time} onChange={(e) => setAvailForm(prev => prev.map((x, j) => j === i ? { ...x, end_time: e.target.value } : x))} className="input-field w-28" />
                <button type="button" onClick={() => setAvailForm(prev => prev.filter((_, j) => j !== i))} className="text-red-600 text-sm">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setAvailForm(prev => [...prev, { day_of_week: 'Monday', start_time: '09:00', end_time: '17:00', is_available: true }])} className="text-primary-600 text-sm">+ Add slot</button>
            <div><button type="submit" className="btn-primary">Save Availability</button></div>
          </form>
        ) : availability.length === 0 ? (
          <p className="text-gray-500">No availability set. Click Edit to add your schedule.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {availability.map((a) => (
              <div key={a.id} className="border rounded p-2">
                <p className="font-medium">{a.day_of_week}</p>
                <p className="text-sm text-gray-600">{a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
