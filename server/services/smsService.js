import axios from 'axios';
import SmsLog from '../models/SmsLog.js';
import SystemSetting from '../models/SystemSetting.js';

const monthNames = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
const fundLabels = { masjid: 'मस्जिद', dargah: 'दरगाह', festival: 'त्योहार', jumma_jholi: 'जुम्मा झोली', tamiri_kaam: 'तामीरी काम', both: 'दोनों' };

/**
 * Normalize Indian phone number to 10-digit format.
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');
  if (p.length === 10 && /^[6-9]/.test(p)) return p;
  if (p.length === 11 && p.startsWith('0')) return p.substring(1);
  if (p.length === 12 && p.startsWith('91')) return p.substring(2);
  if (p.length === 13 && p.startsWith('091')) return p.substring(3);
  return null;
}

/**
 * Build a short SMS message for a donation receipt.
 */
export function buildSmsMessage(donation) {
  const donorName = donation.donor?.name || 'दानदाता';
  const receipt = donation.receiptNo || 'N/A';
  const amount = donation.amount || 0;
  const fund = fundLabels[donation.fundType] || donation.fundType;
  const month = monthNames[(donation.month || 1) - 1];
  const year = donation.year || new Date().getFullYear();

  return `अस्सलामु अलैकुम ${donorName} | रसीद: ${receipt} | राशि: ₹${amount} - ${fund} | माह: ${month} ${year} | जज़ाकल्लाह - हज़रत सुल्तान शाह पीर मस्जिद व दरगाह`;
}

/**
 * Build a batch SMS message for advance donations.
 */
export function buildAdvanceSmsMessage({ donorName, totalMonths, startMonth, endMonth, totalAmount, firstReceiptNo }) {
  return `अस्सलामु अलैकुम ${donorName} | अग्रिम चंदा: ${totalMonths} महीने (${startMonth} से ${endMonth})। कुल: ₹${totalAmount}। पहली रसीद: ${firstReceiptNo}। जज़ाकल्लाह - हज़रत सुल्तान शाह पीर मस्जिद व दरगाह`;
}

/**
 * Send SMS via custom SMS gateway.
 */
export async function sendSMS({ phone, message, donationId, donorId, type = 'donation_receipt' }) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    const log = await SmsLog.create({
      phone: phone || 'N/A', message, donationId, donorId, type,
      status: 'failed', errorMessage: 'Invalid phone number'
    });
    return { success: false, error: 'Invalid phone number', logId: log._id };
  }

  // Check system setting
  const setting = await SystemSetting.findOne({ key: 'smsSettings' });
  if (!setting?.value?.enabled) {
    const log = await SmsLog.create({
      phone: normalized, message, donationId, donorId, type,
      status: 'failed', errorMessage: 'SMS disabled in settings'
    });
    return { success: false, error: 'SMS disabled in settings', logId: log._id };
  }

  if (!process.env.SMS_GATEWAY_URL) {
    const log = await SmsLog.create({
      phone: normalized, message, donationId, donorId, type,
      status: 'failed', errorMessage: 'SMS_GATEWAY_URL not configured'
    });
    return { success: false, error: 'SMS_GATEWAY_URL not configured', logId: log._id };
  }

  try {
    const response = await axios.post(
      process.env.SMS_GATEWAY_URL,
      {
        message: message,
        phone: ['+91' + normalized]
      }
    );

    const log = await SmsLog.create({
      phone: normalized, message, donationId, donorId, type,
      status: 'sent',
      gatewayResponse: response.data
    });

    return { success: true, data: response.data, logId: log._id };
  } catch (error) {
    const log = await SmsLog.create({
      phone: normalized, message, donationId, donorId, type,
      status: 'failed',
      errorMessage: error.response?.data?.message || error.message,
      gatewayResponse: error.response?.data
    });

    return { success: false, error: error.message, logId: log._id };
  }
}

/**
 * Send donation receipt SMS for a populated donation document.
 */
export async function sendDonationReceiptSMS(donation) {
  const msg = buildSmsMessage(donation);
  return sendSMS({
    phone: donation.donor?.phone,
    message: msg,
    donationId: donation._id,
    donorId: donation.donor?._id,
    type: 'donation_receipt'
  });
}
