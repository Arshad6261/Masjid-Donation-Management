import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Printer, MessageCircle } from 'lucide-react';

export default function Receipt() {
  const { id } = useParams();
  const { data: donation, isLoading, error } = useQuery({
    queryKey: ['receipt', id],
    queryFn: async () => {
      const { data } = await api.get(`/donations/receipt/${id}`);
      return data;
    }
  });

  const handlePrint = () => window.print();

  const monthsHindi = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'];
  const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', festival: 'त्यौहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम' };
  const methodLabels = { walk_in: 'स्वयं आकर', bank_transfer: 'बैंक ट्रांसफर', house_visit: 'घर-दौरा' };

  const shareText = donation ? encodeURIComponent(
    `हज़रत सुल्तान शाह पीर की तरफ से रसीद\nरसीद नं: ${donation.receiptNo}\nराशि: ₹${donation.amount}\nफंड: ${fundLabels[donation.fundType] || donation.fundType}\nतारीख: ${new Date(donation.paymentDate).toLocaleDateString('hi-IN')}`
  ) : '';

  if (isLoading) return <div className="p-8 text-center">रसीद लोड हो रही है...</div>;
  if (error || !donation) return <div className="p-8 text-center text-red-600">रसीद लोड करने में त्रुटि</div>;

  return (
    <div className="min-h-screen bg-dargah-cream flex py-8 justify-center print:bg-white print:p-0">
      <div className="bg-white p-8 w-full max-w-[800px] shadow-lg print:shadow-none relative">
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-3 no-print">
          <a target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${shareText}`} className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90">
            <MessageCircle className="w-5 h-5" /> शेयर
          </a>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-slate-900">
            <Printer className="w-5 h-5" /> प्रिंट
          </button>
        </div>

        {/* Branded Header */}
        <div className="text-center pb-6 mb-6 pt-8 print:pt-0">
          <div className="flex items-center justify-center gap-4 mb-3">
            <img src="/assets/dargah.jpg" alt="दरगाह" className="w-14 h-14 rounded-full object-cover border-2 border-dargah-gold shadow" />
            <div>
              <h1 className="text-2xl font-arabic font-bold text-dargah-green-dark">हज़रत सुल्तान शाह पीर</h1>
              <h2 className="text-base font-body font-semibold text-dargah-gold">मस्जिद एवं दरगाह कमेटी</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1 h-px bg-dargah-gold/40"></div>
            <span className="text-dargah-gold text-xl">✦</span>
            <div className="flex-1 h-px bg-dargah-gold/40"></div>
          </div>
          <div className="inline-block px-8 py-1.5 mt-3 bg-dargah-cream text-dargah-green-dark font-bold border border-dargah-gold/30 rounded-full tracking-widest uppercase text-sm">
            आधिकारिक रसीद
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-8 text-base text-slate-800 mb-8 border-b border-dashed border-slate-300 pb-8">
          <div className="space-y-4">
            <div className="flex"><span className="font-bold w-32">रसीद नं:</span><span className="font-mono">{donation.receiptNo}</span></div>
            <div className="flex"><span className="font-bold w-32">तारीख:</span><span>{new Date(donation.paymentDate).toLocaleDateString('hi-IN')}</span></div>
            <div className="flex"><span className="font-bold w-32">प्राप्तकर्ता:</span><span>{donation.collectedBy?.name || 'कमेटी सदस्य'}</span></div>
          </div>
          <div className="space-y-4">
            <div className="flex"><span className="font-bold w-32">फंड:</span><span className="capitalize font-bold text-dargah-green">{fundLabels[donation.fundType] || donation.fundType}</span></div>
            {donation.festivalName && (
              <div className="flex"><span className="font-bold w-32">त्यौहार:</span><span>{donation.festivalName}</span></div>
            )}
            <div className="flex"><span className="font-bold w-32">तरीका:</span><span className="capitalize">{methodLabels[donation.collectionMethod] || donation.collectionMethod}</span></div>
          </div>
        </div>

        {/* Body */}
        <div className="mb-12 leading-loose text-lg text-slate-800">
          <p>
            <span className="font-bold border-b border-dotted border-slate-400 px-2 uppercase">{donation.donor?.name || 'गुमनाम'}</span> 
            {' '}से धन्यवाद सहित प्राप्त हुआ
            <br />
            निवासी <span className="italic border-b border-dotted border-slate-400 px-2">{donation.donor?.area || '-'}</span> 
            {' '}राशि रुपये <span className="font-bold text-xl border-b border-dargah-gold/30 px-2 bg-dargah-cream">₹ {donation.amount?.toLocaleString('en-IN')} /-</span>
            <br />
            <span className="text-sm mt-4 text-slate-600 block italic">{fundLabels[donation.fundType] || donation.fundType} चंदा {monthsHindi[(donation.month || 1) - 1]} {donation.year} के लिए।</span>
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-16 pt-8">
          <div className="text-center">
            <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
            <p className="font-semibold text-sm">प्राप्तकर्ता के हस्ताक्षर</p>
          </div>
          <div className="text-right text-xs text-slate-400 italic">
            कम्प्यूटर जनित रसीद।<br />
            {new Date().toLocaleString('hi-IN')}
          </div>
        </div>
      </div>
    </div>
  );
}
