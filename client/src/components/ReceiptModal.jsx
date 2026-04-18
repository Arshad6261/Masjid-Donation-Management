import React, { useRef } from 'react';
import { Printer, MessageCircle, X } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export default function ReceiptModal({ donation, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    // Basic approach: simply print the window, ensuring classes like `print:block` work
    window.print();
  };

  const monthsHindi = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'];
  const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', festival: 'त्यौहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम' };
  const methodLabels = { walk_in: 'स्वयं आकर', bank_transfer: 'बैंक ट्रांसफर', house_visit: 'घर-दौरा' };

  if (!donation) return null;

  const whatsappLink = getWhatsAppLink(donation.donor, donation);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white" onMouseDown={onClose}>
      
      {/* Modal Container */}
      <div 
        ref={printRef}
        onMouseDown={(e) => e.stopPropagation()} 
        className="bg-white p-6 sm:p-8 w-full max-w-[800px] shadow-2xl rounded-2xl print:shadow-none print:rounded-none relative max-h-[90vh] overflow-y-auto print:overflow-visible print:max-h-none print:block"
      >
        
        {/* Decorative background texture for web only */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none no-print" style={{ backgroundImage: 'radial-gradient(circle at center, #0F4C2A 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 sm:gap-3 no-print z-10">
          <a target="_blank" rel="noopener noreferrer" href={whatsappLink} className="flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium shadow-sm hover:bg-[#20bd5a] transition-colors text-sm sm:text-base">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" /> शेयर
          </a>
          <button onClick={handlePrint} className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium shadow-sm hover:bg-slate-900 transition-colors text-sm sm:text-base">
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" /> प्रिंट
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* --- RECEIPT CONTENT --- */}
        <div className="relative z-0">
          {/* Branded Header */}
          <div className="text-center pb-6 mb-6 pt-10 sm:pt-8 print:pt-0">
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-3">
              <img src="/assets/dargah.jpg" alt="दरगाह" className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-dargah-gold shadow no-print" />
              {/* Optional grayscale logo for print */}
              <img src="/assets/dargah.jpg" alt="दरगाह" className="hidden print:block w-14 h-14 rounded-full object-cover border-2 border-slate-800 grayscale" />
              
              <div>
                <h1 className="text-xl md:text-2xl font-arabic font-bold text-dargah-green-dark print:text-black">हज़रत सुल्तान शाह पीर</h1>
                <h2 className="text-sm md:text-base font-body font-semibold text-dargah-gold print:text-black">मस्जिद एवं दरगाह कमेटी</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 max-w-sm mx-auto">
              <div className="flex-1 h-px bg-dargah-gold/40 print:bg-black/40"></div>
              <span className="text-dargah-gold text-lg print:text-black">✦</span>
              <div className="flex-1 h-px bg-dargah-gold/40 print:bg-black/40"></div>
            </div>
            
            <div className="inline-block px-6 md:px-8 py-1 md:py-1.5 mt-3 bg-dargah-cream print:bg-white text-dargah-green-dark print:text-black font-bold border border-dargah-gold/30 print:border-black rounded-full tracking-widest uppercase text-xs md:text-sm shadow-sm print:shadow-none">
              आधिकारिक रसीद
            </div>

            {donation.isAdvance && (
              <div className="mt-2 text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full inline-flex md:ml-2">
                अग्रिम चंदा (1/{donation.totalMonths})
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 text-sm sm:text-base text-slate-800 mb-8 border-b border-dashed border-slate-300 pb-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex"><span className="font-bold w-24 sm:w-32">रसीद नं:</span><span className="font-mono bg-slate-100 print:bg-transparent px-1 rounded">{donation.receiptNo}</span></div>
              <div className="flex"><span className="font-bold w-24 sm:w-32">तारीख:</span><span>{new Date(donation.paymentDate).toLocaleDateString('hi-IN')}</span></div>
              <div className="flex"><span className="font-bold w-24 sm:w-32">प्राप्तकर्ता:</span><span>{donation.collectedBy?.name || 'कमेटी सदस्य'}</span></div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex"><span className="font-bold w-24 sm:w-32">फंड:</span><span className="capitalize font-bold text-dargah-green print:text-black">{fundLabels[donation.fundType] || donation.fundType}</span></div>
              {donation.festivalName && (
                <div className="flex"><span className="font-bold w-24 sm:w-32">त्यौहार:</span><span>{donation.festivalName}</span></div>
              )}
              <div className="flex"><span className="font-bold w-24 sm:w-32">तरीका:</span><span className="capitalize">{methodLabels[donation.collectionMethod] || donation.collectionMethod}</span></div>
            </div>
          </div>

          {/* Body */}
          <div className="mb-10 sm:mb-12 leading-loose text-base sm:text-lg text-slate-800 text-center sm:text-left">
            <p>
              <span className="font-bold border-b border-dotted border-slate-400 px-2 uppercase">{donation.donor?.name || 'गुमनाम'}</span> 
              {' '}से धन्यवाद सहित प्राप्त हुआ
              <br className="hidden sm:block" />
              निवासी <span className="italic border-b border-dotted border-slate-400 px-2">{donation.donor?.area || '-'}</span> 
              {' '}राशि रुपये <span className="font-bold text-lg sm:text-xl border-b border-dargah-gold/30 print:border-black px-2 bg-dargah-cream print:bg-transparent rounded-t mt-2 inline-block">₹ {donation.amount?.toLocaleString('en-IN')} /-</span>
              <br />
              <span className="text-sm mt-3 sm:mt-4 text-slate-600 block italic leading-snug">
                {donation.isAdvance && donation.totalMonths > 1
                  ? `अग्रिम चंदा - ${donation.totalMonths} महीनों के लिए कुल एकत्रित।`
                  : `${fundLabels[donation.fundType] || donation.fundType} चंदा ${monthsHindi[(donation.month || 1) - 1]} ${donation.year} के लिए।`
                }
              </span>
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end mt-12 sm:mt-16 pt-8 border-t border-slate-100 print:border-t-0">
            <div className="text-center">
              <div className="w-32 sm:w-48 border-b-2 border-slate-900 mb-2 mt-8"></div>
              <p className="font-semibold text-xs sm:text-sm">प्राप्तकर्ता के हस्ताक्षर</p>
            </div>
            <div className="text-right text-[10px] sm:text-xs text-slate-400 italic">
              कम्प्यूटर जनित रसीद।<br />
              {new Date().toLocaleString('hi-IN')}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
