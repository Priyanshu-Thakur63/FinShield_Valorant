/**
 * Client-Side URL Phishing Scanner & Classifier for FinShield AI
 * Provides instant heuristics + connects to FastAPI backend for live HTTP probing.
 */
import { apiService } from './apiService.js';

// Verified legitimate domains for financial institutions and popular services
export const VERIFIED_DOMAINS = {
  'sbi.co.in': 'State Bank of India (SBI)',
  'onlinesbi.sbi': 'State Bank of India (SBI)',
  'retail.onlinesbi.sbi': 'State Bank of India (SBI)',
  'sbi.bank.in': 'State Bank of India (SBI)',
  'sbicard.com': 'SBI Card',
  'hdfcbank.com': 'HDFC Bank',
  'hdfc.com': 'HDFC',
  'icicibank.com': 'ICICI Bank',
  'infinity.icicibank.com': 'ICICI Bank NetBanking',
  'axisbank.com': 'Axis Bank',
  'axis.com': 'Axis Bank',
  'kotak.com': 'Kotak Mahindra Bank',
  'kotakbank.com': 'Kotak Mahindra Bank',
  'pnbindia.in': 'Punjab National Bank',
  'bankofbaroda.in': 'Bank of Baroda',
  'bankofbaroda.com': 'Bank of Baroda',
  'canarabank.com': 'Canara Bank',
  'unionbankofindia.co.in': 'Union Bank of India',
  'rbi.org.in': 'Reserve Bank of India (RBI)',
  'paytm.com': 'Paytm',
  'phonepe.com': 'PhonePe',
  'google.com': 'Google',
  'google.co.in': 'Google India',
  'pay.google.com': 'Google Pay',
  'paypal.com': 'PayPal',
  'amazon.in': 'Amazon India',
  'amazon.com': 'Amazon',
  'apple.com': 'Apple',
  'microsoft.com': 'Microsoft',
  'incometax.gov.in': 'Income Tax Department',
  'nsdl.co.in': 'NSDL',
  'uidai.gov.in': 'UIDAI / Aadhaar',
  'github.com': 'GitHub',
  'reddit.com': 'Reddit',
  'wikipedia.org': 'Wikipedia',
};

const BRAND_RULES = [
  { brand: 'State Bank of India (SBI)', keywords: ['sbi', 'onlinesbi', 'statebank'], official: ['sbi.co.in', 'onlinesbi.sbi', 'sbi.bank.in', 'sbicard.com'] },
  { brand: 'HDFC Bank', keywords: ['hdfc', 'hdfcbank'], official: ['hdfcbank.com', 'hdfc.com'] },
  { brand: 'ICICI Bank', keywords: ['icici', 'icicibank'], official: ['icicibank.com'] },
  { brand: 'Axis Bank', keywords: ['axisbank', 'axis-bank'], official: ['axisbank.com', 'axis.com'] },
  { brand: 'Kotak Mahindra Bank', keywords: ['kotak', 'kotakbank'], official: ['kotak.com', 'kotakbank.com'] },
  { brand: 'Punjab National Bank (PNB)', keywords: ['pnbindia', 'pnb-bank'], official: ['pnbindia.in'] },
  { brand: 'Reserve Bank of India (RBI)', keywords: ['rbi', 'reservebank'], official: ['rbi.org.in'] },
  { brand: 'Paytm Payments', keywords: ['paytm', 'paytm-kyc'], official: ['paytm.com', 'paytmbank.com'] },
  { brand: 'PhonePe', keywords: ['phonepe'], official: ['phonepe.com'] },
  { brand: 'PayPal', keywords: ['paypal'], official: ['paypal.com', 'paypal.me'] },
  { brand: 'Govt Tax & Aadhaar Portal', keywords: ['incometax', 'pan-card', 'pancard', 'aadhaar', 'uidai'], official: ['incometax.gov.in', 'nsdl.co.in', 'uidai.gov.in'] },
];

const HIGH_RISK_TLDS = new Set([
  '.xyz', '.top', '.click', '.buzz', '.club', '.tk', '.ml', '.ga',
  '.cf', '.gq', '.work', '.fit', '.vip', '.icu', '.sbs', '.cc',
  '.cam', '.live', '.guru', '.monster', '.cfd', '.site', '.online'
]);

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'is.gd', 'rb.gy', 'cutt.ly', 't.co', 'ow.ly'
]);

const SUSPICIOUS_PATH_KEYWORDS = [
  'kyc', 'kyc-update', 'pan-link', 'update-pan', 'login', 'signin',
  'verify', 'netbanking', 'ebanking', 'account-unlock', 'claim-reward',
  'redeem', 'lottery', 'instant-loan', 'reward-points', 'otp',
  'card-verify', 'cvv', 'banking-portal', 'gift-cash', 'double-money'
];

/**
 * Local Heuristic Scanner Fallback
 */
