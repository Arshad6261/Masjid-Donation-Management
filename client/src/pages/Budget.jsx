import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Settings, TrendingUp, Copy, CheckCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_CATEGORIES = ['बिजली बिल', 'इमाम/स्टाफ वेतन', 'सफाई सामग्री', 'मरम्मत व रखरखाव', 'त्यौहार आयोजन', 'पानी/प्लंबिंग', 'अन्य'];

export default function Budget() {
  const [activeTab, setActiveTab] = useState('set');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [fundType, setFundType] = useState('masjid');
  const [festivalName, setFestivalName] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-dargah-green" /> बजट प्लानिंग
          </h1>
          <p className="text-slate-500">मासिक बजट निर्धारित करें और खर्च की निगरानी करें</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">महीना</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none min-w-[120px]">
              {['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'].map((m, i) => (
                <option key={m} value={i+1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">वर्ष</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none min-w-[100px]">
              {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">फंड</label>
            <select value={fundType} onChange={e => setFundType(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none min-w-[150px]">
              <option value="masjid">मस्जिद फंड</option>
              <option value="dargah">दरगाह फंड</option>
              <option value="festival">त्यौहार फंड</option>
              <option value="jumma_jholi">जुम्मा झोली</option>
              <option value="tamiri_kaam">तामीरी काम</option>
            </select>
          </div>
          {fundType === 'festival' && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">त्यौहार</label>
              <input type="text" value={festivalName} onChange={e => setFestivalName(e.target.value)} placeholder="त्यौहार का नाम..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green outline-none" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button onClick={() => setActiveTab('set')} className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'set' ? 'bg-slate-50 text-dargah-green border-b-2 border-dargah-green' : 'text-slate-500 hover:bg-slate-50'}`}>बजट सेट करें</button>
          <button onClick={() => setActiveTab('variance')} className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'variance' ? 'bg-slate-50 text-dargah-green border-b-2 border-dargah-green' : 'text-slate-500 hover:bg-slate-50'}`}>बजट बनाम खर्च रिपोर्ट</button>
        </div>

        <div className="p-6">
          {activeTab === 'set' && <SetBudgetTab month={month} year={year} fundType={fundType} festivalName={festivalName} />}
          {activeTab === 'variance' && <VarianceTab month={month} year={year} fundType={fundType} />}
        </div>
      </div>
    </div>
  );
}

function SetBudgetTab({ month, year, fundType, festivalName }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(MOCK_CATEGORIES.map(c => ({ category: c, label: c, budgeted: '' })));

  const { data: existing, isLoading } = useQuery({
    queryKey: ['budgets', month, year, fundType],
    queryFn: async () => {
      const { data } = await api.get(`/budgets?month=${month}&year=${year}&fundType=${fundType}`);
      return data[0];
    }
  });

  useEffect(() => {
    if (existing?.items) {
      const map = new Map(existing.items.map(i => [i.category, i.budgeted]));
      setItems(MOCK_CATEGORIES.map(c => ({ category: c, label: c, budgeted: map.get(c) || '' })));
    } else {
      setItems(MOCK_CATEGORIES.map(c => ({ category: c, label: c, budgeted: '' })));
    }
  }, [existing, month, year, fundType]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/budgets', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('बजट सेव किया गया');
      queryClient.invalidateQueries(['budgets']);
      queryClient.invalidateQueries(['variance']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'बजट सेव करने में त्रुटि')
  });

  const handleSave = () => {
    const validItems = items.filter(i => Number(i.budgeted) > 0).map(i => ({ ...i, budgeted: Number(i.budgeted) }));
    if (validItems.length === 0) return toast.error('कम से कम एक श्रेणी में बजट दर्ज करें');
    mutation.mutate({ month, year, fundType, festivalName, items: validItems });
  };

  if (isLoading) return <p className="text-slate-500 text-center p-8">लोड हो रहा है...</p>;

  const total = items.reduce((s, i) => s + (Number(i.budgeted) || 0), 0);

  return (
    <div className="space-y-4">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-500 text-sm">
          <tr>
            <th className="px-4 py-3 font-semibold rounded-l-lg">खर्च श्रेणी</th>
            <th className="px-4 py-3 font-semibold rounded-r-lg w-48">राशि (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="px-4 py-3 font-medium text-slate-700">{item.category}</td>
              <td className="px-4 py-3">
                <input type="number" value={item.budgeted} onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].budgeted = e.target.value;
                  setItems(newItems);
                }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-dargah-green" placeholder="0" />
              </td>
            </tr>
          ))}
          <tr className="bg-dargah-cream/30">
            <td className="px-4 py-4 font-bold text-dargah-green text-right">कुल बजट:</td>
            <td className="px-4 py-4 font-bold text-dargah-green text-lg">₹{total.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end pt-4">
        <button onClick={handleSave} disabled={mutation.isPending} className="bg-dargah-green text-white px-8 py-3 rounded-xl font-bold shadow-sm hover:bg-dargah-green-dark transition-colors flex items-center gap-2">
          {mutation.isPending ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} सेव करें
        </button>
      </div>
    </div>
  );
}

function VarianceTab({ month, year, fundType }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['variance', month, year, fundType],
    queryFn: async () => {
      const { data } = await api.get(`/budgets/variance?month=${month}&year=${year}&fundType=${fundType}`);
      return data;
    }
  });

  const copyMutation = useMutation({
    mutationFn: async () => {
      if (!data?.budget) throw new Error('बजट नहीं मिला');
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
      
      const { data: res } = await api.post('/budgets', {
        month: nextMonth, year: nextYear, fundType, festivalName: data.budget.festivalName,
        items: data.budget.items
      });
      return res;
    },
    onSuccess: () => {
      toast.success('अगले महीने के लिए बजट कॉपी किया गया');
    },
    onError: (e) => toast.error(e.message || 'त्रुटि')
  });

  if (isLoading) return <p className="text-slate-500 text-center p-8">लोड हो रहा है...</p>;
  if (!data?.variance || data.variance.length === 0) return (
    <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">इस महीने के लिए कोई बजट या खर्च नहीं मिला।</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase">कुल बजट</p>
          <p className="text-2xl font-bold text-slate-800">₹{(data.totals.budgeted || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <p className="text-xs font-bold text-red-500 uppercase">खर्च हुआ</p>
          <p className="text-2xl font-bold text-red-700">₹{(data.totals.spent || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-xs font-bold text-green-600 uppercase">शेष बजट</p>
          <p className="text-2xl font-bold text-green-700">₹{(data.totals.remaining || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {data.variance.map((v, i) => {
          const ratio = v.budgeted > 0 ? (v.actual / v.budgeted) * 100 : (v.actual > 0 ? 100 : 0);
          const colorClass = v.status === 'under_budget' ? 'bg-green-500' : v.status === 'on_track' ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-700">{v.category}</span>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  ₹{v.actual.toLocaleString()} / ₹{v.budgeted.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                <div className={`${colorClass} transition-all`} style={{ width: `${Math.min(ratio, 100)}%` }}></div>
              </div>
              {v.variance < 0 && <p className="text-[10px] text-red-500 text-right font-medium">₹{Math.abs(v.variance).toLocaleString()} ओवर बजट!</p>}
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${data.totals.status === 'under_budget' ? 'bg-green-100 text-green-700' : data.totals.status === 'on_track' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
          {data.totals.status.replace('_', ' ')}
        </span>
        <button onClick={() => copyMutation.mutate()} disabled={copyMutation.isPending} className="flex items-center gap-2 text-sm text-dargah-green font-bold bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors">
          <Copy className="w-4 h-4" /> अगले महीने कॉपी करें
        </button>
      </div>
    </div>
  );
}
