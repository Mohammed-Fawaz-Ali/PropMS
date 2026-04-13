import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, Clock, Inbox } from 'lucide-react';
import { getNotifications, markNotificationAsRead } from '../../api/notifications';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });

  const markReadMut = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      toast.success('Notification marked as read');
      queryClient.invalidateQueries(['notifications']);
    }
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading notifications...</div>;

  const notifications = data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Notifications</h2>
          <p className="text-text-muted mt-1">Review your latest alerts and mark them as read when handled.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-200">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No notifications available.</div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className={`p-5 ${notification.isRead ? 'bg-white' : 'bg-slate-50'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {notification.isRead ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Bell className="w-5 h-5 text-indigo-600" />
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                      <p className="text-slate-500 text-sm">{notification.body}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
                    {!notification.isRead && (
                      <button
                        onClick={() => markReadMut.mutate(notification.id)}
                        className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent text-white text-xs px-3 py-1"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
