import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { ArrowLeft, CheckCircle, XCircle, Clock, Phone, MapPin, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [collectModal, setCollectModal] = useState(null);
  const [collectAmount, setCollectAmount] = useState(0);
  const [collectNotes, setCollectNotes] = useState('');

  const { data: visit, isLoading } = useQuery({
    queryKey: ['visit', id],
    queryFn: async () => { const { data } = await api.get(`/visits/${id}`); return data; }
  });

  useEffect(() => {
    if (collectModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [collectModal]);

  const collectMutation = useMutation({
    mutationFn: async ({ donorIndex, amount, notes }) => {
      const { data } = await api.patch(`/visits/${id}/collect-donor`, { donorIndex, amount, notes });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['visit', id]);
      queryClient.invalidateQueries(['donations']);
      queryClient.invalidateQueries(['donorHistory']);
      setCollectModal(null);
      toast.success(
        (t) => (
          <span className="flex items-center gap-2">
            वसूली सफल! {data.receiptNo}
            <button onClick={() => { toast.dismiss(t.id); navigate(`/receipt/${data.receiptNo}`); }}
              className="ml-2 px-2 py-1 bg-dargah-green text-white text-xs font-bold rounded">
              रसीद देखें
            </button>
          </span>
        ),
        { duration: 6000 }
      );
    },
    onError: () => toast.error('वसूली में त्रुटि')
  });

  const skipMutation = useMutation({
    mutationFn: async ({ donorIndex, skipReason }) => {
      const { data } = await api.patch(`/visits/${id}/skip-donor`, { donorIndex, skipReason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['visit', id]);
      toast.success('दानदाता छोड़ दिया गया');
    }
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/visits/${id}`, { status: 'completed' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['visit', id]);
      toast.success('दौरा पूर्ण!');
    }
  });

  const statusLabels = { planned: 'निर्धारित', in_progress: 'चालू', completed: 'पूर्ण' };
  const skipReasonLabels = { not_home: 'घर पर नहीं', postponed: 'स्थगित', other: 'अन्य' };
  const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', both: 'दोनों', festival: 'त्यौहार' };

  if (isLoading) return <div className="p-8">लोड हो रहा है...</div>;
  if (!visit) return <div className="p-8 text-center">दौरा नहीं मिला</div>;

  const donors = visit.donorsVisited || [];
  const collectedCount = donors.filter(d => d.collected || d.alreadyPaid).length;
  const skippedCount = donors.filter(d => d.skipped).length;
  const pendingCount = donors.length - collectedCount - skippedCount;
  const totalCollected = donors.reduce((s, d) => s + (d.collected ? (d.collectedAmount || 0) : 0), 0);
  const totalPledged = visit.totalPledged || donors.reduce((s, d) => s + (d.pledgedAmount || 0), 0);
  const progressPct = donors.length ? Math.round(((collectedCount + skippedCount) / donors.length) * 100) : 0;

  const sortedDonors = [...donors].map((d, i) => ({ ...d, _origIndex: i }));
  sortedDonors.sort((a, b) => {
    const order = (d) => d.alreadyPaid ? 1.5 : d.collected ? 2 : d.skipped ? 3 : 1;
    return order(a) - order(b);
  });

  const filterLabels = { all: 'सभी', pending: 'बाकी', collected: 'वसूल', skipped: 'छोड़े' };
  const filtered = sortedDonors.filter(d => {
    if (filter === 'pending') return !d.collected && !d.skipped && !d.alreadyPaid;
    if (filter === 'collected') return d.collected || d.alreadyPaid;
    if (filter === 'skipped') return d.skipped;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/visits')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{visit.area}</h2>
          <p className="text-sm text-slate-500">{new Date(visit.visitDate).toLocaleDateString('hi-IN')} · {statusLabels[visit.status] || visit.status}</p>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="rounded-2xl p-6 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B6B3A 72%, #C9900C 100%)' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-white/70 text-sm mb-1">कुल वसूली</p>
            <h2 className="text-3xl font-bold">₹{totalCollected.toLocaleString('en-IN')}</h2>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm mb-1">शेष</p>
            <h3 className="text-xl font-bold">₹{Math.max(0, totalPledged - totalCollected).toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 mb-2">
          <div className="h-3 rounded-full bg-dargah-gold-light transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
        </div>
        <p className="text-white/80 text-sm">{collectedCount}/{donors.length} वसूल · {skippedCount} छोड़े · {pendingCount} बाकी</p>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'pending', 'collected', 'skipped'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-all ${
              filter === f ? 'bg-dargah-green text-white shadow' : 'bg-white text-slate-600 border border-slate-200'
            }`}>{filterLabels[f]} {f === 'pending' ? `(${pendingCount})` : f === 'collected' ? `(${collectedCount})` : f === 'skipped' ? `(${skippedCount})` : ''}</button>
        ))}
      </div>

      {/* Donor Cards */}
      <div className="space-y-3">
        {filtered.map((dv) => {
          const isPaid = dv.alreadyPaid;
          const isCollected = dv.collected;
          const isSkipped = dv.skipped;
          const isPending = !isPaid && !isCollected && !isSkipped;
          
          return (
            <div key={dv._origIndex} className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
              isCollected ? 'border-green-200 bg-green-50/30' : 
              isPaid ? 'border-teal-200 bg-teal-50/30' : 
              isSkipped ? 'border-orange-200 bg-orange-50/30' : 
              'border-slate-100'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  isCollected ? 'bg-green-100 text-green-700' : isPaid ? 'bg-teal-100 text-teal-700' : isSkipped ? 'bg-orange-100 text-orange-700' : 'bg-dargah-cream text-dargah-green'
                }`}>
                  {(dv.donorName || dv.donor?.name || '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-800 truncate">{dv.donorName || dv.donor?.name}</h4>
                    {isCollected && <span className="flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle className="w-4 h-4" />₹{dv.collectedAmount}</span>}
                    {isPaid && <span className="text-xs font-bold text-teal-600">पहले दे चुके ✓</span>}
                    {isSkipped && <span className="flex items-center gap-1 text-xs font-bold text-orange-600"><XCircle className="w-4 h-4" />{skipReasonLabels[dv.skipReason] || dv.skipReason}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{dv.phone || dv.donor?.phone || 'नहीं'}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                      (dv.fundType || dv.donor?.fundType) === 'masjid' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
                    }`}>{fundLabels[dv.fundType || dv.donor?.fundType] || dv.fundType}</span>
                    <span className="font-medium text-slate-700">₹{dv.pledgedAmount || dv.donor?.monthlyAmount} तय</span>
                  </div>
                  
                  {isPending && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => {
                        setCollectModal({ index: dv._origIndex, donor: dv });
                        setCollectAmount(dv.pledgedAmount || dv.donor?.monthlyAmount || 0);
                        setCollectNotes('');
                      }} className="flex-1 py-2 text-white font-medium rounded-lg text-sm transition-all" style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}>
                        <Banknote className="w-4 h-4 inline mr-1" />वसूल करें ₹{dv.pledgedAmount || dv.donor?.monthlyAmount}
                      </button>
                      <button onClick={() => skipMutation.mutate({ donorIndex: dv._origIndex, skipReason: 'not_home' })}
                        className="px-3 py-2 bg-orange-50 text-orange-700 font-medium rounded-lg text-sm border border-orange-200">
                        घर पर नहीं
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-8 text-slate-500">इस श्रेणी में कोई दानदाता नहीं।</div>}
      </div>

      {/* Sticky Bottom Bar */}
      {visit.status !== 'completed' && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between no-print z-20 shadow-lg">
          <p className="text-sm font-medium text-slate-600">{collectedCount + skippedCount}/{donors.length} पूर्ण · ₹{totalCollected.toLocaleString('en-IN')}</p>
          <button onClick={() => { if (window.confirm('क्या आप इस दौरे को पूर्ण करना चाहते हैं?')) completeMutation.mutate(); }}
            className="px-6 py-3 text-white font-bold rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}>
            दौरा पूर्ण करें
          </button>
        </div>
      )}

      {/* Collect Modal */}
      {collectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onMouseDown={() => setCollectModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl p-6"
            onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-1">चंदा वसूल करें</h3>
            <p className="text-sm text-slate-500 mb-6">{collectModal.donor.donorName || collectModal.donor.donor?.name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">राशि (₹)</label>
                <input type="number" value={collectAmount} onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xl font-bold text-dargah-green outline-none focus:ring-2 focus:ring-dargah-green/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">नोट</label>
                <input type="text" value={collectNotes} onChange={(e) => setCollectNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none" placeholder="वैकल्पिक" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setCollectModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl">रद्द</button>
              <button 
                onClick={() => collectMutation.mutate({ donorIndex: collectModal.index, amount: collectAmount, notes: collectNotes })}
                disabled={collectMutation.isPending}
                className="flex-1 py-3 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}>
                {collectMutation.isPending ? 'सेव हो रहा...' : `वसूल करें ₹${collectAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
