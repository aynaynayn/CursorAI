import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Star, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [consultationType, setConsultationType] = useState('in-person');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.get(`/doctors/${id}`).then(({ data }) => setDoctor(data)).catch(() => setDoctor(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/doctors/${id}/availability`).then(({ data }) => setAvailability(data)).catch(() => setAvailability([]));
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDate) return;
    api.get(`/appointments/available-slots/${id}/${selectedDate}`).then(({ data }) => setSlots(data)).catch(() => setSlots([]));
  }, [id, selectedDate]);

  const handleBook = async (time) => {
    if (!user || user.role !== 'patient') {
      navigate('/login');
      return;
    }
    setBooking(true);
    try {
      const { data } = await api.post('/appointments', {
        doctor_id: id,
        appointment_date: selectedDate,
        appointment_time: time,
        consultation_type: consultationType,
        notes: notes || undefined,
      });
      navigate(`/appointments/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading || !doctor) return <p>Loading...</p>;

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  return (
    <div className="max-w-4xl">
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{doctor.full_name}</h1>
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-current" /> {doctor.rating || '0'} ({doctor.total_reviews || 0} reviews)
              </span>
            </div>
            <p className="text-primary-600 font-medium mb-2">{doctor.specialization}</p>
            <p className="text-gray-600 mb-4">{doctor.bio || 'No bio provided.'}</p>
            <p className="font-medium">${doctor.consultation_fee || 0} / consultation</p>
          </div>
        </div>
      </div>
      {user?.role === 'patient' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Book an appointment</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Consultation type</label>
            <select value={consultationType} onChange={(e) => setConsultationType(e.target.value)} className="input-field w-48">
              <option value="in-person">In-person</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select date</label>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(format(d, 'yyyy-MM-dd'))}
                  className={`px-3 py-1 rounded-lg text-sm ${selectedDate === format(d, 'yyyy-MM-dd') ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                >
                  {format(d, 'EEE M/d')}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Available times</label>
            <div className="flex flex-wrap gap-2">
              {slots.length === 0 ? <p className="text-gray-500">No slots available</p> : slots.map((t) => (
                <button
                  key={t}
                  onClick={() => handleBook(t)}
                  disabled={booking}
                  className="px-4 py-2 rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={2} placeholder="Any notes for the doctor..." />
          </div>
        </div>
      )}
    </div>
  );
}
