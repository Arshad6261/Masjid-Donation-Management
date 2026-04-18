import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Bell, Check, X, ShieldAlert, ShieldCheck, Info } from 'lucide-react';

export default function NotificationPanel({ onClose }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const res = await api.get(`/notifications?page=${page}&limit=10`);
      return res.data;
    }
  });

  const readMutation = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadCount']);
    }
  });

  const handleRead = (id, isRead) => {
    if (!isRead) {
      readMutation.mutate(id);
    }
  };

  return (
    <div className="absolute top-12 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-500" /> सूचनाएं (Notifications)
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">लोड हो रहा है...</div>
        ) : data?.notifications?.length === 0 ? (
          <div className="p-8 text-center text-slate-500">कोई नई सूचना नहीं है।</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data?.notifications?.map((notif) => {
              const Icon = notif.type === 'freeze' ? ShieldAlert : notif.type === 'unfreeze' ? ShieldCheck : Info;
              const colorClass = notif.type === 'freeze' ? 'border-l-red-500 text-red-600' : notif.type === 'unfreeze' ? 'border-l-green-500 text-green-600' : 'border-l-blue-500 text-blue-600';
              const bgClass = notif.isRead ? 'bg-white' : 'bg-slate-50';

              return (
                <div 
                  key={notif._id} 
                  onClick={() => handleRead(notif._id, notif.isRead)}
                  className={`p-4 flex gap-3 border-l-4 cursor-pointer hover:bg-slate-100 transition-colors ${colorClass} ${bgClass}`}
                >
                  <div className={`mt-0.5 p-2 rounded-full h-fit flex-shrink-0 ${notif.type === 'freeze' ? 'bg-red-50' : notif.type === 'unfreeze' ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">{notif.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {new Date(notif.createdAt).toLocaleString('hi-IN')}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-dargah-green self-center flex-shrink-0"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data?.pages > 1 && (
        <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            className="text-xs font-medium text-slate-600 hover:text-dargah-green disabled:opacity-50"
          >
            पिछला
          </button>
          <span className="text-xs text-slate-500">{page} / {data.pages}</span>
          <button 
            disabled={page === data.pages} 
            onClick={() => setPage(page + 1)}
            className="text-xs font-medium text-slate-600 hover:text-dargah-green disabled:opacity-50"
          >
            अगला
          </button>
        </div>
      )}
    </div>
  );
}
