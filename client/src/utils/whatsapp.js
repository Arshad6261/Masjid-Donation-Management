/**
 * Feature 5: WhatsApp Integration utility
 * Updated for Indian phone number normalization
 */

export const normalizeIndianPhone = (phone) => {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');
  if (p.length === 10 && /^[6-9]/.test(p)) return p;
  if (p.length === 11 && p.startsWith('0')) return p.substring(1);
  if (p.length === 12 && p.startsWith('91')) return p.substring(2);
  if (p.length === 13 && p.startsWith('091')) return p.substring(3);
  return null;
};

export const formatPhoneDisplay = (phone) => {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return phone || '';
  return `+91 ${normalized.substring(0, 5)} ${normalized.substring(5)}`;
};

export const getWhatsAppLink = (donor, donation) => {
  const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', festival: 'त्यौहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम' };
  
  const text = `हज़रत सुल्तान शाह पीर की तरफ से रसीद\n` +
               `रसीद नं: ${donation?.receiptNo || 'N/A'}\n` +
               `राशि: ₹${donation?.amount || 0}\n` +
               `फंड: ${fundLabels[donation?.fundType] || donation?.fundType}\n` +
               `तारीख: ${new Date(donation?.paymentDate || Date.now()).toLocaleDateString('hi-IN')}`;

  const encodedText = encodeURIComponent(text);

  if (donor?.phone) {
    const normalized = normalizeIndianPhone(donor.phone);
    if (normalized) {
      return `https://wa.me/91${normalized}?text=${encodedText}`;
    }
  }
  
  // Generic fallback if no phone
  return `https://wa.me/?text=${encodedText}`;
};
