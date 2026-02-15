import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Video, FileText, Star } from 'lucide-react';

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/appointments/${id}`).then(({ data }) => setAppointment(data)).catch(() => setAppointment(null)).finally(() => setLoading(false));
  }, [id]);

  const handleComplete = async () => {
    try {
      await api.post(`/appointments/${id}/complete`);
      setAppointment(prev => ({ ...prev, status: 'completed' }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post(`/appointments/${id}/prescription`, { prescription });
      setAppointment(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        appointment_id: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      navigate(user?.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Cancellation failed. ' + (err.response?.data?.error?.includes('24 hours') ? '24-hour notice required.' : ''));
    }
  };

  if (loading || !appointment) return <p>Loading...</p>;

  const isDoctor = user?.role === 'doctor' && appointment.doctor_id === user?.id;
  const isPatient = user?.role === 'patient' && appointment.patient_id === user?.id;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Appointment Details</h1>
      <div className="card space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600">Date & Time</p>
            <p className="font-medium">{format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')} at {appointment.appointment_time?.slice(0, 5)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
            'bg-amber-100 text-amber-800'
          }`}>{appointment.status}</span>
        </div>
        <div>
          <p className="text-gray-600">Type</p>
          <p className="font-medium">{appointment.consultation_type}</p>
        </div>
        <div>
          <p className="text-gray-600">{isDoctor ? 'Patient' : 'Doctor'}</p>
          <p className="font-medium">{isDoctor ? appointment.patient_name : appointment.doctor_name}</p>
          <p className="text-sm text-gray-500">{isDoctor ? appointment.patient_email : appointment.doctor_email}</p>
        </div>
        {appointment.notes && (
          <div>
            <p className="text-gray-600">Notes</p>
            <p>{appointment.notes}</p>
          </div>
        )}
        {appointment.consultation_type === 'video' && appointment.meeting_link && (
          <a href={appointment.meeting_link} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
            <Video className="w-4 h-4" /> Join Video Consultation
          </a>
        )}
        {appointment.prescription && (
          <div>
            <p className="text-gray-600 flex items-center gap-1"><FileText className="w-4 h-4" /> Prescription</p>
            <p className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">{appointment.prescription}</p>
          </div>
        )}
        {isDoctor && ['confirmed', 'pending'].includes(appointment.status) && (
          <button onClick={handleComplete} className="btn-primary">Mark as Completed</button>
        )}
        {isDoctor && appointment.status === 'completed' && !appointment.prescription && (
          <form onSubmit={handleAddPrescription} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Add Prescription</label>
            <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} className="input-field" rows={4} required />
            <button type="submit" disabled={submitting} className="btn-primary">Save Prescription</button>
          </form>
        )}
        {isPatient && appointment.status === 'completed' && !reviewSubmitted && (
          <form onSubmit={handleReview} className="space-y-2 pt-4 border-t">
            <p className="font-medium">Leave a Review</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" onClick={() => setReviewRating(r)} className="p-1">
                  <Star className={`w-6 h-6 ${r <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="input-field" rows={2} placeholder="Your review (optional)" />
            <button type="submit" disabled={submitting} className="btn-primary">Submit Review</button>
          </form>
        )}
        {(isDoctor || isPatient) && ['pending', 'confirmed'].includes(appointment.status) && (
          <button onClick={handleCancel} className="btn-secondary text-red-600 hover:bg-red-50">Cancel Appointment</button>
        )}
      </div>
    </div>
  );
}
