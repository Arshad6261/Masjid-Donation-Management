import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Wallet, TrendingUp, HandCoins, Building2, Map, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const { data } = await api.get('/reports/dashboard'); return data; }
  });

  const { data: chartData } = useQuery({
    queryKey: ['chart'],
    queryFn: async () => { const { data } = await api.get(`/reports/monthly?year=${new Date().getFullYear()}`); return data; }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl h-24 animate-pulse shadow-sm"></div>)}
        </div>
        <div className="bg-white rounded-xl h-64 animate-pulse shadow-sm"></div>
      </div>
    );
  }

  const totalBalance = (dashboard?.balances?.masjid || 0) + (dashboard?.balances?.dargah || 0) + (dashboard?.balances?.festival || 0) + (dashboard?.balances?.jumma_jholi || 0) + (dashboard?.balances?.tamiri_kaam || 0);

  const monthsHindi = ['जन', 'फर', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुला', 'अग', 'सित', 'अक्ट', 'नव', 'दिस'];
  const formattedChart = chartData?.slice(Math.max(new Date().getMonth() - 5, 0), new Date().getMonth() + 1).map(d => ({
    name: monthsHindi[d.month - 1],
    मस्जिद: d.masjid, दरगाह: d.dargah, त्यौहार: d.festival
  })) || [];

  return (
    <div className="space-y-6">
      {/* Member area banner */}
      {!isAdmin && user?.assignedAreas?.length > 0 && (
        <div className="bg-dargah-cream border border-dargah-gold/20 rounded-xl p-4 flex items-center gap-3">
          <Map className="w-5 h-5 text-dargah-green" />
          <div className="flex-1">
            <p className="text-sm font-medium text-dargah-green-dark">आपके नियुक्त क्षेत्र</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {user.assignedAreas.map(a => (
                <span key={a} className="px-3 py-1 bg-white text-dargah-green text-sm font-semibold rounded-full border border-dargah-gold/30">{a}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Balance Banner */}
      <div className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B6B3A 72%, #C9900C 100%)' }}>
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-1">{isAdmin ? 'कुल उपलब्ध बैलेंस' : 'इस महीने की वसूली'}</p>
          <h2 className="text-4xl font-bold">₹{totalBalance.toLocaleString('en-IN')}</h2>
          
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            <button onClick={() => navigate('/donations/new')} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4" /> चंदा जोड़ें
            </button>
            {isAdmin && (
              <button onClick={() => navigate('/expenditures/new')} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
                <TrendingUp className="w-4 h-4" /> खर्चा जोड़ें
              </button>
            )}
            <button onClick={() => navigate('/visits')} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
              <Map className="w-4 h-4" /> घर-दौरा
            </button>
          </div>
        </div>
        <Wallet className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5" />
      </div>

      {/* Fund Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="मस्जिद फंड" amount={dashboard?.funds?.masjid || 0} borderColor="border-l-[#1B6B3A]" icon={<Building2 className="w-6 h-6"/>} iconBg="bg-green-50 text-green-700" />
        <StatCard title="दरगाह फंड" amount={dashboard?.funds?.dargah || 0} borderColor="border-l-[#C9900C]" icon={<HandCoins className="w-6 h-6"/>} iconBg="bg-amber-50 text-amber-600" />
        <StatCard title="त्यौहार फंड" amount={dashboard?.funds?.festival || 0} borderColor="border-l-[#0D7E6A]" icon={<Wallet className="w-6 h-6"/>} iconBg="bg-blue-50 text-blue-600" />
        <StatCard title="जुम्मा झोली" amount={dashboard?.funds?.jumma_jholi || 0} borderColor="border-l-[#8B5CF6]" icon={<HandCoins className="w-6 h-6"/>} iconBg="bg-purple-50 text-purple-600" />
        <StatCard title="तामीरी काम" amount={dashboard?.funds?.tamiri_kaam || 0} borderColor="border-l-[#F97316]" icon={<Building2 className="w-6 h-6"/>} iconBg="bg-orange-50 text-orange-600" />
        {isAdmin && <StatCard title="इस माह खर्चे" amount={dashboard?.thisMonthExpense || 0} borderColor="border-l-red-500" icon={<TrendingUp className="w-6 h-6"/>} iconBg="bg-red-50 text-red-600" />}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-6">चंदा रुझान (पिछले 6 महीने)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
              <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
              <Bar dataKey="मस्जिद" fill="#1B6B3A" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="दरगाह" fill="#C9900C" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="त्यौहार" fill="#0D7E6A" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, amount, borderColor, icon, iconBg }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 ${borderColor} p-4 flex flex-col justify-between`}>
      <div className={`p-2 rounded-xl w-fit ${iconBg} mb-3`}>{icon}</div>
      <div>
        <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
        <p className="text-xl md:text-2xl font-bold text-slate-800">₹{(amount || 0).toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
}
