import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, X, Shield, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const AREAS = ['Qasim Nagar', 'Sultan Nagar', 'Peer Colony', 'Shah Gali', 'Dargah Road', 'Masjid Lane'];

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', assignedAreas: [], role: 'member' });

  const { data: members } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const { data } = await api.get('/users'); return data; },
    enabled: user?.role === 'admin'
  });

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    return () => { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; };
  }, [showModal]);

  const createMutation = useMutation({
    mutationFn: async (data) => await api.post('/users', data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('सदस्य जोड़ा गया'); setShowModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'त्रुटि')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }) => await api.put(`/users/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('अपडेट हुआ'); setEditUser(null); setShowModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'त्रुटि')
  });

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: '', email: '', phone: '', password: '', assignedAreas: [], role: 'member' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', assignedAreas: u.assignedAreas || [], role: u.role });
    setShowModal(true);
  };

  const toggleArea = (area) => {
    setForm(f => ({
      ...f,
      assignedAreas: f.assignedAreas.includes(area) ? f.assignedAreas.filter(a => a !== area) : [...f.assignedAreas, area]
    }));
  };

  const handleSave = () => {
    if (editUser) {
      updateMutation.mutate({ id: editUser._id, name: form.name, phone: form.phone, assignedAreas: form.assignedAreas, role: form.role, isActive: true });
    } else {
      if (!form.email || !form.password) return toast.error('ईमेल और पासवर्ड ज़रूरी है');
      createMutation.mutate(form);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <Shield className="w-12 h-12 text-dargah-green mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">सदस्य खाता</h2>
        <p className="text-slate-500 mb-4">आप <span className="font-bold">{user?.name}</span> के रूप में लॉगिन हैं</p>
        {user?.assignedAreas?.length > 0 && (
          <div className="flex gap-2 justify-center flex-wrap">
            {user.assignedAreas.map(a => (
              <span key={a} className="px-3 py-1 bg-dargah-cream text-dargah-green rounded-full text-sm font-medium">{a}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">कमेटी सदस्य</h2>
        <button onClick={openAdd} className="flex items-center gap-2 text-white px-4 py-2 rounded-xl font-medium shadow-sm" style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}>
          <Plus className="w-5 h-5" /> सदस्य जोड़ें
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <tr>
                <th className="py-4 px-6 font-semibold">नाम</th>
                <th className="py-4 px-6 font-semibold">फोन</th>
                <th className="py-4 px-6 font-semibold">भूमिका</th>
                <th className="py-4 px-6 font-semibold">नियुक्त क्षेत्र</th>
                <th className="py-4 px-6 font-semibold">स्थिति</th>
                <th className="py-4 px-6 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members?.map(m => (
                <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-dargah-green text-white flex items-center justify-center font-bold text-sm">{m.name?.charAt(0)}</div>
                      <div><p className="font-medium text-slate-800">{m.name}</p><p className="text-xs text-slate-500">{m.email}</p></div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{m.phone || 'नहीं'}</td>
                  <td className="py-4 px-6"><span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${m.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{m.role === 'admin' ? 'प्रशासक' : 'सदस्य'}</span></td>
                  <td className="py-4 px-6">
                    <div className="flex gap-1 flex-wrap">
                      {(m.assignedAreas || []).map(a => <span key={a} className="px-2 py-0.5 bg-dargah-cream text-dargah-green text-xs rounded-full font-medium">{a}</span>)}
                      {(!m.assignedAreas || m.assignedAreas.length === 0) && <span className="text-xs text-slate-400">कोई नहीं</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6"><span className={`px-2 py-1 rounded-full text-xs font-bold ${m.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{m.isActive ? 'सक्रिय' : 'निष्क्रिय'}</span></td>
                  <td className="py-4 px-6"><button onClick={() => openEdit(m)} className="text-sm text-dargah-green font-medium hover:underline">बदलें</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onMouseDown={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{editUser ? 'सदस्य बदलें' : 'सदस्य जोड़ें'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">नाम *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" />
                </div>
                {!editUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ईमेल *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">फोन</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" />
                </div>
                {!editUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">पासवर्ड *</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" />नियुक्त क्षेत्र</label>
                <div className="flex gap-2 flex-wrap">
                  {AREAS.map(area => (
                    <button key={area} type="button" onClick={() => toggleArea(area)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        form.assignedAreas.includes(area) ? 'bg-dargah-green text-white border-dargah-green' : 'bg-white text-slate-600 border-slate-200 hover:border-dargah-green/50'
                      }`}>{area}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl">रद्द</button>
              <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 py-2.5 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}>
                {createMutation.isPending || updateMutation.isPending ? 'सेव हो रहा...' : 'सेव करें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
