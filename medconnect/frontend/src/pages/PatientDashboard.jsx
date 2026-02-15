import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/patients/${user.id}/appointments`).then(({ data }) => setAppointments(data)).catch(() => setAppointments([])).finally(() => setLoading(false));
  }, [user?.id]);

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).slice(0, 5);
  const past = appointments.filter(a => ['completed', 'cancelled'].includes(a.status)).slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Welcome, {user?.full_name}</h1>
      <p className="text-gray-600 mb-8">Manage your appointments and health records</p>
      <div className="flex flex-wrap gap-4 mb-8">
        <Link to="/doctors" className="btn-primary flex items-center gap-2">
          <Search className="w-4 h-4" /> Find a Doctor
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Upcoming Appointments
          </h2>
          {loading ? <p>Loading...</p> : upcoming.length === 0 ? (
            <p className="text-gray-500">No upcoming appointments. <Link to="/doctors" className="text-primary-600">Book one</Link></p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((a) => (
                <li key={a.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{a.doctor_name} - {a.specialization}</p>
                    <p className="text-sm text-gray-600">{format(new Date(a.appointment_date), 'MMM d, yyyy')} at {a.appointment_time?.slice(0, 5)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${a.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{a.status}</span>
                  <Link to={`/appointments/${a.id}`} className="text-primary-600 text-sm font-medium">View</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Appointments</h2>
          {loading ? <p>Loading...</p> : past.length === 0 ? (
            <p className="text-gray-500">No past appointments</p>
          ) : (
            <ul className="space-y-3">
              {past.map((a) => (
                <li key={a.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{a.doctor_name} - {a.specialization}</p>
                    <p className="text-sm text-gray-600">{format(new Date(a.appointment_date), 'MMM d, yyyy')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${a.status === 'completed' ? 'bg-gray-100' : 'bg-red-100 text-red-800'}`}>{a.status}</span>
                  <Link to={`/appointments/${a.id}`} className="text-primary-600 text-sm font-medium">View</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
