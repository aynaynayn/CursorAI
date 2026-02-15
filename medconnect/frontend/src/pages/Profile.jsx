import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    const form = e.target;
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        full_name: form.full_name.value,
        phone_number: form.phone_number.value || undefined,
      };
      if (user.role === 'doctor') {
        payload.specialization = form.specialization?.value;
        payload.consultation_fee = form.consultation_fee?.value;
        payload.bio = form.bio?.value;
      } else if (user.role === 'patient') {
        payload.date_of_birth = form.date_of_birth?.value || undefined;
        payload.blood_type = form.blood_type?.value || undefined;
        payload.allergies = form.allergies?.value || undefined;
        payload.medical_history = form.medical_history?.value || undefined;
      }
      await api.put(`/${user.role}s/${user.id}`, payload);
      await refreshUser();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {message && <div className={`p-3 rounded-lg mb-4 ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{message}</div>}
      <form onSubmit={handleUpdate} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input name="full_name" defaultValue={user.full_name} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={user.email} className="input-field bg-gray-100" disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input name="phone_number" defaultValue={user.phone_number} className="input-field" />
        </div>
        {user.role === 'doctor' && user.doctor && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input name="specialization" defaultValue={user.doctor.specialization} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation fee ($)</label>
              <input name="consultation_fee" type="number" step="0.01" defaultValue={user.doctor.consultation_fee} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea name="bio" defaultValue={user.doctor.bio} className="input-field" rows={3} />
            </div>
          </>
        )}
        {user.role === 'patient' && user.patient && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
              <input name="date_of_birth" type="date" defaultValue={user.patient.date_of_birth} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood type</label>
              <input name="blood_type" defaultValue={user.patient.blood_type} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <input name="allergies" defaultValue={user.patient.allergies} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical history</label>
              <textarea name="medical_history" defaultValue={user.patient.medical_history} className="input-field" rows={2} />
            </div>
          </>
        )}
        <button type="submit" disabled={loading} className="btn-primary">Save Changes</button>
      </form>
    </div>
  );
}
