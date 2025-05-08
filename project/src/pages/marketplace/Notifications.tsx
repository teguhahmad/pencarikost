import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Bell, Building2, CreditCard, User, Loader2, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import FloatingNav from '../../components/ui/FloatingNav';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'property' | 'payment' | 'user';
  status: 'read' | 'unread';
  created_at: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      const { data, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('target_user_id', user.id)
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', id);

      if (error) throw error;
      await loadNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('target_user_id', user.id)
        .eq('status', 'unread');

      if (error) throw error;
      await loadNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to update notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Building2 size={20} className="text-blue-500" />;
      case 'payment':
        return <CreditCard size={20} className="text-green-500" />;
      case 'user':
        return <User size={20} className="text-purple-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} belum dibaca</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                icon={<CheckCircle size={16} />}
              >
                Tandai Semua Dibaca
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm p-4 ${
                  notification.status === 'unread' ? 'border-l-4 border-blue-500' : ''
                }`}
                onClick={() => {
                  if (notification.status === 'unread') {
                    markAsRead(notification.id);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-50 rounded-full">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {format(new Date(notification.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </p>
                  </div>
                  {notification.status === 'unread' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada notifikasi</h3>
              <p className="text-gray-500">
                Anda akan menerima notifikasi tentang properti dan pembayaran di sini
              </p>
            </div>
          )}
        </div>
      </div>

      <FloatingNav />
    </div>
  );
};

export default Notifications;