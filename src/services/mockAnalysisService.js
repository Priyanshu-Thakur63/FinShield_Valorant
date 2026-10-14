const suspiciousPhrases = [
  'sell your account',
  'bank accounts available',
  'no paperwork',
  'instant transfer',
  'pre-activated',
  'atm cards available',
  'credit cards available',
  'debit cards available',
  'full access',
  'earn up to',
  'encrypted payment',
];

const phraseWeights = new Map([
  ['sell your account', 32],
  ['bank accounts available', 30],
  ['no paperwork', 22],
  ['instant transfer', 16],
  ['pre-activated', 26],
  ['atm cards available', 25],
  ['credit cards available', 25],
  ['debit cards available', 25],
  ['full access', 14],
  ['earn up to', 14],
  ['encrypted payment', 16],
]);

export async function analyzeAdvertisement({ text, platform, sourceUrl }) {
  await new Promise((resolve) => window.setTimeout(resolve, 900));
  const normalized = text.toLowerCase();
  const phrases = suspiciousPhrases.filter((phrase) => normalized.includes(phrase));
  const score = Math.min(97, phrases.reduce((total, phrase) => total + phraseWeights.get(phrase), 8));
  const phones = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [];
  const urls = [sourceUrl, ...(text.match(/(?:https?:\/\/|www\.)[^\s]+/gi) || [])]
    .map((value) => value.trim())
    .filter(Boolean);
  const upiIds = text.match(/\b[a-z0-9._-]+@[a-z][a-z0-9-]*\b/gi) || [];
  const risk = score >= 65 ? 'High' : score >= 32 ? 'Medium' : 'Low';
  return {
    score,
    risk,
    platform,
    phrases,
    phones: [...new Set(phones)],
    urls: [...new Set(urls)],
    upiIds: [...new Set(upiIds)],
    explanation: phrases.length
      ? `The sample matched ${phrases.length} account-sale or evasion phrase${phrases.length === 1 ? '' : 's'}. Review the context and extracted contact details before taking action.`
      : 'No high-risk phrase in this small demonstration ruleset matched. This does not establish that the advertisement is safe.',
    simulated: true,
  };
}
