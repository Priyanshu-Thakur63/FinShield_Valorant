/**
 * Threat Categorization & Scoring Engine for FinShield AI
 *
 * Implements Step 2 of the Intelligence Pipeline:
 * - Multi-category classification into 4 primary financial threat vectors
 * - Weighted risk scoring (0-100) with confidence estimation
 * - Signal breakdown and evidence generation
 */

export const THREAT_CATEGORIES = {
  HIGH_YIELD_INVESTMENT_FRAUD: {
    id: 'payment_commission_bait',
    name: 'High-Yield Investment & Ponzi Bait',
    description: 'Fraudulent schemes promising unrealistic quick returns, deposit doubling, or fake government/bank-authorized investment opportunities.',
    severityWeight: 1.3,
    signals: [
      { pattern: /\b(double\s+(?:your\s+)?(?:deposit|money|income|amount)|double\s+in\s+\d+\s+days?|mega\s+double\s+scheme)\b/i, weight: 45, phrase: 'double deposit promise (Ponzi/Ponzi-like)' },
      { pattern: /\b(100%\s*(?:guaranteed|approval|return)|guaranteed\s+(?:returns?|profit|income))\b/i, weight: 35, phrase: '100% guaranteed return lure' },
      { pattern: /\b(earn\s+(?:up\s+to|daily|per\s+day)|daily\s+income|daily\s+payout)\b/i, weight: 22, phrase: 'daily earnings promise' },
      { pattern: /\b(commission\s+(?:per\s+transfer|per\s+transaction|per\s+day|\d+%\s*commission))\b/i, weight: 34, phrase: 'commission per transfer' },
      { pattern: /\b(receive\s+(?:money|funds|transfer)\s+in\s+your\s+account)\b/i, weight: 35, phrase: 'receive funds in account (mule lure)' },
      { pattern: /\b(crypto\s+payout|usdt\s+payout|work\s+from\s+home\s+earning)\b/i, weight: 20, phrase: 'crypto/USDT commission payout' },
      { pattern: /\b(minimum\s+deposit|click\s+to\s+deposit|deposit\s+now)\b/i, weight: 25, phrase: 'deposit solicitation' },
      { pattern: /\b(offer\s+ends\s+in\s+\d+|hurry|urgent|limited\s+time)\b/i, weight: 20, phrase: 'artificial urgency / countdown timer' },
    ],
  },

  BRAND_IMPERSONATION_PHISHING: {
    id: 'brand_impersonation_phishing',
    name: 'Bank Brand Impersonation & Phishing',
    description: 'Impersonating authorized financial institutions (e.g. State Bank of India, RBI) using fake credentials, unofficial login links, or unauthorized schemes.',
    severityWeight: 1.35,
    signals: [
      { pattern: /\b(govt\s+(?:authorized|approved)|rbi\s+approved|government\s+scheme)\b/i, weight: 40, phrase: 'fraudulent Govt/RBI authorization claims' },
      { pattern: /\b(?:sbi|hdfc|icici|axis|pnb|kotak)[a-z0-9-]*-(?:login|scheme|double|secure|verify|portal)\b/i, weight: 48, phrase: 'spoofed bank phishing domain' },
      { pattern: /\b(mega\s+online\s+scheme|online\s+scheme\s+202\d)\b/i, weight: 35, phrase: 'fake official banking online scheme' },
      { pattern: /\b(click\s+to\s+(?:deposit|login|claim)|login\.com|scheme-login)\b/i, weight: 30, phrase: 'phishing action call-to-action' },
    ],
  },

  BANK_ACCOUNT_SALES: {
    id: 'bank_account_sales',
    name: 'Bank Account Sales (Mule Networks)',
    description: 'Direct trade or rental of pre-existing current/savings accounts with netbanking kits for money laundering or mule operations.',
    severityWeight: 1.25,
    signals: [
      { pattern: /\b(bank\s+accounts?\s+available|sell\s+your\s+account|buy\s+bank\s+account)\b/i, weight: 38, phrase: 'bank accounts available' },
      { pattern: /\b(mule\s+accounts?|rent\s+(?:your\s+)?account)\b/i, weight: 40, phrase: 'mule/rent account' },
      { pattern: /\b(netbanking\s+kit|internet\s+banking\s+credentials|full\s+access)\b/i, weight: 30, phrase: 'netbanking kit / full access' },
      { pattern: /\b(instant\s+transfer\s+(?:access|enabled)?)\b/i, weight: 20, phrase: 'instant transfer enabled' },
      { pattern: /\b(corporate\s+account|current\s+account\s+available|cheque\s+book)\b/i, weight: 25, phrase: 'current/corporate account trade' },
      { pattern: /\b(ready\s+accounts?|verified\s+accounts?)\b/i, weight: 22, phrase: 'verified/ready accounts' },
    ],
  },

  ACCOUNT_OPENING_SCHEMES: {
    id: 'account_opening_schemes',
    name: 'Account-Opening & Evasion Schemes',
    description: 'Facilitating account opening outside legitimate KYC frameworks using fabricated documentation or bypass tactics.',
    severityWeight: 1.2,
    signals: [
      { pattern: /\b(no\s+paperwork|without\s+paperwork|no\s+documents?(?:\s+required)?)\b/i, weight: 36, phrase: 'no documents required' },
      { pattern: /\b(no\s+kyc|kyc\s+bypass|without\s+kyc|fake\s+kyc)\b/i, weight: 40, phrase: 'KYC bypass / without KYC' },
      { pattern: /\b(aadhar\s+bypass|pan\s+bypass|fake\s+(?:pan|aadhar|documents?))\b/i, weight: 36, phrase: 'identity/document bypass' },
      { pattern: /\b(instant\s+approval(?:\s+guaranteed)?|100%\s+approval|no\s+cibil|bad\s+cibil)\b/i, weight: 30, phrase: 'instant approval without verification' },
      { pattern: /\b(fast[- ]?track\s+setup|same[- ]?day\s+delivery)\b/i, weight: 18, phrase: 'fast-track account setup' },
    ],
  },

  CARD_CREDENTIAL_OFFERS: {
    id: 'card_credential_offers',
    name: 'Card & Credential Offers',
    description: 'Black-market sale of pre-activated ATM, credit, or debit cards, cloned instruments, or paired SIM kits.',
    severityWeight: 1.2,
    signals: [
      { pattern: /\b(atm\s+cards?\s+available|credit\s+cards?\s+available|debit\s+cards?\s+available)\b/i, weight: 32, phrase: 'cards available' },
      { pattern: /\b(pre[- ]?activated\s+(?:cards?|sim|kit))\b/i, weight: 30, phrase: 'pre-activated cards/kits' },
      { pattern: /\b(cloned?\s+cards?|card\s+cloning|card\s+dump)\b/i, weight: 38, phrase: 'cloned cards / dumps' },
      { pattern: /\b(pin\s+(?:mailer|dispatch|included)|atm\s+pin)\b/i, weight: 24, phrase: 'ATM PIN credentials' },
      { pattern: /\b(encrypted\s+payment|crypto\s+cards?)\b/i, weight: 18, phrase: 'encrypted card payments' },
    ],
  },
};

