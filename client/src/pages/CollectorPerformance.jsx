import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Trophy, Users, IndianRupee, TrendingUp, MapPinned } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function CollectorPerformance() {
  const { user } = useAuth();
  const { userId } = useParams();
  const isAdmin = user?.role === 'admin';
  const isDetailRoute = Boolean(userId);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: collectorStats, isLoading } = useQuery({
    queryKey: ['collectorStats', month, year, user?._id],
    queryFn: async () => {
      const { data } = await api.get(`/reports/collector-stats?month=${month}&year=${year}`);
      return data;
    },
    enabled: !isDetailRoute
  });

  const { data: collectorDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['collectorStatsDetail', userId, month, year],
    queryFn: async () => {
      const { data } = await api.get(`/reports/collector-stats/${userId}?month=${month}&year=${year}`);
      return data;
    },
    enabled: isAdmin && isDetailRoute
  });

  if (isLoading || loadingDetail) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl shadow-sm animate-pulse" />)}</div>;
  }

  if (isDetailRoute) {
    if (!isAdmin) {
      return <div className="bg-white rounded-xl p-6 text-slate-600">केवल प्रशासक यह विवरण देख सकते हैं।</div>;
    }
    return <CollectorDetailView detail={collectorDetail} month={month} year={year} setMonth={setMonth} setYear={setYear} />;
  }

  const data = isAdmin ? (collectorStats || []) : (collectorStats?.slice(0, 1) || []);
  return isAdmin
    ? <CollectorsAdminView data={data} month={month} year={year} setMonth={setMonth} setYear={setYear} />
    : <CollectorMemberView collector={data[0]} month={month} year={year} setMonth={setMonth} setYear={setYear} />;
}

