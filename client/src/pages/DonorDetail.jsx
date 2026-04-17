import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  isActive: z.boolean()
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
  const [markNotes, setMarkNotes] = useState('');

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { address: { houseNo: '', street: '' }, fundType: 'masjid', isActive: true, monthlyAmount: 0 }
  });

  useEffect(() => {
    if (donor && !isNew) {
      reset({
        name: donor.name, phone: donor.phone || '',
        address: donor.address || { houseNo: '', street: '' },
        area: donor.area, fundType: donor.fundType,
        monthlyAmount: donor.monthlyAmount, isActive: donor.isActive
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

  useEffect(() => {
    if (markPayModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    return () => { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; };
  }, [markPayModal]);

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
                  <input type="text" {...register('phone')} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-dargah-green/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">क्षेत्र *</label>
                  <input type="text" {...register('area')} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-dargah-green/30" />
                  {errors.area && <p className="text-sm text-red-500 mt-1">{errors.area.message}</p>}
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
                  <div key={d._id} className="flex justify-between items-center py-3 border-b border-slate-50">
                    <div>
                      <p className="font-medium text-slate-800">{d.receiptNo}</p>
                      <p className="text-xs text-slate-500">{new Date(d.paymentDate).toLocaleDateString('hi-IN')} · {d.collectedBy?.name}</p>
                    </div>
                    <span className="font-bold text-dargah-green">₹{d.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* LEDGER TAB */}
      {activeTab === 'ledger' && !isNew && (
        <>
          <div className="flex items-center gap-3">
            {[ledgerYear - 1, ledgerYear, ledgerYear + 1].filter(y => y <= new Date().getFullYear()).map(y => (
              <button key={y} onClick={() => { setLedgerYear(y); setSearchParams({ tab: 'ledger', year: y }); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${y === ledgerYear ? 'bg-dargah-green text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}>
                {y}
              </button>
            ))}
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
                      {m.status === 'future' && <p className="text-lg">—</p>}
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
                    paymentDate: new Date(ledgerYear, markPayModal.month - 1, 28),
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
        </>
      )}
    </div>
  );
}
