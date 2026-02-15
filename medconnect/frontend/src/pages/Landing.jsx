import { Link } from 'react-router-dom';
import { Search, Calendar, Video, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/doctors${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <div>
      <section className="text-center py-16 md:py-24 bg-gradient-to-b from-primary-50 to-white rounded-2xl">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          Healthcare Made <span className="text-primary-600">Simple</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Book appointments, consult with verified doctors, and manage your health — all in one place.
        </p>
        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by doctor name or specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">Find Doctors</button>
        </form>
      </section>

      <section className="grid md:grid-cols-3 gap-6 py-12">
        <div className="card text-center">
          <Calendar className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Easy Booking</h3>
          <p className="text-gray-600">Book appointments in minutes. View available slots and choose a time that works for you.</p>
        </div>
        <div className="card text-center">
          <Video className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Video Consultations</h3>
          <p className="text-gray-600">Connect with doctors from home. Virtual consultations for your convenience.</p>
        </div>
        <div className="card text-center">
          <Shield className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Verified Professionals</h3>
          <p className="text-gray-600">All doctors are verified and credentialed. Your health is in safe hands.</p>
        </div>
      </section>

      <section className="py-12 text-center">
        <h2 className="text-2xl font-bold mb-6">Ready to get started?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register" className="btn-primary">Sign Up as Patient</Link>
          <Link to="/register" className="btn-secondary">Register as Doctor</Link>
        </div>
      </section>
    </div>
  );
}
