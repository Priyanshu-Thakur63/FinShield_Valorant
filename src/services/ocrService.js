/**
 * OCR.space Client Service for FinShield AI
 * Extracts text from uploaded image files or image URLs using OCR.space Free/Pro API.
 */

const OCR_API_KEY = import.meta.env.VITE_OCR_SPACE_API_KEY || 'K86043165388957';
const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';

export async function extractTextFromImage(file) {
  if (!file) {
    throw new Error('No image file provided for OCR.');
  }

  const formData = new FormData();
  formData.append('apikey', OCR_API_KEY);
  formData.append('file', file);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2'); // Engine 2 is optimized for numbers, special chars, phone/UPI formats

  const response = await fetch(OCR_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OCR service failed with status ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    const errorMsg = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(', ') : data.ErrorMessage;
    throw new Error(errorMsg || 'Failed to extract text from image.');
  }

  const parsedResults = data.ParsedResults || [];
  const extractedText = parsedResults
    .map((res) => res.ParsedText || '')
    .join('\n')
    .trim();

  return {
    rawText: extractedText,
    exitCode: data.OCRExitCode,
  };
}
