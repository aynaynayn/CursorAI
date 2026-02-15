import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, User, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl">
                <Stethoscope className="w-8 h-8" />
                MedConnect
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/doctors" className="text-gray-600 hover:text-primary-600">Find Doctors</Link>
              {user ? (
                <>
                  <Link to="/notifications" className="text-gray-600 hover:text-primary-600">Notifications</Link>
                  <Link to="/profile" className="flex items-center gap-1 text-gray-600 hover:text-primary-600">
                    <User className="w-4 h-4" /> {user.full_name}
                  </Link>
                  {user.role === 'patient' && <Link to="/patient/dashboard" className="btn-primary">Dashboard</Link>}
                  {user.role === 'doctor' && <Link to="/doctor/dashboard" className="btn-primary">Dashboard</Link>}
                  {user.role === 'admin' && <Link to="/admin/dashboard" className="btn-primary">Admin</Link>}
                  <button onClick={logout} className="flex items-center gap-1 text-gray-600 hover:text-red-600">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-primary-600">Login</Link>
                  <Link to="/register" className="btn-primary">Sign Up</Link>
                </>
              )}
            </div>
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden py-2 space-y-2">
              <Link to="/doctors" className="block py-1" onClick={() => setMenuOpen(false)}>Find Doctors</Link>
              {user ? (
                <>
                  <Link to="/notifications" className="block py-1" onClick={() => setMenuOpen(false)}>Notifications</Link>
                  <Link to="/profile" className="block py-1" onClick={() => setMenuOpen(false)}>Profile</Link>
                  {user.role === 'patient' && <Link to="/patient/dashboard" className="block py-1" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
                  {user.role === 'doctor' && <Link to="/doctor/dashboard" className="block py-1" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
                  {user.role === 'admin' && <Link to="/admin/dashboard" className="block py-1" onClick={() => setMenuOpen(false)}>Admin</Link>}
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="block py-1 text-red-600">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block py-1" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="block py-1" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
