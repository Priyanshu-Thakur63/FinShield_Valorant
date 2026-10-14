/**
 * Entity & Indicator Extraction Service for FinShield AI (Step 1 Pipeline)
 *
 * Robust Named Entity Recognition (NER) and Regex Extractors specifically
 * tuned for Indian financial threat chatter, scam advertisements, and noisy OCR text.
 *
 * Extracts and normalizes:
 * - Phone & WhatsApp Numbers (Indian +91, 10-digit mobile, disguised spaced digits, e.g. "9 8 7 6 5 4 3 2 1 0")
 * - UPI IDs & Payment Handles (GPay, PhonePe, Paytm, BHIM, Bank PSPs)
 * - Telegram & Social Handles (@usernames, t.me/ links)
 * - URLs, Domains, and Direct Contact Links (wa.me, bit.ly, etc.)
 * - Bank Names & Financial Instruments mentioned (HDFC, ICICI, SBI, Axis, etc.)
 * - Monetary figures & Commission lures (e.g. "₹50,000", "15k", "10% commission", "500 USDT")
 */

// Common Indian Bank Identifiers
const BANK_NAMES = [
  'sbi', 'state bank of india',
  'hdfc', 'hdfc bank',
  'icici', 'icici bank',
  'axis', 'axis bank',
  'kotak', 'kotak mahindra',
  'pnb', 'punjab national bank',
  'bob', 'bank of baroda',
  'canara bank',
  'yes bank',
  'indusind',
  'idfc', 'idfc first bank',
  'airtel payments bank',
  'paytm payments bank',
  'fino payments bank',
  'union bank',
];

// Popular UPI PSP Handles
const POPULAR_UPI_HANDLES = [
  'okaxis', 'okhdfcbank', 'okicici', 'oksbi',
  'ybl', 'ibl', 'axl',
  'paytm', 'ptaxis', 'pthdfc',
  'apl', 'rapl',
  'upi', 'postbank', 'fbl', 'aubank',
];

/**
 * Normalizes phone numbers to standard E.164-like format (e.g., "+919876543210")
 */
