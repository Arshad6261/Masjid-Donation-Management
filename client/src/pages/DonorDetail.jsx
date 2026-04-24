import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ReceiptModal from '../components/ReceiptModal';
import AreaInput from '../components/AreaInput';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, CheckCircle, AlertCircle, TrendingUp, Percent } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'नाम ज़रूरी है'),
  phone: z.string().optional(),
  address: z.object({ houseNo: z.string().optional(), street: z.string().optional() }),
  area: z.string().min(1, 'क्षेत्र ज़रूरी है'),
  fundType: z.enum(['masjid', 'dargah', 'both']),
  monthlyAmount: z.number().min(1, 'राशि 0 से ज़्यादा होनी चाहिए'),
  isActive: z.boolean(),
  hasWhatsApp: z.boolean().optional(),
  preferSMS: z.boolean().optional()
});

export default function DonorDetail() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const [ledgerYear, setLedgerYear] = useState(parseInt(searchParams.get('year')) || new Date().getFullYear());
  const [markPayModal, setMarkPayModal] = useState(null);
  const [markAmount, setMarkAmount] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [markNotes, setMarkNotes] = useState('');
  
  // Advance Donation State
  const [advancePayModal, setAdvancePayModal] = useState(false);
  const [advanceMonths, setAdvanceMonths] = useState(2);
  const [advanceStartMonth, setAdvanceStartMonth] = useState(new Date().getMonth() + 1);
  const [advanceStartYear, setAdvanceStartYear] = useState(new Date().getFullYear());

  const { data: donor, isLoading } = useQuery({
    queryKey: ['donor', id],
    queryFn: async () => { const { data } = await api.get(`/donors/${id}`); return data; },
    enabled: !isNew
  });

  const { data: history } = useQuery({
    queryKey: ['donorHistory', id],
    queryFn: async () => { const { data } = await api.get(`/donors/${id}/donation-history`); return data; },
    enabled: !isNew && activeTab === 'profile'
  });

  const { data: ledger } = useQuery({
    queryKey: ['donorLedger', id, ledgerYear],
    queryFn: async () => { const { data } = await api.get(`/donors/${id}/yearly-ledger?year=${ledgerYear}`); return data; },
    enabled: !isNew && activeTab === 'ledger'
  });

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { address: { houseNo: '', street: '' }, fundType: 'masjid', isActive: true, monthlyAmount: 0, hasWhatsApp: true, preferSMS: false }
  });

  const phoneVal = watch('phone');

  useEffect(() => {
    if (donor && !isNew) {
      reset({
        name: donor.name, phone: donor.phone || '',
        address: donor.address || { houseNo: '', street: '' },
        area: donor.area, fundType: donor.fundType,
        monthlyAmount: donor.monthlyAmount, isActive: donor.isActive,
        hasWhatsApp: donor.hasWhatsApp !== false,
        preferSMS: donor.preferSMS || false
      });
    }
  }, [donor, isNew, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isNew) return await api.post('/donors', data);
      return await api.put(`/donors/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['donors']);
      queryClient.invalidateQueries(['donor', id]);
      toast.success(isNew ? 'दानदाता जोड़ा गया' : 'दानदाता अपडेट हुआ');
      if (isNew) navigate('/donors');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'त्रुटि')
  });

  const markPayMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/donations', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['donorLedger', id, ledgerYear]);
      queryClient.invalidateQueries(['donations']);
      queryClient.invalidateQueries(['donorHistory', id]);
      toast.success(`भुगतान सफल! रसीद: ${res.data.receiptNo}`);
      setMarkPayModal(null);
      // Open receipt for print/share
      navigate(`/receipt/${res.data.receiptNo}`);
    },
    onError: () => toast.error('भुगतान दर्ज करने में त्रुटि')
  });

  const advancePayMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post('/donations/advance', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['donorLedger', id]);
      queryClient.invalidateQueries(['donations']);
      queryClient.invalidateQueries(['donorHistory', id]);
      toast.success('अग्रिम भुगतान सफल!');
      setAdvancePayModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'अग्रिम भुगतान दर्ज करने में त्रुटि')
  });

  useEffect(() => {
    if (markPayModal || advancePayModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    return () => { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; };
  }, [markPayModal, advancePayModal]);

  if (isLoading) return <div className="p-4 animate-pulse">लोड हो रहा है...</div>;

  const monthsHindi = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/donors')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-5 h-5" /> वापस
        </button>
        {!isNew && donor && <span className="text-sm font-bold text-dargah-green">{donor.donorId}</span>}
      </div>

      {/* Tab Switcher */}
      {!isNew && (
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100 max-w-sm">
          <button onClick={() => setSearchParams({ tab: 'profile' })}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'profile' ? 'bg-dargah-green text-white shadow' : 'text-slate-600'}`}>
            प्रोफाइल
          </button>
          <button onClick={() => setSearchParams({ tab: 'ledger', year: ledgerYear })}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'ledger' ? 'bg-dargah-green text-white shadow' : 'text-slate-600'}`}>
            वार्षिक खाता
          </button>
        </div>
      )}

      {/* PROFILE TAB */}
      {(activeTab === 'profile' || isNew) && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">{isNew ? 'नया दानदाता जोड़ें' : 'दानदाता विवरण'}</h2>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">नाम *</label>
                  <input type="text" {...register('name')} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-dargah-green/30" />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">फोन</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-sm font-bold text-slate-600">+91</span>
                    <input type="text" {...register('phone')} className="w-full px-4 py-2 border border-slate-300 rounded-r-lg outline-none focus:ring-2 focus:ring-dargah-green/30" placeholder="9876543210" />
                  </div>
                  {phoneVal && !/^[6-9]\d{9}$/.test(phoneVal) && phoneVal.length > 0 && (
                    <p className="text-sm text-red-500 mt-1">कृपया सही 10 अंक का मोबाइल नंबर दर्ज करें</p>
                  )}
                  {!phoneVal && (
                    <p className="text-xs text-amber-600 mt-1">⚠ फोन नहीं — SMS और WhatsApp काम नहीं करेगा</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">क्षेत्र *</label>
                  <Controller
                    control={control}
                    name="area"
                    render={({ field: { onChange, value } }) => (
                      <AreaInput 
                        value={value} 
                        onChange={onChange} 
                        error={errors.area?.message}
                      />
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">मकान नं.</label>
                    <input type="text" {...register('address.houseNo')} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">गली</label>
                    <input type="text" {...register('address.street')} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">फंड प्रकार *</label>
                  <select {...register('fundType')} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none">
                    <option value="masjid">मस्जिद</option>
                    <option value="dargah">दरगाह</option>
                    <option value="both">दोनों</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">मासिक राशि (₹) *</label>
                  <input type="number" {...register('monthlyAmount', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" />
                  {errors.monthlyAmount && <p className="text-sm text-red-500 mt-1">{errors.monthlyAmount.message}</p>}
                </div>
                {!isNew && (
                  <div className="flex items-center mt-2">
                    <input type="checkbox" {...register('isActive')} id="isActive" className="w-4 h-4 text-dargah-green rounded" />
                    <label htmlFor="isActive" className="ml-2 text-sm text-slate-900">सक्रिय</label>
                  </div>
                )}
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">संचार प्राथमिकता</p>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" {...register('hasWhatsApp')} id="hasWhatsApp" className="w-4 h-4 text-green-600 rounded" />
                    <label htmlFor="hasWhatsApp" className="text-sm text-slate-700">यह दानदाता WhatsApp का उपयोग करता है</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" {...register('preferSMS')} id="preferSMS" className="w-4 h-4 text-blue-600 rounded" />
                    <label htmlFor="preferSMS" className="text-sm text-slate-700">SMS को WhatsApp पर प्राथमिकता दें</label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => navigate('/donors')} className="px-5 py-2.5 text-slate-600 bg-slate-100 rounded-lg font-medium">रद्द करें</button>
                <button type="submit" disabled={mutation.isPending} className="px-5 py-2.5 text-white rounded-lg font-medium" style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}>
                  {mutation.isPending ? 'सेव हो रहा है...' : 'दानदाता सेव करें'}
                </button>
              </div>
            </form>
          </div>

          {!isNew && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">चंदा इतिहास</h3>
              <div className="space-y-2">
                {history?.length === 0 ? <p className="text-slate-500 text-center py-4">अभी तक कोई चंदा नहीं।</p> : history?.map(d => (
                  <div key={d._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-slate-50 gap-2 sm:gap-0">
                    <div>
                      <p className="font-medium text-slate-800">{d.receiptNo}</p>
                      <p className="text-xs text-slate-500">{new Date(d.paymentDate).toLocaleDateString('hi-IN')} · {d.collectedBy?.name}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="font-bold text-dargah-green text-lg">₹{d.amount}</span>
                      <button 
                        onClick={() => setSelectedReceipt(d)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors"
                      >
                        🧾 रसीद (Receipt)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedReceipt && (
        <ReceiptModal donation={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      {/* LEDGER TAB */}
      {activeTab === 'ledger' && !isNew && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {[ledgerYear - 1, ledgerYear, ledgerYear + 1].filter(y => y <= new Date().getFullYear() + 1).map(y => (
                <button key={y} onClick={() => { setLedgerYear(y); setSearchParams({ tab: 'ledger', year: y }); }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${y === ledgerYear ? 'bg-dargah-green text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  {y}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => {
                setAdvanceStartMonth(new Date().getMonth() + 1);
                setAdvanceStartYear(new Date().getFullYear());
                setAdvanceMonths(2);
                setAdvancePayModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
            >
              एक साथ कई अग्रिम भुगतान (Advance)
            </button>
          </div>

          {ledger && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-4 border-l-4 border-green-500 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium uppercase">भुगतान महीने</p>
                  <p className="text-2xl font-bold text-green-700 mt-1 flex items-center gap-1"><CheckCircle className="w-5 h-5" />{ledger.summary.paidMonths}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border-l-4 border-dargah-green shadow-sm">
                  <p className="text-xs text-slate-500 font-medium uppercase">कुल भुगतान</p>
                  <p className="text-2xl font-bold text-dargah-green mt-1"><TrendingUp className="w-5 h-5 inline" /> ₹{ledger.summary.totalPaid.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border-l-4 border-red-500 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium uppercase">बकाया</p>
                  <p className="text-2xl font-bold text-red-600 mt-1"><AlertCircle className="w-5 h-5 inline" /> ₹{ledger.summary.totalOutstanding.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border-l-4 border-dargah-gold shadow-sm">
                  <p className="text-xs text-slate-500 font-medium uppercase">नियमितता</p>
                  <p className="text-2xl font-bold text-dargah-gold mt-1"><Percent className="w-5 h-5 inline" /> {ledger.summary.consistency}%</p>
                </div>
              </div>

              {/* 12-Month Grid */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {ledger.months.map((m, idx) => {
                  const cellColors = {
                    paid: 'bg-green-50 border-green-200 text-green-800',
                    partial: 'bg-amber-50 border-amber-200 text-amber-800',
                    unpaid: 'bg-red-50 border-red-200 text-red-700',
                    overpaid: 'bg-blue-50 border-blue-200 text-blue-800',
                    future: 'bg-gray-50 border-gray-200 text-gray-400'
                  };
                  return (
                    <div key={m.month} className={`rounded-xl p-4 border-2 ${cellColors[m.status]} transition-all`}>
                      <p className="font-bold text-sm mb-1">{monthsHindi[idx]}</p>
                      {m.status === 'paid' && <p className="text-lg font-bold">✓ ₹{m.paidAmount}</p>}
                      {m.status === 'overpaid' && <p className="text-lg font-bold">✓ ₹{m.paidAmount} <span className="text-xs bg-blue-100 px-1 rounded">+₹{m.paidAmount - m.pledgedAmount}</span></p>}
                      {m.status === 'partial' && <p className="text-lg font-bold">₹{m.paidAmount}/{m.pledgedAmount}</p>}
                      {m.status === 'future' && (
                        <>
                          <p className="text-lg">—</p>
                          <button onClick={() => {
                            setMarkPayModal(m);
                            setMarkAmount(m.pledgedAmount);
                            setMarkNotes('');
                          }} className="mt-1 w-full py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors">
                            अग्रिम भुगतान
                          </button>
                        </>
                      )}
                      {m.status === 'unpaid' && (
                        <button onClick={() => {
                          setMarkPayModal(m);
                          setMarkAmount(m.pledgedAmount);
                          setMarkNotes('');
                        }} className="mt-1 w-full py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">
                          भुगतान दर्ज करें
                        </button>
                      )}
                      {m.donation?.receiptNo && <p className="text-[10px] mt-1 opacity-60">{m.donation.receiptNo}</p>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Mark Paid Modal */}
          {markPayModal && donor && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
              onMouseDown={() => setMarkPayModal(null)}>
              <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl p-6"
                onMouseDown={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 mb-1">भुगतान दर्ज करें — {monthsHindi[markPayModal.month - 1]} {ledgerYear}</h3>
                <p className="text-sm text-slate-500 mb-6">{donor.name} · {donor.fundType === 'masjid' ? 'मस्जिद' : donor.fundType === 'dargah' ? 'दरगाह' : 'दोनों'}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">राशि (₹)</label>
                    <input type="number" value={markAmount} onChange={(e) => setMarkAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-dargah-green/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">नोट</label>
                    <input type="text" value={markNotes} onChange={(e) => setMarkNotes(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none" placeholder="वैकल्पिक" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setMarkPayModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl">रद्द</button>
                  <button onClick={() => markPayMutation.mutate({
                    donor: donor._id,
                    amount: markAmount,
                    fundType: donor.fundType === 'both' ? 'masjid' : donor.fundType,
                    month: markPayModal.month,
                    year: ledgerYear,
                    paymentDate: new Date(),
                    collectionMethod: 'walk_in',
                    notes: markNotes
                  })}
                    disabled={markPayMutation.isPending}
                    className="flex-1 py-3 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}>
                    {markPayMutation.isPending ? 'सेव हो रहा है...' : 'सेव करें और रसीद बनाएं'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Advance Payment Modal */}
          {advancePayModal && donor && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
              onMouseDown={() => setAdvancePayModal(false)}>
              <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl p-6"
                onMouseDown={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 mb-1">एक साथ कई अग्रिम भुगतान</h3>
                <p className="text-sm text-slate-500 mb-6">{donor.name} · मासिक: ₹{donor.monthlyAmount}</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">शुरुआती महीना</label>
                      <select value={advanceStartMonth} onChange={e => setAdvanceStartMonth(Number(e.target.value))} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none">
                        {monthsHindi.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">वर्ष</label>
                      <input type="number" value={advanceStartYear} onChange={e => setAdvanceStartYear(Number(e.target.value))} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">कितने महीने (2-12)?</label>
                    <input type="number" min="2" max="12" value={advanceMonths} onChange={(e) => setAdvanceMonths(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                    <span className="text-blue-800 font-medium">कुल भुगतान:</span>
                    <span className="text-2xl font-bold text-blue-700">₹{(donor.monthlyAmount * advanceMonths).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setAdvancePayModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl">रद्द</button>
                  <button onClick={() => advancePayMutation.mutate({
                    donor: donor._id,
                    monthlyAmount: donor.monthlyAmount,
                    fundType: donor.fundType === 'both' ? 'masjid' : donor.fundType,
                    startMonth: advanceStartMonth,
                    startYear: advanceStartYear,
                    totalMonths: advanceMonths,
                    collectionMethod: 'walk_in',
                  })}
                    disabled={advancePayMutation.isPending}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                    {advancePayMutation.isPending ? 'सेव हो रहा है...' : 'अग्रिम भुगतान करें'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
