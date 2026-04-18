/**
 * Feature 5: WhatsApp Integration utility
 */

export const getWhatsAppLink = (donor, donation) => {
  const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', festival: 'त्यौहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम' };
  
  const text = `हज़रत सुल्तान शाह पीर की तरफ से रसीद\n` +
               `रसीद नं: ${donation?.receiptNo || 'N/A'}\n` +
               `राशि: ₹${donation?.amount || 0}\n` +
               `फंड: ${fundLabels[donation?.fundType] || donation?.fundType}\n` +
               `तारीख: ${new Date(donation?.paymentDate || Date.now()).toLocaleDateString('hi-IN')}`;

  const encodedText = encodeURIComponent(text);

  if (donor?.phone) {
    // Strip non-digits safely
    let p = donor.phone.replace(/\\D/g, '');
    
    // If Pakistani format starting with 03, replace with 923 // or if Indian 10 digits add 91
    if (p.startsWith('03')) {
      p = '92' + p.substring(1);
    } else if (p.length === 10) {
      p = '91' + p; // Assume Indian for default 10-digit
    }
    return `https://wa.me/${p}?text=${encodedText}`;
  }
  
  // Generic fallback if no phone
  return `https://wa.me/?text=${encodedText}`;
};