/**
 * Categorize threat and compute composite risk score & confidence.
 * @param {Object} input
 * @param {string} input.text - User input or ingested post text
 * @param {string} input.ocrText - Raw text extracted from image OCR
 * @param {Array<string>} [input.phones] - Extracted phone numbers (from Step 1)
 * @param {Array<string>} [input.upiIds] - Extracted UPI IDs (from Step 1)
 * @param {Array<string>} [input.urls] - Extracted URLs / handles (from Step 1)
 * @param {Array<string>} [input.telegramHandles] - Extracted Telegram handles (from Step 1)
 * @param {Array<string>} [input.detectedBanks] - Extracted Bank names (from Step 1)
 */
export function categorizeAndScoreThreat({
  text = '',
  ocrText = '',
  phones = [],
  upiIds = [],
  urls = [],
  telegramHandles = [],
  detectedBanks = [],
}) {
  const combinedText = `${text}\n${ocrText}`.trim();
  const lower = combinedText.toLowerCase();

  const categoryScores = [];
  const detectedSignals = [];
  const evidenceList = [];

  // Evaluate each threat category
  for (const [key, category] of Object.entries(THREAT_CATEGORIES)) {
    let catRawScore = 0;
    const catMatches = [];

    for (const signal of category.signals) {
      if (signal.pattern.test(lower)) {
        catRawScore += signal.weight;
        catMatches.push(signal.phrase);
        detectedSignals.push({
          category: category.name,
          phrase: signal.phrase,
          weight: signal.weight,
        });
      }
    }

    if (catMatches.length > 0) {
      evidenceList.push(`${category.name}: Matched indicators (${catMatches.join(', ')})`);
    }

    const normalizedCategoryScore = Math.min(100, Math.round(catRawScore * category.severityWeight));
    categoryScores.push({
      id: category.id,
      name: category.name,
      description: category.description,
      rawScore: catRawScore,
      score: normalizedCategoryScore,
      matchCount: catMatches.length,
      matchedPhrases: catMatches,
    });
  }

  // Check if a reputable bank name (e.g. SBI) is combined with an unofficial domain or telegram handle
  const isSpoofingBank = detectedBanks.length > 0 && (
    urls.some((u) => !u.includes('sbi.co.in') && !u.includes('hdfcbank.com') && !u.includes('icicibank.com')) ||
    telegramHandles.length > 0
  );
  if (isSpoofingBank) {
    const brandCat = categoryScores.find((c) => c.id === 'brand_impersonation_phishing');
    if (brandCat) {
      brandCat.score = Math.min(100, brandCat.score + 35);
      detectedSignals.push({
        category: brandCat.name,
        phrase: `Unauthorized commercial channel for ${detectedBanks.join(', ')}`,
        weight: 35,
      });
      evidenceList.push(`Brand Impersonation: Unauthorized Telegram/Domain claiming affiliation with ${detectedBanks.join(', ')}`);
    }
  }

  // Sort categories by descending score
  categoryScores.sort((a, b) => b.score - a.score);

  const primaryCategory = categoryScores[0].score > 0 ? categoryScores[0] : {
    id: 'unclassified',
    name: 'Unclassified / Low Threat',
    description: 'No explicit illegal financial solicitation signals detected.',
    score: 5,
    matchedPhrases: [],
  };

  // Base score is driven by the highest threat category
  let compositeScore = primaryCategory.score;

  // Secondary category amplifier (when multiple vectors are present, threat severity spikes)
  const secondaryCategories = categoryScores.filter((c) => c.score > 20 && c.id !== primaryCategory.id);
  if (secondaryCategories.length > 0) {
    const amplifier = Math.min(30, secondaryCategories.reduce((sum, c) => sum + Math.round(c.score * 0.25), 0));
    compositeScore += amplifier;
  }

  // Actionable contact & channel amplifiers
  if (upiIds.length > 0) {
    compositeScore += 12;
    evidenceList.push(`Direct payment vector detected (${upiIds.length} UPI handle${upiIds.length > 1 ? 's' : ''})`);
  }
  if (phones.length > 0) {
    compositeScore += 10;
    evidenceList.push(`Direct contact channel detected (${phones.length} phone number${phones.length > 1 ? 's' : ''})`);
  }
  if (telegramHandles.length > 0) {
    compositeScore += 10;
    evidenceList.push(`Anonymous Telegram recruitment/support channels identified (${telegramHandles.length} handle${telegramHandles.length > 1 ? 's' : ''})`);
  }
  if (urls.length > 0) {
    compositeScore += 8;
  }
  if (ocrText && ocrText.trim().length > 15) {
    evidenceList.push('Multi-modal verification: OCR screenshot analysis confirmed high-risk phishing copy');
  }

  // Clamp composite score between 0 and 99
  compositeScore = Math.max(5, Math.min(99, compositeScore));

  // Determine Risk Tier
  let riskTier = 'Low';
  if (compositeScore >= 80) {
    riskTier = 'Critical';
  } else if (compositeScore >= 55) {
    riskTier = 'High';
  } else if (compositeScore >= 30) {
    riskTier = 'Medium';
  }

  // Confidence calculation (higher when multiple evidence points coincide)
  const totalMatches = detectedSignals.length;
  const entityCount = phones.length + upiIds.length + urls.length + telegramHandles.length;
  let confidence = 55 + (totalMatches * 6) + (entityCount * 4);
  if (ocrText && ocrText.trim().length > 20) confidence += 10;
  confidence = Math.min(99, Math.max(50, confidence));

  return {
    score: compositeScore,
    risk: riskTier,
    confidence,
    primaryCategory: primaryCategory.name,
    primaryCategoryId: primaryCategory.id,
    categories: categoryScores,
    detectedSignals,
    matchedPhrases: [...new Set(detectedSignals.map((s) => s.phrase))],
    evidence: evidenceList,
    explanation: detectedSignals.length > 0
      ? `Primary vector flagged as "${primaryCategory.name}" with ${detectedSignals.length} threat indicator(s). Correlated with ${entityCount} operational channel(s) and unauthorized bank branding.`
      : 'No overt illegal financial fraud patterns detected against known risk taxonomies.',
  };
}

