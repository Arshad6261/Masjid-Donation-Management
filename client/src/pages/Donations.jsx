import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const monthsHindi = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'];

const fetchDonations = async ({ month, year, fundType }) => {
  const { data } = await api.get(`/donations?month=${month}&year=${year}&fundType=${fundType || ''}`);
  return data;
};

const fetchSummary = async (month, year) => {
  const { data } = await api.get(`/donations/monthly-summary?month=${month}&year=${year}`);
  return data;
};

export default function Donations() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('masjid');
  const navigate = useNavigate();

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const tabLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', festival: 'त्यौहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम' };

  const { data: donations, isLoading } = useQuery({
    queryKey: ['donations', month, year, activeTab],
    queryFn: () => fetchDonations({ month, year, fundType: activeTab === 'all' ? '' : activeTab })
  });

  const { data: summary } = useQuery({
    queryKey: ['donationsSummary', month, year],
    queryFn: () => fetchSummary(month, year)
  });

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month, 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-800 min-w-[120px] text-center">
            {monthsHindi[month - 1]} {year}
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={() => navigate('/donations/new')}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors w-full sm:w-auto justify-center"
          style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}
        >
          <Plus className="w-5 h-5" /> चंदा जोड़ें
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center sm:text-left border-l-4 border-l-[#1B6B3A]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">वसूली</p>
          <p className="text-lg sm:text-2xl font-bold text-dargah-green mt-1">₹{summary?.collected?.toLocaleString('en-IN') || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center sm:text-left border-l-4 border-l-[#C9900C]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">अपेक्षित</p>
          <p className="text-lg sm:text-2xl font-bold text-dargah-gold mt-1">₹{summary?.expected?.toLocaleString('en-IN') || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center sm:text-left border-l-4 border-l-red-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">शेष</p>
          <p className="text-lg sm:text-2xl font-bold text-red-600 mt-1">₹{summary?.remaining?.toLocaleString('en-IN') || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 p-1 rounded-xl w-full overflow-x-auto mx-auto sm:mx-0">
        {['masjid', 'dargah', 'festival', 'jumma_jholi', 'tamiri_kaam'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">चंदा लोड हो रहा है...</div>
        ) : donations?.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-lg">इस अवधि में कोई चंदा नहीं मिला।</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 font-semibold">रसीद नं.</th>
                    <th className="py-4 px-6 font-semibold">तारीख</th>
                    <th className="py-4 px-6 font-semibold">दानदाता का नाम</th>
                    <th className="py-4 px-6 font-semibold">राशि</th>
                    <th className="py-4 px-6 font-semibold text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations?.map(donation => (
                    <tr key={donation._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-800">{donation.receiptNo}</td>
                      <td className="py-4 px-6 text-slate-600">{new Date(donation.paymentDate).toLocaleDateString('hi-IN')}</td>
                      <td className="py-4 px-6 text-slate-800">
                        {donation.donor?.name || 'अज्ञात'}
                        <div className="text-xs text-slate-500">{donation.donor?.area}</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">₹{donation.amount.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => window.open(`/receipt/${donation.receiptNo}`, '_blank', 'width=800,height=600')}
                          className="text-dargah-green hover:text-dargah-green-dark bg-dargah-cream px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          रसीद देखें
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {donations?.map(donation => (
                <div key={donation._id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 leading-tight">{donation.donor?.name || 'अज्ञात'}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{donation.receiptNo} • {new Date(donation.paymentDate).toLocaleDateString('hi-IN')}</p>
                    </div>
                    <span className="font-bold text-dargah-green bg-dargah-cream px-2 py-1 rounded-lg">₹{donation.amount}</span>
                  </div>
                  <button 
                    onClick={() => window.open(`/receipt/${donation.receiptNo}`, '_blank', 'width=800,height=600')}
                    className="mt-3 w-full border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> रसीद देखें
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