export function normalizePhone(raw) {
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  if (!cleaned.startsWith('+') && cleaned.length === 10) {
    cleaned = '+91' + cleaned;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

/**
 * Clean noisy OCR characters (e.g., '|' mistaken for '1', 'O' mistaken for '0' in numeric fields)
 */
export function sanitizeOcrNoise(text) {
  if (!text) return '';
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width spaces
    .replace(/[—–]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    // Fix OCR reading ₹ as '7', '?', 't', or '|' immediately before numbers (e.g., "710,000" or "·10,000" -> "₹10,000")
    .replace(/(?:^|\s)(?:7|·|\|)(?=\d{2,3}(?:,\d{3})+|\d{4,})/g, ' ₹');
}


/**
 * Main Extraction Function
 * @param {string} rawText - Input ad text or OCR parsed text
 * @param {string} [sourceUrl] - Optional source URL
 */
export function extractEntitiesAndIndicators(rawText = '', sourceUrl = '') {
  const text = sanitizeOcrNoise(rawText);
  const combined = `${text}\n${sourceUrl || ''}`;

  // 1. Phone & WhatsApp Numbers
  // Matches:
  // - +91 98765 43210, +91-9876543210, 9876543210
  // - Spaced digits like "9 8 7 6 5 4 3 2 1 0" or "WA: 98765-43210"
  const rawPhones = [];
  
  // Standard phone formats
  const standardPhoneRegex = /(?:(?:\+|00)91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b/g;
  let match;
  while ((match = standardPhoneRegex.exec(text)) !== null) {
    rawPhones.push(match[0].trim());
  }

  // Disguised spaced digits: e.g. "9 8 7 6 5 4 3 2 1 0"
  const spacedPhoneRegex = /(?:(?:\+|00)\s*9\s*1\s*)?[6-9](?:\s*\d){9}\b/g;
  while ((match = spacedPhoneRegex.exec(text)) !== null) {
    const compact = match[0].replace(/\s+/g, '');
    if (compact.length >= 10 && compact.length <= 13) {
      rawPhones.push(match[0].trim());
    }
  }

  // WhatsApp / Call label prefixes
  const waLabeledRegex = /(?:wa\.me\/|whatsapp:?\s*|call:?\s*|contact:?\s*)([+0-9\s-]{10,15})/gi;
  while ((match = waLabeledRegex.exec(text)) !== null) {
    rawPhones.push(match[1].trim());
  }

  const normalizedPhones = [...new Set(
    rawPhones
      .map((p) => normalizePhone(p))
      .filter((p) => p.replace(/\D/g, '').length >= 10)
  )];

  // 2. UPI IDs (e.g. quickcash@okaxis, 9876543210@paytm, merchant.corp@upi)
  const upiRegex = /\b[a-zA-Z0-9._-]+@([a-zA-Z0-9_-]+)\b/g;
  const upiIds = [];
  while ((match = upiRegex.exec(text)) !== null) {
    const handle = match[1].toLowerCase();
    // Exclude common email provider false positives
    const commonEmailDomains = ['gmail', 'yahoo', 'outlook', 'hotmail', 'protonmail', 'icloud', 'example'];
    if (!commonEmailDomains.includes(handle) && (POPULAR_UPI_HANDLES.includes(handle) || handle.length <= 12)) {
      upiIds.push(match[0].toLowerCase());
    }
  }

  // 3. Telegram & Social Media Handles
  const telegramHandles = [];
  const tgHandleRegex = /(?:@|(?:https?:\/\/)?t\.me\/)([a-zA-Z0-9_]{5,32})\b/gi;
  while ((match = tgHandleRegex.exec(combined)) !== null) {
    const user = match[1].toLowerCase();
    if (!['joinchat', 'addstickers', 'share'].includes(user)) {
      telegramHandles.push(`@${user}`);
    }
  }

  // 4. URLs, Domains & Contact Links
  const urls = [];
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+/gi;
  while ((match = urlRegex.exec(combined)) !== null) {
    urls.push(match[0]);
  }
  // Also capture wa.me links
  const waLinkRegex = /wa\.me\/[0-9]+/gi;
  while ((match = waLinkRegex.exec(combined)) !== null) {
    urls.push(`https://${match[0]}`);
  }
  if (sourceUrl && sourceUrl.trim()) {
    urls.push(sourceUrl.trim());
  }

  // 5. Mentioned Bank Names
  const lowerText = text.toLowerCase();
  const detectedBanks = BANK_NAMES.filter((bank) => {
    const escaped = bank.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lowerText);
  }).map((b) => b.toUpperCase());

  // 6. Monetary Amounts & Commission Figures
  const amounts = [];
  const amountRegex = /(?:(?:₹|rs\.?|inr|usd|usdt)\s*[\d,]+(?:\.\d+)?k?|\b[\d,]+k?\s*(?:₹|rs\.?|inr|usd|usdt)|\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b)/gi;
  while ((match = amountRegex.exec(text)) !== null) {
    amounts.push(match[0].trim());
  }
  // Commission percentages e.g. "5% commission", "10% per transaction"
  const commissionRegex = /\b\d{1,2}%\s*(?:commission|cut|payout|margin|share)\b/gi;
  while ((match = commissionRegex.exec(text)) !== null) {
    amounts.push(match[0].trim());
  }

  // Return clean, deduplicated structured entities
  return {
    phones: normalizedPhones,
    rawPhones: [...new Set(rawPhones)],
    upiIds: [...new Set(upiIds)],
    telegramHandles: [...new Set(telegramHandles)],
    urls: [...new Set(urls)],
    detectedBanks: [...new Set(detectedBanks)],
    amounts: [...new Set(amounts)],
    hasActionableContacts: normalizedPhones.length > 0 || upiIds.length > 0 || telegramHandles.length > 0,
    totalEntitiesFound: normalizedPhones.length + upiIds.length + telegramHandles.length + urls.length,
  };
}
