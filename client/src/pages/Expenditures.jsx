import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, FileText, Plus, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const monthsHindi = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'];

export default function Expenditures() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('masjid');
  const navigate = useNavigate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const tabLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', festival: 'त्यौहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम' };
  const categoryLabels = {
    imam_salary: 'इमाम वेतन', electricity: 'बिज़ली', maintenance: 'रखरखाव',
    cleaning: 'साफ़-सफ़ाई', event: 'आयोजन', water: 'पानी', other: 'अन्य'
  };

  const { data: expenditures, isLoading } = useQuery({
    queryKey: ['expenditures', month, year, activeTab],
    queryFn: async () => {
      const fundParam = activeTab === 'all' ? '' : activeTab;
      const { data } = await api.get(`/expenditures?month=${month}&year=${year}&fundType=${fundParam}`);
      return data;
    }
  });

  const totalExpense = expenditures?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          <button onClick={() => setCurrentDate(new Date(year, month - 2, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-800 min-w-[120px] text-center">
            {monthsHindi[month - 1]} {year}
          </span>
          <button onClick={() => setCurrentDate(new Date(year, month, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={() => navigate('/expenditures/new')}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors w-full sm:w-auto">
          <Plus className="w-5 h-5" /> खर्चा जोड़ें
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex items-center justify-between border-l-4 border-l-red-500">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">कुल खर्चे</p>
          <h2 className="text-3xl font-bold text-red-600">₹{totalExpense.toLocaleString('en-IN')}</h2>
        </div>
        <div className="p-4 bg-red-50 rounded-full text-red-500"><Wallet className="w-8 h-8" /></div>
      </div>

      <div className="flex bg-slate-200/50 p-1 rounded-xl w-full overflow-x-auto">
        {['masjid', 'dargah', 'festival', 'jumma_jholi', 'tamiri_kaam'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>{tabLabels[tab]}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">लोड हो रहा है...</div>
        ) : expenditures?.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-lg">इस अवधि में कोई खर्चा नहीं।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6 font-semibold">तारीख</th>
                  <th className="py-4 px-6 font-semibold">श्रेणी</th>
                  <th className="py-4 px-6 font-semibold">विवरण</th>
                  <th className="py-4 px-6 font-semibold">विक्रेता</th>
                  <th className="py-4 px-6 font-semibold text-right">राशि</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenditures?.map(exp => (
                  <tr key={exp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-600">{new Date(exp.expenseDate).toLocaleDateString('hi-IN')}</td>
                    <td className="py-4 px-6"><span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs">{exp.category}</span></td>
                    <td className="py-4 px-6 text-slate-800">{exp.description}</td>
                    <td className="py-4 px-6 text-slate-600">{exp.vendor || '-'}</td>
                    <td className="py-4 px-6 text-right font-bold text-red-600">₹{exp.amount?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
