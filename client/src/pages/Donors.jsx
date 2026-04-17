import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Search, Plus, Phone, MapPin, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fetchDonors = async (search) => {
  const { data } = await api.get(`/donors?search=${search}`);
  return data;
};

export default function Donors() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const { data: donors, isLoading } = useQuery({
    queryKey: ['donors', search],
    queryFn: () => fetchDonors(search)
  });

  const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', both: 'दोनों', festival: 'त्यौहार' };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="नाम, फोन या आईडी खोजें..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green/30 outline-none shadow-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse"></div>)}
        </div>
      ) : donors?.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">कोई दानदाता नहीं मिला</h3>
          <p className="text-slate-500 text-sm mt-1">खोज बदलें या नया दानदाता जोड़ें।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {donors?.map(donor => (
            <div 
              key={donor._id} 
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-dargah-green/30 hover:shadow-md transition-all group"
            >
              <div onClick={() => navigate(`/donors/${donor._id}`)} className="cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-dargah-green transition-colors">{donor.name}</h3>
                    <span className="text-xs font-semibold text-slate-500">{donor.donorId}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                    donor.fundType === 'masjid' ? 'bg-green-50 text-green-800' : 
                    donor.fundType === 'dargah' ? 'bg-amber-50 text-amber-800' : 
                    'bg-blue-50 text-blue-800'
                  }`}>
                    {fundLabels[donor.fundType] || donor.fundType}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-sm text-slate-600 gap-2">
                    <Phone className="w-4 h-4 text-slate-400" /> {donor.phone || 'नहीं'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600 gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> {donor.area}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500">मासिक राशि</p>
                    <p className="font-bold text-slate-800">₹{donor.monthlyAmount}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-dargah-green transition-colors" />
                </div>
              </div>
              
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/donors/${donor._id}?tab=ledger&year=${currentYear}`); }}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-dargah-cream text-dargah-green text-sm font-semibold rounded-lg border border-dargah-gold/20 hover:bg-dargah-gold/10 transition-all"
              >
                <Calendar className="w-4 h-4" /> {currentYear} का रिकॉर्ड
              </button>
            </div>
          ))}
        </div>
      )}

      <button 
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-20 no-print"
        style={{ background: 'linear-gradient(135deg, #0F4C2A, #1B6B3A)' }}
        onClick={() => navigate('/donors/new')}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
