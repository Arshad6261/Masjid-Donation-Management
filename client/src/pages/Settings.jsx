import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, X, Shield, MapPin, Power, PowerOff, QrCode, Download, Printer, CheckCircle, XCircle, Send, RefreshCw, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const AREAS = ['Qasim Nagar', 'Sultan Nagar', 'Peer Colony', 'Shah Gali', 'Dargah Road', 'Masjid Lane'];

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('system');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', assignedAreas: [], role: 'member' });
  const [freezeReason, setFreezeReason] = useState('');

  const { data: freezeStatus } = useQuery({
    queryKey: ['freezeStatus'],
    queryFn: async () => { const { data } = await api.get('/admin/freeze-status'); return data; },
    enabled: user?.role === 'admin'
  });

  const { data: members } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const { data } = await api.get('/users'); return data; },
    enabled: user?.role === 'admin'
  });

  const { data: pendingDonors } = useQuery({
    queryKey: ['pendingDonors'],
    queryFn: async () => { const { data } = await api.get('/donors?pending=true'); return data; },
    enabled: user?.role === 'admin' && activeTab === 'qr'
  });

  const { data: qrData } = useQuery({
    queryKey: ['qrCode'],
    queryFn: async () => { const { data } = await api.get('/donors/qr-code'); return data; },
    enabled: user?.role === 'admin' && activeTab === 'qr'
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

  const freezeMutation = useMutation({
    mutationFn: async (reason) => await api.post('/admin/freeze-donations', { reason }),
    onSuccess: () => { 
      queryClient.invalidateQueries(['freezeStatus']); 
      toast.success('सिस्टम फ्रीज किया गया'); 
      setFreezeReason('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'त्रुटि')
  });

  const unfreezeMutation = useMutation({
    mutationFn: async () => await api.post('/admin/unfreeze-donations'),
    onSuccess: () => { 
      queryClient.invalidateQueries(['freezeStatus']); 
      toast.success('सिस्टम अनफ्रीज किया गया'); 
    },
    onError: (e) => toast.error(e.response?.data?.message || 'त्रुटि')
  });

  const removeMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/users/${id}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['users']);
      if (data.deactivated) {
        toast.success(`सदस्य निष्क्रिय (Inactive)। ${data.donationCount} चंदे जुड़े हैं।`);
      } else if (data.deleted) {
        toast.success('सदस्य सफलतापूर्वक हटा दिया गया।');
      }
    },
    onError: (e) => toast.error(e.response?.data?.message || 'हटाने में त्रुटि')
  });

  const handleRemove = (m) => {
    if (window.confirm(`क्या आप वाकई ${m.name} को हटाना चाहते हैं?`)) {
      removeMutation.mutate(m._id);
    }
  };

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
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button onClick={() => setActiveTab('system')} className={`px-6 py-3 font-bold text-sm whitespace-nowrap ${activeTab === 'system' ? 'border-b-2 border-dargah-green text-dargah-green' : 'text-slate-500'}`}>System & Team</button>
        <button onClick={() => setActiveTab('qr')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'qr' ? 'border-b-2 border-dargah-green text-dargah-green' : 'text-slate-500'}`}>
          QR Registration
          {pendingDonors?.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingDonors.length} Pending</span>}
        </button>
        <button onClick={() => setActiveTab('sms')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'sms' ? 'border-b-2 border-dargah-green text-dargah-green' : 'text-slate-500'}`}>
          <MessageSquare className="w-4 h-4" /> SMS & Notifications
        </button>
      </div>

      {activeTab === 'system' && (
        <>
          {/* System Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-600" />
            सिस्टम नियंत्रण (System Controls)
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${freezeStatus?.isFrozen ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {freezeStatus?.isFrozen ? 'FROZEN' : 'ACTIVE'}
          </span>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            सिस्टम फ्रीज करने पर समिति के सदस्य कोई नई रसीद या चंदा नहीं जोड़ पाएंगे। इसे व्यवस्थापन या ऑडिट के समय उपयोग करें।
          </p>
          
          {freezeStatus?.isFrozen ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h4 className="font-bold text-red-800">सिस्टम अभी फ्रीज है (System is Frozen)</h4>
                <p className="text-sm text-red-600 mt-1">कारण: {freezeStatus.reason || 'N/A'}</p>
                <p className="text-xs text-red-500 mt-1">तिथि: {freezeStatus.frozenAt ? new Date(freezeStatus.frozenAt).toLocaleString('hi-IN') : 'N/A'}</p>
              </div>
              <button 
                onClick={() => unfreezeMutation.mutate()}
                disabled={unfreezeMutation.isPending}
                className="flex items-center gap-2 bg-white text-green-600 border border-green-600 hover:bg-green-50 px-4 py-2 rounded-xl font-medium transition-colors"
              >
                <Power className="w-5 h-5" /> अनफ्रीज करें
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="फ्रीज करने का कारण दर्ज करें..." 
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              <button 
                onClick={() => freezeMutation.mutate(freezeReason)}
                disabled={freezeMutation.isPending}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap"
              >
                <PowerOff className="w-5 h-5" /> फ्रीज करें
              </button>
            </div>
          )}
        </div>
      </div>

      <hr className="border-slate-200" />

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
                  <td className="py-4 px-6 flex gap-3">
                    <button onClick={() => openEdit(m)} className="text-sm text-dargah-green font-medium hover:underline">बदलें</button>
                    {m.isActive ? (
                      <button onClick={() => handleRemove(m)} className="text-sm text-red-600 font-medium hover:underline flex items-center gap-1">हटाएं</button>
                    ) : (
                      <button onClick={() => updateMutation.mutate({ id: m._id, isActive: true })} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">सक्रिय करें</button>
                    )}
                  </td>
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
      </>)}

      {activeTab === 'qr' && (
        <QRRegistrationTab qrData={qrData} pendingDonors={pendingDonors} queryClient={queryClient} />
      )}

      {activeTab === 'sms' && (
        <SMSSettingsTab />
      )}
    </div>
  );
}

function QRRegistrationTab({ qrData, pendingDonors, queryClient }) {
  const approveMutation = useMutation({
    mutationFn: async (id) => await api.patch(`/donors/${id}/approve`),
    onSuccess: () => { queryClient.invalidateQueries(['pendingDonors']); toast.success('Donor approved!'); },
    onError: () => toast.error('Error approving donor')
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => await api.patch(`/donors/${id}/reject`),
    onSuccess: () => { queryClient.invalidateQueries(['pendingDonors']); toast.success('Donor rejected'); },
    onError: () => toast.error('Error rejecting donor')
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title></head>
        <body style="text-align: center; font-family: sans-serif; padding: 50px;">
          <h2>Hazrat Sultan Sha Peer</h2>
          <h3>Scan to Register as a Donor</h3>
          <img src="${qrData?.qrDataUrl}" style="width: 300px; margin: 20px 0;" />
          <p>Or visit: ${qrData?.registrationUrl}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-8 items-center">
        {qrData ? (
          <>
            <div className="shrink-0 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <img src={qrData.qrDataUrl} alt="Registration QR Code" className="w-48 h-48 mx-auto" />
              <p className="text-xs text-slate-500 mt-2 font-mono break-all w-48">{qrData.registrationUrl}</p>
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Public Registration QR</h3>
                <p className="text-slate-500 mt-1">Print and display this QR code at the masjid notice board or dargah entrance. Visitors can scan it to self-register as donors.</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <a href={qrData.qrDataUrl} download="Masjid_Donor_QR.png" className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-colors">
                  <Download className="w-5 h-5" /> Download PNG
                </a>
                <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-dargah-green hover:bg-dargah-green-dark text-white rounded-xl font-medium transition-colors">
                  <Printer className="w-5 h-5" /> Print QR
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="p-8 text-slate-500 w-full text-center">Loading QR Code...</p>
        )}
      </div>

      <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-dargah-green" /> Pending Approvals ({pendingDonors?.length || 0})
      </h3>
      
      {pendingDonors?.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          No pending donor registrations at this time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingDonors?.map(d => (
            <div key={d._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">QR Registration</div>
              <h4 className="font-bold text-slate-800 text-lg mt-2">{d.name}</h4>
              <p className="text-sm font-mono text-slate-600 my-1">{d.phone}</p>
              <div className="text-sm text-slate-500 space-y-1 mb-4">
                <p><MapPin className="inline w-3 h-3" /> {d.area} ({d.address?.houseNo ? d.address.houseNo + ', ' : ''}{d.address?.street || ''})</p>
                <p>Fund: <strong>{d.fundType}</strong></p>
                {d.monthlyAmount > 0 && <p>Commitment: <strong>₹{d.monthlyAmount}</strong></p>}
                <p className="text-xs mt-2 text-slate-400">Reg: {new Date(d.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveMutation.mutate(d._id)} disabled={approveMutation.isPending} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => rejectMutation.mutate(d._id)} disabled={rejectMutation.isPending} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-colors">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SMSSettingsTab() {
  const [testPhone, setTestPhone] = useState('');
  const [logPage, setLogPage] = useState(1);

  const { data: smsSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['smsSettings'],
    queryFn: async () => { const { data } = await api.get('/sms/settings'); return data; }
  });

  const { data: smsStats } = useQuery({
    queryKey: ['smsStats'],
    queryFn: async () => { const { data } = await api.get('/sms/stats'); return data; }
  });

  const { data: smsLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['smsLogs', logPage],
    queryFn: async () => { const { data } = await api.get(`/sms/logs?page=${logPage}`); return data; }
  });

  const testMutation = useMutation({
    mutationFn: async (phone) => { const { data } = await api.post('/sms/test', { phone }); return data; },
    onSuccess: (data) => {
      if (data.success) toast.success('Test SMS sent!');
      else toast.error(data.error || 'Failed to send test SMS');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error')
  });

  const settingsMutation = useMutation({
    mutationFn: async (settings) => { const { data } = await api.put('/sms/settings', settings); return data; },
    onSuccess: () => { refetchSettings(); toast.success('Settings saved'); },
    onError: () => toast.error('Failed to save settings')
  });

  const [localSettings, setLocalSettings] = useState(null);
  React.useEffect(() => {
    if (smsSettings && !localSettings) setLocalSettings(smsSettings);
  }, [smsSettings]);

  return (
    <div className="space-y-6">
      {/* SMS Gateway & Test */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" /> SMS Gateway
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase font-medium">Gateway Status</p>
            <p className="text-sm font-medium text-slate-700 mt-1">{smsSettings?.enabled ? '✅ Active' : '❌ Disabled'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase font-medium mb-2">Test SMS</p>
            <div className="flex gap-2">
              <input type="text" value={testPhone} onChange={e => setTestPhone(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" placeholder="9876543210" />
              <button onClick={() => testMutation.mutate(testPhone)} disabled={testMutation.isPending || !testPhone}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg disabled:opacity-50">
                {testMutation.isPending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Toggles */}
      {localSettings && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Behavior Settings</h3>
          <div className="space-y-4">
            {[
              { key: 'enabled', label: 'SMS Enabled (Master Switch)' },
              { key: 'sendOnDonation', label: 'Auto-send on new donation' },
              { key: 'sendOnlyIfNoWhatsApp', label: 'SMS only for donors without WhatsApp' },
              { key: 'whatsAppFallbackEnabled', label: 'WhatsApp fallback button enabled' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <input type="checkbox" checked={localSettings[key] || false}
                  onChange={e => setLocalSettings({ ...localSettings, [key]: e.target.checked })}
                  className="w-5 h-5 text-dargah-green rounded" />
              </label>
            ))}
          </div>
          <button onClick={() => settingsMutation.mutate(localSettings)} disabled={settingsMutation.isPending}
            className="mt-4 px-5 py-2.5 bg-dargah-green text-white font-bold rounded-xl">
            {settingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Stats */}
      {smsStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border-l-4 border-green-500 shadow-sm">
            <p className="text-xs text-slate-500 uppercase">SMS Sent</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{smsStats.sent}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-red-500 shadow-sm">
            <p className="text-xs text-slate-500 uppercase">SMS Failed</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{smsStats.failed}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-blue-500 shadow-sm">
            <p className="text-xs text-slate-500 uppercase">Success Rate</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{smsStats.successRate}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-dargah-gold shadow-sm">
            <p className="text-xs text-slate-500 uppercase">Est. Cost</p>
            <p className="text-2xl font-bold text-dargah-gold mt-1">₹{smsStats.estimatedCost}</p>
          </div>
        </div>
      )}

      {/* SMS Logs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">SMS Log</h3>
          <span className="text-xs text-slate-500">{smsLogs?.total || 0} total</span>
        </div>
        <div className="divide-y divide-slate-100">
          {smsLogs?.logs?.length === 0 && (
            <p className="p-8 text-center text-slate-500">No SMS logs yet.</p>
          )}
          {smsLogs?.logs?.map(log => (
            <div key={log._id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{log.donorId?.name || log.phone}</p>
                <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString('hi-IN')} · {log.donationId?.receiptNo || '-'}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {log.status === 'sent' ? '✓ Sent' : '✗ Failed'}
              </span>
            </div>
          ))}
        </div>
        {smsLogs?.pages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex gap-2 justify-center">
            {Array.from({ length: smsLogs.pages }, (_, i) => (
              <button key={i} onClick={() => setLogPage(i + 1)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${logPage === i + 1 ? 'bg-dargah-green text-white' : 'bg-slate-100 text-slate-600'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
