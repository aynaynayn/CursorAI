import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    specialization: '',
    license_number: '',
    years_of_experience: '',
    consultation_fee: '',
    bio: '',
    date_of_birth: '',
    blood_type: '',
    allergies: '',
    medical_history: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role,
        phone_number: form.phone_number || undefined,
      };
      if (role === 'doctor') {
        payload.specialization = form.specialization || 'General';
        payload.license_number = form.license_number || undefined;
        payload.years_of_experience = parseInt(form.years_of_experience) || 0;
        payload.consultation_fee = parseFloat(form.consultation_fee) || 0;
        payload.bio = form.bio || undefined;
      } else {
        payload.date_of_birth = form.date_of_birth || undefined;
        payload.blood_type = form.blood_type || undefined;
        payload.allergies = form.allergies || undefined;
        payload.medical_history = form.medical_history || undefined;
      }
      await register(payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-2xl font-bold mb-6">Sign up</h1>
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setRole('patient')}
          className={`flex-1 py-2 rounded-lg font-medium ${role === 'patient' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Patient
        </button>
        <button
          type="button"
          onClick={() => setRole('doctor')}
          className={`flex-1 py-2 rounded-lg font-medium ${role === 'doctor' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Doctor
        </button>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input name="full_name" value={form.full_name} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" minLength={6} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input name="phone_number" value={form.phone_number} onChange={handleChange} className="input-field" />
        </div>
        {role === 'doctor' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input name="specialization" value={form.specialization} onChange={handleChange} className="input-field" placeholder="e.g. Cardiology" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License number</label>
              <input name="license_number" value={form.license_number} onChange={handleChange} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience</label>
                <input name="years_of_experience" type="number" min="0" value={form.years_of_experience} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation fee ($)</label>
                <input name="consultation_fee" type="number" min="0" step="0.01" value={form.consultation_fee} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} className="input-field" rows={3} />
            </div>
          </>
        )}
        {role === 'patient' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
              <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood type</label>
              <input name="blood_type" value={form.blood_type} onChange={handleChange} className="input-field" placeholder="e.g. O+" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <input name="allergies" value={form.allergies} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical history</label>
              <textarea name="medical_history" value={form.medical_history} onChange={handleChange} className="input-field" rows={2} />
            </div>
          </>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600">
        Already have an account? <Link to="/login" className="text-primary-600 font-medium">Log in</Link>
      </p>
    </div>
  );
}
