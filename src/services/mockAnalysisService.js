const suspiciousPhrases = [
  'sell your account',
  'bank accounts available',
  'mule account',
  'current account',
  'savings account',
  'no paperwork',
  'instant transfer',
  'pre-activated',
  'atm cards available',
  'credit cards available',
  'debit cards available',
  'full access',
  'earn up to',
  'encrypted payment',
  'netbanking kit',
  'cheque book',
  'upi pin',
  'commission per transfer',
  'crypto payout',
  'corporate account',
  'rent account',
];

const phraseWeights = new Map([
  ['sell your account', 35],
  ['bank accounts available', 32],
  ['mule account', 40],
  ['current account', 20],
  ['savings account', 15],
  ['no paperwork', 22],
  ['instant transfer', 16],
  ['pre-activated', 26],
  ['atm cards available', 25],
  ['credit cards available', 25],
  ['debit cards available', 25],
  ['full access', 18],
  ['earn up to', 14],
  ['encrypted payment', 16],
  ['netbanking kit', 28],
  ['cheque book', 20],
  ['upi pin', 24],
  ['commission per transfer', 30],
  ['crypto payout', 22],
  ['corporate account', 20],
  ['rent account', 32],
]);

export async function analyzeAdvertisement({ text, platform, sourceUrl, ocrText = '' }) {
  await new Promise((resolve) => window.setTimeout(resolve, 600));
  const combined = `${text}\n${ocrText}`.trim();
  const normalized = combined.toLowerCase();
  const phrases = suspiciousPhrases.filter((phrase) => normalized.includes(phrase));
  const score = Math.min(99, phrases.reduce((total, phrase) => total + (phraseWeights.get(phrase) || 15), 10));
  const phones = combined.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [];
  const urls = [sourceUrl, ...(combined.match(/(?:https?:\/\/|www\.)[^\s]+/gi) || [])]
    .map((value) => value.trim())
    .filter(Boolean);
  const upiIds = combined.match(/\b[a-z0-9._-]+@[a-z][a-z0-9-]*\b/gi) || [];
  const risk = score >= 70 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low';

  let explanation = '';
  if (phrases.length) {
    explanation = `Detected ${phrases.length} high-risk phrase(s) associated with mule bank account trading and illicit financial networks.`;
    if (ocrText) {
      explanation += ` Live OCR extracted text from the attached screenshot banner and contributed to the risk score.`;
    }
  } else {
    explanation = 'No overt high-risk financial fraud phrases detected in the current ruleset. Continue reviewing extracted indicators and context.';
  }

  return {
    score,
    risk,
    platform,
    phrases,
    ocrText,
    phones: [...new Set(phones.map((p) => p.trim()))],
    urls: [...new Set(urls)],
    upiIds: [...new Set(upiIds)],
    explanation,
    simulated: false,
  };
}

