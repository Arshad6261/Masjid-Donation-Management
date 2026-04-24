import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { HandCoins, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JummaTholi() {
  const { data: donations, isLoading } = useQuery({
    queryKey: ['donations', 'jumma_jholi'],
    queryFn: async () => {
      const { data } = await api.get(`/donations?fundType=jumma_jholi`);
      return data;
    }
  });

  const totalAmount = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HandCoins className="w-6 h-6 text-purple-600" /> जुम्मा झोली (Jumma Tholi)
          </h1>
          <p className="text-slate-500">शुक्रवार नमाज़ के बाद एकत्रित चंदे का विवरण</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-white/80 text-sm font-medium mb-1">कुल एकत्रित</h2>
        <p className="text-4xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">लोड हो रहा है...</div>
        ) : donations?.length === 0 ? (
          <div className="p-8 text-center text-slate-500">कोई चंदा नहीं मिला।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-sm text-slate-500">
                  <th className="p-4 font-medium">रसीद</th>
                  <th className="p-4 font-medium">तारीख</th>
                  <th className="p-4 font-medium">प्राप्तकर्ता</th>
                  <th className="p-4 font-medium">राशि</th>
                  <th className="p-4 font-medium text-right">विवरण</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">{d.receiptNo}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{new Date(d.paymentDate).toLocaleDateString('hi-IN')}</td>
                    <td className="p-4 text-sm">{d.collectedBy?.name || '-'}</td>
                    <td className="p-4 font-bold text-slate-800">₹{d.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right">
                      <Link to={`/receipt/${d.receiptNo}`} className="p-2 inline-flex items-center justify-center text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </td>
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
