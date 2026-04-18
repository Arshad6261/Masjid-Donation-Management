import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Search, Loader2 } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

export default function ReceiptSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [queryTerm, setQueryTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ['receiptSearch', queryTerm],
    queryFn: async () => {
      if (!queryTerm) return [];
      const { data } = await api.get(`/donations/search?q=${queryTerm}`);
      return data;
    },
    enabled: !!queryTerm
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      setQueryTerm(searchTerm.trim());
    }
  };

  const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', festival: 'त्यौहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-slate-800">रसीद खोजें (Search Receipts)</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
            रसीद नंबर (उदा. RCP-202503-001) या नाम / फ़ोन नंबर द्वारा खोजें
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="खोजें..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dargah-green/30 outline-none"
              />
            </div>
            <button type="submit" disabled={isLoading} className="bg-dargah-green text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-dargah-green-dark transition-colors flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'खोजें'}
            </button>
          </div>
        </form>

        {queryTerm && !isLoading && results?.length === 0 && (
          <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100 text-slate-500">
            "{queryTerm}" के लिए कोई रसीद नहीं मिली।
          </div>
        )}

        {/* Results List */}
        {results?.length > 0 && (
          <div className="space-y-3">
            {results.map((d) => (
              <div key={d._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-slate-100 shadow-sm rounded-xl hover:border-dargah-green/30 transition-colors gap-4 sm:gap-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-dargah-cream text-dargah-green flex items-center justify-center font-bold text-lg flex-shrink-0">
                    <span className="text-xl">₹</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{d.receiptNo}</h3>
                    <p className="text-slate-600 text-sm mt-0.5">
                      <span className="font-semibold">{d.donor?.name || 'गुमनाम'}</span>
                      {d.donor?.phone && ` · ${d.donor.phone}`}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                        {new Date(d.paymentDate).toLocaleDateString('hi-IN')}
                      </span>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize font-medium">
                        {fundLabels[d.fundType] || d.fundType}
                      </span>
                      {d.isAdvance && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          अग्रिम ({d.batchIndex}/{d.totalMonths})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span className="font-bold text-slate-900 text-xl font-mono">₹{d.amount}</span>
                  <button 
                    onClick={() => setSelectedReceipt(d)}
                    className="mt-1 sm:mt-2 text-sm bg-dargah-green text-white hover:bg-dargah-green-dark px-4 py-1.5 rounded-lg font-semibold transition-colors shadow-sm"
                  >
                    रसीद देखें
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReceipt && (
        <ReceiptModal donation={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
}
