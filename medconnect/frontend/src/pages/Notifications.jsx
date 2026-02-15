import { useState, useEffect } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';
import { Bell } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setNotifications(data)).catch(() => setNotifications([])).finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllRead} className="text-primary-600 text-sm font-medium">Mark all as read</button>
        )}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`card cursor-pointer ${!n.is_read ? 'border-l-4 border-primary-600' : ''}`}
            >
              <p className="font-medium">{n.title || 'Notification'}</p>
              <p className="text-sm text-gray-600">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{format(new Date(n.created_at), 'MMM d, yyyy HH:mm')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