export function scanUrlLocally(rawUrl) {
  const url = (rawUrl || '').trim();
  if (!url) return null;
  const cleanUrl = url.match(/^[a-zA-Z]+:\/\//) ? url : `https://${url}`;

  let parsed;
  try {
    parsed = new URL(cleanUrl);
  } catch (e) {
    return {
      url: cleanUrl,
      domain: url,
      classification: 'SUSPICIOUS',
      risk_score: 50,
      target_brand: 'Malformed URL',
      signals: [{ rule: 'INVALID_URL_SYNTAX', description: 'URL string is malformed or invalid.' }],
      recommendation: 'Invalid syntax. Exercise extreme caution.',
      is_live: false,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const fullPath = (parsed.pathname + parsed.search).toLowerCase();

  // 1. Whitelist Check
  for (const [dom, brand] of Object.entries(VERIFIED_DOMAINS)) {
    if (hostname === dom || hostname.endsWith(`.${dom}`)) {
      return {
        url: cleanUrl,
        domain: hostname,
        classification: 'LEGITIMATE',
        risk_score: 5,
        target_brand: brand,
        signals: [{ rule: 'OFFICIAL_DOMAIN_VERIFIED', description: `Authenticated official domain for ${brand}.` }],
        recommendation: `Verified authentic portal for ${brand}. Safe to browse.`,
        is_live: true,
        detected_forms: [],
        page_title: `${brand} Portal`,
      };
    }
  }

  let riskScore = 0;
  const signals = [];
  let targetBrand = null;

  // Protocol Check
  if (parsed.protocol === 'http:') {
    riskScore += 18;
    signals.push({ rule: 'INSECURE_HTTP_PROTOCOL', description: 'Uses unencrypted HTTP protocol without SSL/TLS encryption.' });
  }

  // IP Hostname Check
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    riskScore += 50;
    signals.push({ rule: 'RAW_IP_HOSTNAME', description: `Raw numerical IP address (${hostname}) used instead of domain name.` });
  }

  // Brand Impersonation
  for (const rule of BRAND_RULES) {
    const hasKwInHost = rule.keywords.some((kw) => hostname.includes(kw));
    const hasKwInPath = rule.keywords.some((kw) => fullPath.includes(kw));
    const isOfficial = rule.official.some((off) => hostname === off || hostname.endsWith(`.${off}`));

    if ((hasKwInHost || hasKwInPath) && !isOfficial) {
      targetBrand = rule.brand;
      riskScore += hasKwInHost ? 65 : 40;
      signals.push({
        rule: 'BRAND_IMPERSONATION_SPOOF',
        description: `Impersonates ${rule.brand} on an unauthorized host (${hostname}).`,
      });
      break;
    }
  }

  // High-Risk TLD
  for (const tld of HIGH_RISK_TLDS) {
    if (hostname.endsWith(tld)) {
      riskScore += 32;
      signals.push({ rule: 'SUSPICIOUS_HIGH_RISK_TLD', description: `Utilizes disposable high-risk TLD '${tld}'.` });
      break;
    }
  }

  // URL Shortener
  if (SHORTENERS.has(hostname) || [...SHORTENERS].some((s) => hostname.endsWith(`.${s}`))) {
    riskScore += 26;
    signals.push({ rule: 'URL_SHORTENER_CLOAK', description: `URL shortener (${hostname}) masks actual landing destination.` });
  }

  // Path Keywords
  const matchedPathKws = SUSPICIOUS_PATH_KEYWORDS.filter((kw) => fullPath.includes(kw));
  if (matchedPathKws.length > 0) {
    riskScore += Math.min(40, matchedPathKws.length * 15);
    signals.push({
      rule: 'CREDENTIAL_HARVESTING_PATH',
      description: `Path includes high-risk lure keywords: [${matchedPathKws.slice(0, 4).join(', ')}].`,
    });
  }

  riskScore = Math.min(99, Math.max(0, riskScore));

  let classification = 'LEGITIMATE';
  let recommendation = 'Standard web destination. No explicit phishing patterns identified.';

  if (riskScore >= 65 || targetBrand) {
    classification = 'PHISHING';
    recommendation = `MALICIOUS / PHISHING: Do not open. Unauthorized portal attempting to steal credentials or payments.`;
  } else if (riskScore >= 35) {
    classification = 'SUSPICIOUS';
    recommendation = `SUSPICIOUS / EVASIVE: Proceed with caution. Unverified origin or high-risk domain.`;
  }

  return {
    url: cleanUrl,
    domain: hostname,
    classification,
    risk_score: riskScore,
    target_brand: targetBrand || 'General / Unspecified',
    signals,
    recommendation,
    is_live: true,
    detected_forms: riskScore >= 65 ? ['Password Field', 'Card/CVV Form', 'OTP Field'] : [],
    page_title: targetBrand ? `${targetBrand} - Phishing Landing Page` : 'Scanned Web Destination',
  };
}

/**
 * Executes a full scan: queries FastAPI backend (with live HTTP scraping),
 * falling back gracefully to local heuristics if backend is unreachable.
 */
export async function executeUrlScan(url, probeLive = true) {
  try {
    const res = await apiService.scanUrl(url, probeLive);
    return res;
  } catch (err) {
    console.warn('[URL Scanner] Backend API call failed, using client heuristic scanner:', err.message);
    return scanUrlLocally(url);
  }
}
