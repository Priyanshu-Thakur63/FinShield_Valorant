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

import { extractEntitiesAndIndicators } from './entityExtractionService.js';
import { categorizeAndScoreThreat } from './threatClassificationService.js';

export async function analyzeAdvertisement({ text = '', platform = 'Telegram', sourceUrl = '', ocrText = '', phones: customPhones, upiIds: customUpiIds, urls: customUrls }) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const combined = `${text}\n${ocrText}`.trim();


  // PIPELINE STEP 1: Entity & Indicator Extraction
  const extracted = extractEntitiesAndIndicators(combined, sourceUrl);
  const phones = customPhones || extracted.phones;
  const upiIds = customUpiIds || extracted.upiIds;
  const urls = customUrls || extracted.urls;
  const telegramHandles = extracted.telegramHandles;
  const detectedBanks = extracted.detectedBanks;
  const amounts = extracted.amounts;

  // PIPELINE STEP 2: Threat Categorization & Scoring Engine
  const classification = categorizeAndScoreThreat({
    text,
    ocrText,
    phones,
    upiIds,
    urls,
    telegramHandles,
    detectedBanks,
  });


  return {
    score: classification.score,
    risk: classification.risk,
    confidence: classification.confidence,
    primaryCategory: classification.primaryCategory,
    primaryCategoryId: classification.primaryCategoryId,
    categories: classification.categories,
    platform,
    phrases: classification.matchedPhrases,
    ocrText,
    phones,
    urls,
    upiIds,
    telegramHandles,
    detectedBanks,
    amounts,
    evidence: classification.evidence,
    explanation: classification.explanation,
    simulated: false,
  };
}



