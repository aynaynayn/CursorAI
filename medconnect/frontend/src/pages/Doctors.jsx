import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Search, Star } from 'lucide-react';
import { format } from 'date-fns';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(new URLSearchParams(location.search).get('search') || '');
  const [specialization, setSpecialization] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (specialization) params.set('specialization', specialization);
    api.get(`/doctors?${params}`).then(({ data }) => {
      setDoctors(data);
    }).catch(() => setDoctors([])).finally(() => setLoading(false));
  }, [search, specialization]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(e.target.search?.value || '');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Find a Doctor</h1>
      <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 min-w-[200px] flex gap-2">
          <Search className="w-5 h-5 text-gray-400 mt-3" />
          <input
            name="search"
            type="text"
            placeholder="Search by name or specialization"
            defaultValue={search}
            className="input-field"
          />
        </div>
        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="input-field w-48"
        >
          <option value="">All specializations</option>
          {['Cardiology', 'Dermatology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Neurology', 'Psychiatry'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary">Search</button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : doctors.length === 0 ? (
        <p className="text-gray-600">No doctors found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <Link key={doc.id} to={`/doctors/${doc.id}`} className="card hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{doc.full_name}</h3>
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" /> {doc.rating || '0'}
                </span>
              </div>
              <p className="text-primary-600 font-medium text-sm mb-1">{doc.specialization}</p>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{doc.bio || 'No bio'}</p>
              <p className="text-gray-800 font-medium">${doc.consultation_fee || 0} / consultation</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
