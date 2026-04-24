import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { Printer, AlertTriangle, Download, Receipt, Calendar, Users, TrendingUp, Wallet, Trophy, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const monthsHindi = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'];
const monthsShort = ['जन','फर','मार्च','अप्रै','मई','जून','जुला','अग','सित','अक्टू','नव','दिस'];

const categoryLabels = {
  imam_salary: 'इमाम वेतन', electricity: 'बिज़ली', maintenance: 'रखरखाव',
  cleaning: 'साफ़-सफ़ाई', event: 'आयोजन', water: 'पानी', other: 'अन्य'
};

const PIE_COLORS = ['#1B6B3A', '#C9900C', '#0D7E6A', '#E74C3C', '#3498DB', '#9B59B6', '#E67E22'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('yearly');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear());
  const queryClient = useQueryClient();

  // ---- Monthly/Defaulters queries ----
  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const { data } = await api.get('/reports/dashboard'); return data; }
  });

  const { data: defaulters, isLoading: loadingDefaulters } = useQuery({
    queryKey: ['defaulters', month, year],
    queryFn: async () => { const { data } = await api.get(`/reports/defaulters?month=${month}&year=${year}`); return data; },
    enabled: activeTab === 'monthly'
  });

  // ---- Yearly report query ----
  const { data: yearly, isLoading: loadingYearly } = useQuery({
    queryKey: ['yearlyReport', yearlyYear],
    queryFn: async () => { const { data } = await api.get(`/reports/yearly?year=${yearlyYear}`); return data; },
    enabled: activeTab === 'yearly'
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ donorId, amount, fundType }) => {
      return await api.post('/donations', {
        donor: donorId, amount, fundType: fundType === 'both' ? 'masjid' : fundType,
        month, year, paymentDate: new Date(year, month - 1, 28), collectionMethod: 'walk_in'
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['defaulters']);
      toast.success(`भुगतान सफल! रसीद: ${res.data.receiptNo}`);
    },
    onError: () => toast.error('त्रुटि')
  });

  const handlePrint = () => window.print();

  const handleCSV = () => {
    if (activeTab === 'monthly') {
      if (!defaulters?.length) return;
      const rows = [['नाम', 'फोन', 'क्षेत्र', 'अपेक्षित']];
      defaulters.forEach(d => rows.push([d.name, d.phone || '', d.area, d.monthlyAmount]));
      const csv = rows.map(r => r.join(',')).join('\n');
      downloadCSV(csv, `बकायादार-${month}-${year}.csv`);
    } else if (yearly) {
      const rows = [['महीना','मस्जिद वसूली','दरगाह वसूली','त्यौहार वसूली','कुल वसूली','कुल खर्चा','बैलेंस']];
      yearly.months.forEach((m, i) => rows.push([
        monthsHindi[i], m.collections.masjid, m.collections.dargah, m.collections.festival,
        m.collections.total, m.expenses.total, m.balance
      ]));
      rows.push(['कुल', yearly.annualCollections.masjid, yearly.annualCollections.dargah, yearly.annualCollections.festival,
        yearly.annualCollections.total, yearly.annualExpenses.total, yearly.annualBalance]);
      const csv = rows.map(r => r.join(',')).join('\n');
      downloadCSV(csv, `वार्षिक-रिपोर्ट-${yearlyYear}.csv`);
    }
  };

  const downloadCSV = (csv, name) => {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  };

  return (
    <div className="space-y-6 print:bg-white print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <h2 className="text-xl font-bold text-slate-800">वित्तीय रिपोर्ट</h2>
        <div className="flex gap-2 flex-wrap">
          <Link to="/reports/collectors" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
            <Users className="w-5 h-5" /> कलेक्टर प्रदर्शन
          </Link>
          <button onClick={handleCSV} className="flex items-center gap-2 bg-dargah-green hover:bg-dargah-green-dark text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
            <Download className="w-5 h-5" /> CSV
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
            <Printer className="w-5 h-5" /> प्रिंट
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center pb-6 border-b border-slate-300">
        <h1 className="text-2xl font-arabic font-bold text-dargah-green-dark">हज़रत सुल्तान शाह पीर</h1>
        <h2 className="text-lg font-semibold text-slate-700">{activeTab === 'yearly' ? `वार्षिक रिपोर्ट ${yearlyYear}` : 'मासिक रिपोर्ट'}</h2>
        <p className="text-sm text-slate-500">तिथि: {new Date().toLocaleString('hi-IN')}</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100 max-w-sm no-print">
        <button onClick={() => setActiveTab('yearly')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'yearly' ? 'bg-dargah-green text-white shadow' : 'text-slate-600 hover:text-slate-800'
          }`}><Calendar className="w-4 h-4" /> वार्षिक रिपोर्ट</button>
        <button onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'monthly' ? 'bg-dargah-green text-white shadow' : 'text-slate-600 hover:text-slate-800'
          }`}><AlertTriangle className="w-4 h-4" /> बकायादार</button>
      </div>

      {/* ===================== YEARLY TAB ===================== */}
      {activeTab === 'yearly' && (
        <>
          {/* Year Selector */}
          <div className="flex gap-2 no-print">
            {[yearlyYear - 1, yearlyYear, yearlyYear + 1].filter(y => y <= new Date().getFullYear()).map(y => (
              <button key={y} onClick={() => setYearlyYear(y)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  y === yearlyYear ? 'bg-dargah-green text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-dargah-green/30'
                }`}>{y}</button>
            ))}
          </div>

          {loadingYearly ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse"></div>)}
            </div>
          ) : yearly ? (
            <>
              {/* Annual Summary Banner */}
              <div className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B6B3A 72%, #C9900C 100%)' }}>
                <div className="relative z-10">
                  <p className="text-white/60 text-sm font-medium mb-1">वार्षिक सारांश — {yearlyYear}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-1">कुल वसूली</p>
                      <p className="text-2xl md:text-3xl font-bold">₹{yearly.annualCollections.total.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-1">कुल खर्चे</p>
                      <p className="text-2xl md:text-3xl font-bold">₹{yearly.annualExpenses.total.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-1">शुद्ध बैलेंस</p>
                      <p className={`text-2xl md:text-3xl font-bold ${yearly.annualBalance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        ₹{yearly.annualBalance.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-1">वसूली दर</p>
                      <p className="text-2xl md:text-3xl font-bold">{yearly.donorStats.collectionRate}%</p>
                    </div>
                  </div>
                </div>
                <Wallet className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5" />
              </div>

              {/* Donor Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStatCard icon={<Users className="w-5 h-5" />} label="सक्रिय दानदाता" value={yearly.donorStats.totalActiveDonors} color="bg-green-50 text-green-700 border-l-green-500" />
                <MiniStatCard icon={<TrendingUp className="w-5 h-5" />} label="भुगतानकर्ता" value={yearly.donorStats.uniquePayers} color="bg-blue-50 text-blue-700 border-l-blue-500" />
                <MiniStatCard icon={<Users className="w-5 h-5" />} label="नए दानदाता" value={yearly.donorStats.newDonorsThisYear} color="bg-amber-50 text-amber-700 border-l-amber-500" />
                <MiniStatCard icon={<Wallet className="w-5 h-5" />} label="मासिक अपेक्षित" value={`₹${yearly.donorStats.monthlyExpected.toLocaleString('en-IN')}`} color="bg-purple-50 text-purple-700 border-l-purple-500" />
              </div>

              {/* Collection vs Expense Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h3 className="text-lg font-bold text-slate-800 mb-4">मासिक वसूली बनाम खर्चे — {yearlyYear}</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearly.months.map((m, i) => ({
                      name: monthsShort[i],
                      वसूली: m.collections.total,
                      खर्चा: m.expenses.total,
                      बैलेंस: m.balance
                    }))} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '12px'}} />
                      <Bar dataKey="वसूली" fill="#1B6B3A" radius={[4, 4, 0, 0]} barSize={14} />
                      <Bar dataKey="खर्चा" fill="#E74C3C" radius={[4, 4, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fund-wise Breakdown + Expense Pie side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fund-wise Collection */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">फंड-वार वसूली</h3>
                  <div className="space-y-4">
                    <FundBar label="मस्जिद" amount={yearly.annualCollections.masjid} total={yearly.annualCollections.total} color="#1B6B3A" />
                    <FundBar label="दरगाह" amount={yearly.annualCollections.dargah} total={yearly.annualCollections.total} color="#C9900C" />
                    <FundBar label="त्यौहार" amount={yearly.annualCollections.festival} total={yearly.annualCollections.total} color="#0D7E6A" />
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-700">कुल</span>
                    <span className="text-xl font-bold text-dargah-green">₹{yearly.annualCollections.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Expense Category Pie */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">खर्चे श्रेणी अनुसार</h3>
                  {yearly.expensesByCategory.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={yearly.expensesByCategory.map(e => ({
                            name: e._id || 'अन्य',
                            value: e.total
                          }))} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {yearly.expensesByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">इस वर्ष कोई खर्चा नहीं</div>
                  )}
                </div>
              </div>

              {/* ===== Expenditure Categories Table (Issue 4) ===== */}
              {yearly.expensesByCategory.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">खर्चे श्रेणी-वार विवरण — {yearlyYear}</h3>
                      <p className="text-sm text-slate-500">सभी श्रेणियों का कुल खर्चा</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-6 font-semibold w-10">#</th>
                          <th className="py-3 px-6 font-semibold">श्रेणी</th>
                          <th className="py-3 px-6 font-semibold text-center">लेन-देन</th>
                          <th className="py-3 px-6 font-semibold text-right">कुल राशि</th>
                          <th className="py-3 px-6 font-semibold text-right">प्रतिशत</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {yearly.expensesByCategory.map((cat, idx) => {
                          const pct = yearly.annualExpenses.total > 0 ? ((cat.total / yearly.annualExpenses.total) * 100).toFixed(1) : 0;
                          return (
                            <tr key={cat._id || idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-6">
                                <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] + '20', color: PIE_COLORS[idx % PIE_COLORS.length] }}>{idx + 1}</span>
                              </td>
                              <td className="py-3 px-6 font-medium text-slate-800">
                                <span className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                                  {cat._id || 'अन्य'}
                                </span>
                              </td>
                              <td className="py-3 px-6 text-center text-slate-600">{cat.count}</td>
                              <td className="py-3 px-6 text-right font-bold text-red-600">₹{cat.total.toLocaleString('en-IN')}</td>
                              <td className="py-3 px-6 text-right text-slate-600">{pct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        <tr className="font-bold text-slate-900">
                          <td className="py-3 px-6"></td>
                          <td className="py-3 px-6">कुल</td>
                          <td className="py-3 px-6 text-center">{yearly.expensesByCategory.reduce((s, c) => s + c.count, 0)}</td>
                          <td className="py-3 px-6 text-right text-red-600">₹{yearly.annualExpenses.total.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-6 text-right">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Collection Consistency Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h3 className="text-lg font-bold text-slate-800 mb-4">माहवार वसूली बनाम बकाया — {yearlyYear}</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yearly.monthlyDefaulters.map((d, i) => ({
                      name: monthsShort[i],
                      भुगतान: d.paid,
                      बकाया: d.defaulters
                    }))} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '12px'}} />
                      <Area type="monotone" dataKey="भुगतान" stackId="1" fill="#1B6B3A" stroke="#1B6B3A" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="बकाया" stackId="1" fill="#E74C3C" stroke="#E74C3C" fillOpacity={0.4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Donors */}
              {yearly.topDonors.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">शीर्ष 10 दानदाता — {yearlyYear}</h3>
                      <p className="text-sm text-slate-500">सबसे ज़्यादा चंदा देने वाले</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-6 font-semibold w-10">#</th>
                          <th className="py-3 px-6 font-semibold">दानदाता</th>
                          <th className="py-3 px-6 font-semibold">क्षेत्र</th>
                          <th className="py-3 px-6 font-semibold text-center">भुगतान</th>
                          <th className="py-3 px-6 font-semibold text-right">कुल राशि</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {yearly.topDonors.map((d, idx) => (
                          <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-6">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                              }`}>{idx + 1}</span>
                            </td>
                            <td className="py-3 px-6 font-medium text-slate-800">{d.name}</td>
                            <td className="py-3 px-6 text-slate-600">{d.area}</td>
                            <td className="py-3 px-6 text-center text-slate-600">{d.count} बार</td>
                            <td className="py-3 px-6 text-right font-bold text-dargah-green">₹{d.totalAmount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Monthly Breakdown Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800">मासिक विस्तृत तालिका — {yearlyYear}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">महीना</th>
                        <th className="py-3 px-4 font-semibold text-right">मस्जिद</th>
                        <th className="py-3 px-4 font-semibold text-right">दरगाह</th>
                        <th className="py-3 px-4 font-semibold text-right">त्यौहार</th>
                        <th className="py-3 px-4 font-semibold text-right bg-green-50">कुल वसूली</th>
                        <th className="py-3 px-4 font-semibold text-right bg-red-50">कुल खर्चा</th>
                        <th className="py-3 px-4 font-semibold text-right">बैलेंस</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {yearly.months.map((m, i) => (
                        <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-800">{monthsHindi[i]}</td>
                          <td className="py-3 px-4 text-right text-slate-600">₹{m.collections.masjid.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right text-slate-600">₹{m.collections.dargah.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right text-slate-600">₹{m.collections.festival.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right font-bold text-dargah-green bg-green-50/50">₹{m.collections.total.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right font-bold text-red-600 bg-red-50/50">₹{m.expenses.total.toLocaleString('en-IN')}</td>
                          <td className={`py-3 px-4 text-right font-bold ${m.balance >= 0 ? 'text-dargah-green' : 'text-red-600'}`}>
                            ₹{m.balance.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <tr>
                        <td className="py-3 px-4">कुल</td>
                        <td className="py-3 px-4 text-right">₹{yearly.annualCollections.masjid.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right">₹{yearly.annualCollections.dargah.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right">₹{yearly.annualCollections.festival.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right text-dargah-green bg-green-50">₹{yearly.annualCollections.total.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right text-red-600 bg-red-50">₹{yearly.annualExpenses.total.toLocaleString('en-IN')}</td>
                        <td className={`py-3 px-4 text-right ${yearly.annualBalance >= 0 ? 'text-dargah-green' : 'text-red-600'}`}>
                          ₹{yearly.annualBalance.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ===================== MONTHLY/DEFAULTERS TAB ===================== */}
      {activeTab === 'monthly' && (
        <>
          {/* P&L Cards */}
          {!loadingDash && dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FundPL title="मस्जिद फंड" color="green" data={{ inflow: dashboard?.funds?.masjid, outflow: dashboard?.expenses?.masjid }} />
              <FundPL title="दरगाह फंड" color="gold" data={{ inflow: dashboard?.funds?.dargah, outflow: dashboard?.expenses?.dargah }} />
              <FundPL title="त्यौहार फंड" color="teal" data={{ inflow: dashboard?.funds?.festival, outflow: dashboard?.expenses?.festival }} />
            </div>
          )}

          {/* Defaulters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">बकायादार सूची</h3>
                  <p className="text-sm text-slate-500">जिन्होंने अभी तक भुगतान नहीं किया</p>
                </div>
              </div>
              <div className="flex gap-2 no-print">
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-dargah-green/30">
                  {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{monthsHindi[i]}</option>)}
                </select>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none" />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingDefaulters ? (
                <div className="p-8 text-center text-slate-500">लोड हो रहा है...</div>
              ) : defaulters?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-medium">शानदार! इस महीने सबने चंदा दे दिया है। 🎉</div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-6 font-semibold">दानदाता का नाम</th>
                      <th className="py-3 px-6 font-semibold">फोन</th>
                      <th className="py-3 px-6 font-semibold">क्षेत्र</th>
                      <th className="py-3 px-6 font-semibold text-right">अपेक्षित (₹)</th>
                      <th className="py-3 px-6 font-semibold no-print">कार्रवाई</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {defaulters?.map(donor => (
                      <tr key={donor._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-6 font-medium text-slate-800">{donor.name}</td>
                        <td className="py-3 px-6 text-slate-600">{donor.phone || 'नहीं'}</td>
                        <td className="py-3 px-6 text-slate-600">{donor.area}</td>
                        <td className="py-3 px-6 text-right font-bold text-red-600">₹{donor.monthlyAmount}</td>
                        <td className="py-3 px-6 no-print">
                          <button
                            onClick={() => markPaidMutation.mutate({ donorId: donor._id, amount: donor.monthlyAmount, fundType: donor.fundType })}
                            disabled={markPaidMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 bg-dargah-green text-white text-xs font-bold rounded-lg hover:bg-dargah-green-dark transition-colors">
                            <Receipt className="w-3 h-3" /> भुगतान दर्ज
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Sub Components ---------- */

function MiniStatCard({ icon, label, value, color }) {
  return (
    <div className={`bg-white rounded-xl p-4 border-l-4 shadow-sm ${color}`}>
      <div className="flex items-center gap-2 mb-2 opacity-60">{icon}<span className="text-xs font-medium uppercase">{label}</span></div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function FundBar({ label, amount, total, color }) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>₹{amount.toLocaleString('en-IN')} ({pct}%)</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
}

function FundPL({ title, color, data }) {
  const inflow = data?.inflow || 0;
  const outflow = data?.outflow || 0;
  const balance = inflow - outflow;
  const colorMap = {
    green: 'border-l-[#1B6B3A] bg-green-50/50',
    gold: 'border-l-[#C9900C] bg-amber-50/50',
    teal: 'border-l-[#0D7E6A] bg-teal-50/50',
  };
  return (
    <div className={`p-6 rounded-2xl border border-l-4 shadow-sm ${colorMap[color]}`}>
      <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between"><span className="text-sm font-medium text-slate-500">कुल आय</span><span className="font-bold text-dargah-green">₹{inflow.toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between"><span className="text-sm font-medium text-slate-500">कुल खर्चा</span><span className="font-bold text-red-600">- ₹{outflow.toLocaleString('en-IN')}</span></div>
      </div>
      <div className="pt-3 border-t border-black/10 flex justify-between">
        <span className="text-sm font-bold uppercase text-slate-600">शुद्ध बैलेंस</span>
        <span className="text-xl font-bold text-slate-900">₹{balance.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}
