import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useDebounce } from 'use-debounce';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export default function Register() {
  const [form, setForm] = useState({
    name: '', phone: '', houseNo: '', street: '', area: '', fundType: 'masjid', monthlyAmount: '', notes: ''
  });
  const [success, setSuccess] = useState(false);
  const [donorId, setDonorId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Area search logic
  const [areaSearch, setAreaSearch] = useState('');
  const [debouncedAreaSearch] = useDebounce(areaSearch, 300);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  const { data: areas } = useQuery({
    queryKey: ['publicAreas', debouncedAreaSearch],
    queryFn: async () => {
      const { data } = await api.get(`/donors/areas?q=${debouncedAreaSearch}`);
      return data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/donors/self-register', payload);
      return data;
    },
    onSuccess: (data) => {
      setDonorId(data.donorId);
      setSuccess(true);
    },
    onError: (e) => {
      setErrorMsg(e.response?.data?.message || 'रजिस्ट्रेशन में त्रुटि हुई।');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.name || form.name.length < 2) return setErrorMsg('नाम दर्ज करें (कम से कम 2 अक्षर)');
    if (!/^[6-9]\d{9}$/.test(form.phone)) return setErrorMsg('कृपया सही फोन नंबर दर्ज करें (उदा. 9876543210)');
    if (!form.area) return setErrorMsg('मोहल्ला / क्षेत्र चुनना आवश्यक है');

    mutation.mutate({
      ...form,
      monthlyAmount: Number(form.monthlyAmount) || 0
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6 animate-bounce" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">जज़ाकल्लाह खैर! (JazakAllah Khair!)</h2>
          <p className="text-slate-600 mb-6">आपका रजिस्ट्रेशन सबमिट हो गया है। हमारी समिति सत्यापन करेगी और जल्द ही आपसे संपर्क करेगी।</p>
          <div className="bg-dargah-cream border border-dargah-gold/30 rounded-xl p-4 mb-6 inline-block">
            <p className="text-xs text-dargah-green-dark uppercase font-bold tracking-wider mb-1">आपका डोनर आईडी</p>
            <p className="text-2xl font-black text-dargah-green">{donorId}</p>
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
            वापस जाएं
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-dargah-gold/20">
        <div className="bg-gradient-to-br from-[#0F4C2A] via-[#1B6B3A] to-[#C9900C] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent mix-blend-overlay"></div>
          <h1 className="text-3xl font-black text-white relative z-10 tracking-tight">Hazrat Sultan Sha Peer</h1>
          <p className="text-white/80 font-medium mt-2 relative z-10">दानदाता के रूप में रजिस्टर करें</p>
          <p className="text-white/60 text-sm mt-1 relative z-10">हमारे सहयोगियों के समुदाय में शामिल हों</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">पूरा नाम *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none transition-all" placeholder="अपना नाम दर्ज करें" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">फोन नंबर *</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none transition-all" placeholder="9876543210" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">मकान नंबर</label>
                <input type="text" value={form.houseNo} onChange={e => setForm({ ...form, houseNo: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none transition-all" placeholder="वैकल्पिक" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">गली / सड़क</label>
                <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none transition-all" placeholder="वैकल्पिक" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-slate-700 mb-1">मोहल्ला / क्षेत्र *</label>
              <input
                type="text"
                value={areaSearch}
                onChange={e => { setAreaSearch(e.target.value); setForm({ ...form, area: e.target.value }); setShowAreaDropdown(true); }}
                onFocus={() => setShowAreaDropdown(true)}
                onBlur={() => setTimeout(() => setShowAreaDropdown(false), 200)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none transition-all"
                placeholder="क्षेत्र का नाम दर्ज करें"
                required
              />
              {showAreaDropdown && areas?.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl max-h-48 overflow-y-auto">
                  {areas.map(a => (
                    <div
                      key={a.name}
                      onClick={() => { setForm({ ...form, area: a.name }); setAreaSearch(a.name); setShowAreaDropdown(false); }}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      <span className="font-medium text-slate-800">{a.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">मैं इसके लिए दान करना चाहता हूँ:</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'masjid', label: 'मस्जिद' },
                  { id: 'dargah', label: 'दरगाह' },
                  { id: 'both', label: 'दोनों' }
                ].map(type => (
                  <button
                    key={type.id} type="button"
                    onClick={() => setForm({ ...form, fundType: type.id })}
                    className={`py-3 px-2 rounded-xl text-sm font-bold capitalize transition-all border ${form.fundType === type.id ? 'bg-dargah-green text-white border-dargah-green shadow-md shadow-dargah-green/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">मासिक राशि जो मैं दे सकता हूँ</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₹</span>
                <input type="number" value={form.monthlyAmount} onChange={e => setForm({ ...form, monthlyAmount: e.target.value })} className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none transition-all" placeholder="यदि निश्चित नहीं हैं तो 0 छोड़ दें" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">टिप्पणी (वैकल्पिक)</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none transition-all resize-none" rows="2" placeholder="समिति के लिए कोई संदेश..." />
            </div>
          </div>

          <button type="submit" disabled={mutation.isPending} className="w-full py-4 bg-gradient-to-r from-[#0F4C2A] to-[#1B6B3A] text-white font-bold text-lg rounded-xl shadow-lg shadow-dargah-green/30 hover:shadow-xl hover:from-[#0a3a1f] hover:to-[#155a2f] transition-all flex justify-center items-center gap-2">
            {mutation.isPending ? 'प्रतीक्षा करें...' : 'रजिस्टर करें'}
          </button>
        </form>
      </div>
    </div>
  );
}