function CollectorsAdminView({ data, month, year, setMonth, setYear }) {
  const totals = useMemo(() => {
    const combinedCollected = data.reduce((sum, c) => sum + (c.thisMonth?.totalCollected || 0), 0);
    const combinedExpected = data.reduce((sum, c) => sum + (c.thisMonth?.expectedAmount || 0), 0);
    const orgRate = combinedExpected > 0 ? Math.round((combinedCollected / combinedExpected) * 100) : 0;
    return { combinedCollected, orgRate };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-slate-800">कलेक्टर प्रदर्शन</h2>
        <MonthYear month={month} year={year} setMonth={setMonth} setYear={setYear} />
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const rate = item.thisMonth.collectionRate || 0;
          const colorClass = rate >= 90 ? 'bg-green-600' : rate >= 75 ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div key={item.collector._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900">#{index + 1} {item.collector.name}</p>
                  <p className="text-sm text-slate-500">{(item.collector.assignedAreas || []).join(', ') || 'कोई क्षेत्र नियुक्त नहीं'}</p>
                </div>
                <Link to={`/reports/collectors/${item.collector._id}`} className="text-sm font-semibold text-dargah-green hover:text-dargah-green-dark">
                  विवरण
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <span className="text-slate-700">{item.thisMonth.donorsVisited} दानदाता</span>
                <span className="font-semibold text-dargah-green">₹{item.thisMonth.totalCollected.toLocaleString('en-IN')}</span>
                <span className="text-slate-700">दर: {rate}%</span>
                <span className="text-slate-600">{item.thisMonth.visitsCompleted} दौरे पूर्ण</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                <div className={`${colorClass} h-full`} style={{ width: `${Math.min(rate, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-6">
        <p className="text-sm text-slate-700"><span className="font-semibold">सक्रिय कलेक्टर:</span> {data.length}</p>
        <p className="text-sm text-slate-700"><span className="font-semibold">कुल संयुक्त वसूली:</span> ₹{totals.combinedCollected.toLocaleString('en-IN')}</p>
        <p className="text-sm text-slate-700"><span className="font-semibold">संगठन वसूली दर:</span> {totals.orgRate}%</p>
      </div>
    </div>
  );
}

function CollectorMemberView({ collector, month, year, setMonth, setYear }) {
  const recentCollections = collector?.trend || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-slate-800">आपका प्रदर्शन — {new Date(year, month - 1).toLocaleString('hi-IN', { month: 'long' })} {year}</h2>
        <MonthYear month={month} year={year} setMonth={setMonth} setYear={setYear} />
      </div>

      <StatCards thisMonth={collector?.thisMonth} />

      <TrendChart trend={collector?.trend || []} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">हाल की वसूली (पिछले 6 महीने)</h3>
        </div>
        <div className="p-4">
          {recentCollections.length === 0 && <p className="text-sm text-slate-500">हाल का कोई डेटा उपलब्ध नहीं है।</p>}
          <div className="space-y-2">
            {recentCollections.slice().reverse().slice(0, 10).map((row) => (
              <div key={`${row.month}-${row.year}`} className="flex justify-between text-sm bg-slate-50 px-3 py-2 rounded-lg">
                <span>{row.monthName} {row.year}</span>
                <span className="font-semibold">₹{row.collected.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CollectorDetailView({ detail, month, year, setMonth, setYear }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{detail?.collector?.name} — प्रदर्शन विवरण</h2>
          <p className="text-sm text-slate-500">{(detail?.collector?.assignedAreas || []).join(', ') || 'कोई क्षेत्र नियुक्त नहीं'}</p>
        </div>
        <MonthYear month={month} year={year} setMonth={setMonth} setYear={setYear} />
      </div>

      <StatCards thisMonth={detail?.thisMonth} />
      <TrendChart trend={detail?.trend || []} />

      <SimpleTable
        title="इस माह जिन दानदाताओं से वसूली हुई"
        rows={detail?.donorsCollected || []}
        columns={[
          { key: 'name', label: 'दानदाता', render: (r) => r.donor?.name || '-' },
          { key: 'area', label: 'क्षेत्र', render: (r) => r.donor?.area || '-' },
          { key: 'amount', label: 'राशि', render: (r) => `₹${r.amount.toLocaleString('en-IN')}` },
          { key: 'date', label: 'तारीख', render: (r) => new Date(r.paymentDate).toLocaleDateString('en-IN') }
        ]}
      />

      <SimpleTable
        title="इस माह छोड़े गए दानदाता"
        rows={detail?.donorsSkipped || []}
        columns={[
          { key: 'name', label: 'दानदाता', render: (r) => r.donor?.name || '-' },
          { key: 'area', label: 'क्षेत्र', render: (r) => r.area || '-' },
          { key: 'reason', label: 'छोड़ने का कारण', render: (r) => r.skipReason || '-' },
          { key: 'date', label: 'दौरे की तारीख', render: (r) => new Date(r.visitDate).toLocaleDateString('en-IN') }
        ]}
      />

      <SimpleTable
        title="घर-दौरा सूची"
        rows={detail?.houseVisits || []}
        columns={[
          { key: 'date', label: 'दौरे की तारीख', render: (r) => new Date(r.visitDate).toLocaleDateString('en-IN') },
          { key: 'area', label: 'क्षेत्र', render: (r) => r.area },
          { key: 'status', label: 'स्थिति', render: (r) => r.status },
          { key: 'totalCollected', label: 'कुल वसूली', render: (r) => `₹${(r.totalCollected || 0).toLocaleString('en-IN')}` }
        ]}
      />
    </div>
  );
}

function StatCards({ thisMonth }) {
  const cards = [
    { icon: Users, label: 'दानदाता विजिट', value: thisMonth?.donorsVisited || 0 },
    { icon: IndianRupee, label: 'कुल वसूली', value: `₹${(thisMonth?.totalCollected || 0).toLocaleString('en-IN')}` },
    { icon: TrendingUp, label: 'वसूली दर', value: `${thisMonth?.collectionRate || 0}%` },
    { icon: MapPinned, label: 'पूर्ण दौरे', value: thisMonth?.visitsCompleted || 0 }
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <c.icon className="w-4 h-4" />
            <span>{c.label}</span>
          </div>
          <p className="text-xl font-bold text-slate-800 mt-2">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ trend }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">6 माह की वसूली प्रवृत्ति</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend.map((t) => ({ name: t.monthName, वसूली: t.collected, अपेक्षित: t.expected }))}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="वसूली" fill="#1B6B3A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="अपेक्षित" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SimpleTable({ title, rows, columns }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((col) => <th key={col.key} className="text-left px-4 py-3 font-semibold">{col.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-6 text-slate-500">कोई डेटा नहीं मिला।</td></tr>
            ) : rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => <td key={col.key} className="px-4 py-3 text-slate-700">{col.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthYear({ month, year, setMonth, setYear }) {
  const monthsHindi = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
  return (
    <div className="flex items-center gap-2">
      <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm">
        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{monthsHindi[i]}</option>)}
      </select>
      <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm" />
    </div>
  );
}
