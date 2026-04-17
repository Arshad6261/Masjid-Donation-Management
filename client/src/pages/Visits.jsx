import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Map, Plus, CheckCircle, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Visits() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    return () => { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; };
  }, [showAddModal]);

  const { data: visits, isLoading } = useQuery({
    queryKey: ['visits'],
    queryFn: async () => { const { data } = await api.get('/visits'); return data; }
  });

  const statusLabels = { planned: 'निर्धारित', in_progress: 'चालू', completed: 'पूर्ण' };

  const mutation = useMutation({
    mutationFn: async (data) => await api.post('/visits', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['visits']);
      toast.success('दौरा निर्धारित हुआ');
      setShowAddModal(false);
      navigate(`/visits/${res.data._id}`);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'त्रुटि')
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">वसूली दौरे</h2>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
          style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}>
          <Plus className="w-5 h-5" /> दौरा निर्धारित करें
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse"></div>)
        ) : visits?.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl shadow-sm border border-slate-100">
            <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-lg">कोई दौरा निर्धारित नहीं।</p>
          </div>
        ) : (
          visits?.map(visit => {
            const donorCount = visit.donorsVisited?.length || 0;
            const collectedCount = visit.donorsVisited?.filter(d => d.collected || d.alreadyPaid).length || 0;
            const progressPct = donorCount ? Math.round((collectedCount / donorCount) * 100) : 0;
            
            return (
              <div key={visit._id} onClick={() => navigate(`/visits/${visit._id}`)}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:border-dargah-green/30 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-dargah-green transition-colors">{visit.area}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                      <Calendar className="w-3 h-3" /> {new Date(visit.visitDate).toLocaleDateString('hi-IN')}
                    </div>
                  </div>
                  {visit.status === 'completed' ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold"><CheckCircle className="w-4 h-4" /> पूर्ण</span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold"><Clock className="w-4 h-4" /> {statusLabels[visit.status] || visit.status}</span>
                  )}
                </div>
                
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">घर:</span>
                    <span className="font-semibold text-slate-700">{donorCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">वसूली:</span>
                    <span className="font-semibold text-dargah-green">₹{(visit.totalCollected || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-dargah-gold transition-all" style={{ width: `${progressPct}%` }}></div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onMouseDown={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">वसूली दौरा निर्धारित करें</h3>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!newArea) return toast.error('क्षेत्र डालें'); mutation.mutate({ area: newArea, visitDate: newDate }); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">क्षेत्र का नाम *</label>
                <input type="text" value={newArea} onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-dargah-green/30 outline-none"
                  placeholder="जैसे सुल्तान नगर" autoFocus />
                <p className="text-xs text-slate-500 mt-1">इस क्षेत्र के सक्रिय दानदाता स्वतः जुड़ जाएंगे।</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">तारीख *</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl">रद्द</button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 text-white font-medium rounded-xl" style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}>
                  {mutation.isPending ? 'निर्धारित हो रहा...' : 'निर्धारित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
