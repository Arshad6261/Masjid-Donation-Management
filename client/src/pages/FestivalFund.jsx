import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Wallet, Search, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FestivalFund() {
  const { data: summaries, isLoading } = useQuery({
    queryKey: ['festivalSummary'],
    queryFn: async () => {
      const { data } = await api.get('/reports/festival-summary');
      return data;
    }
  });

  if (isLoading) return <div className="p-8 text-center">लोड हो रहा है...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-dargah-green" /> त्यौहार फंड
          </h1>
          <p className="text-slate-500">त्यौहार चंदे और खर्चे का पूरा विवरण</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries?.map((s, idx) => (
          <FestivalCard key={`${s.festivalName}-${s.year}-${idx}`} summary={s} />
        ))}
        {summaries?.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
            कोई त्यौहार रिकॉर्ड नहीं मिला।
          </div>
        )}
      </div>
    </div>
  );
}

function FestivalCard({ summary }) {
  const [expanded, setExpanded] = useState(false);

  const { data: details, isLoading } = useQuery({
    queryKey: ['festivalDetails', summary.festivalName, summary.year],
    queryFn: async () => {
      const [{ data: d }, { data: e }] = await Promise.all([
        api.get(`/donations?fundType=festival`),
        api.get('/expenditure')
      ]);
      const dons = d.filter(x => x.festivalName === summary.festivalName && x.year === summary.year);
      const exps = e.filter(x => x.fundType === 'festival' && x.festivalName === summary.festivalName && new Date(x.expenseDate).getFullYear() === summary.year);
      return { donations: dons, expenses: exps };
    },
    enabled: expanded
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{summary.festivalName}</h3>
          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">{summary.year}</span>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">बैलेंस</p>
          <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{summary.balance.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 p-5 bg-white">
        <div>
          <p className="text-xs text-slate-500 uppercase font-medium">कुल चंदा</p>
          <p className="text-lg font-bold text-slate-800 mt-1">₹{summary.totalDonations.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400 mt-0.5">{summary.donationCount} लोग</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-medium">कुल खर्च</p>
          <p className="text-lg font-bold text-red-600 mt-1">₹{summary.totalExpenses.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full py-3 bg-slate-50 border-t border-slate-100 text-sm font-medium text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
      >
        {expanded ? <><ChevronUp className="w-4 h-4" /> विवरण छुपाएं</> : <><ChevronDown className="w-4 h-4" /> विवरण देखें</>}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 max-h-80 overflow-y-auto">
          {isLoading ? (
             <p className="text-center text-sm text-slate-500 py-4">लोड हो रहा है...</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">चंदा सूची ({details?.donations.length})</h4>
                <div className="space-y-2">
                  {details?.donations.map(d => (
                    <div key={d._id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{d.donor?.name || d.walkInDonorName || 'गुमनाम'}</p>
                        <p className="text-xs text-slate-500">{new Date(d.paymentDate).toLocaleDateString('hi-IN')} · {d.receiptNo}</p>
                      </div>
                      <p className="font-bold text-dargah-green">₹{d.amount.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                  {details?.donations.length === 0 && <p className="text-xs text-slate-500 italic">कोई चंदा नहीं</p>}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">खर्च सूची ({details?.expenses.length})</h4>
                <div className="space-y-2">
                  {details?.expenses.map(e => (
                    <div key={e._id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{e.title}</p>
                        <p className="text-xs text-slate-500">{new Date(e.expenseDate).toLocaleDateString('hi-IN')} · {e.category}</p>
                      </div>
                      <p className="font-bold text-red-600">₹{e.amount.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                  {details?.expenses.length === 0 && <p className="text-xs text-slate-500 italic">कोई खर्च नहीं</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
