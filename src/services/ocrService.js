/**
 * OCR.space Client Service for FinShield AI
 * Extracts text from uploaded image files using OCR.space Free/Pro API.
 * Includes client-side resizing to guarantee payload stays within the 1 MB free tier limit (preventing HTTP 413).
 */

const OCR_API_KEY = import.meta.env.VITE_OCR_SPACE_API_KEY || 'K86043165388957';
const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';

/**
 * Resizes image in memory using HTML5 Canvas to keep base64 payload under 1MB
 * while preserving high sharpness for OCR text reading.
 */
function compressAndResizeImage(file, maxDimension = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // White background for transparent PNGs so text doesn't blend into black
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG at 0.85 quality keeps byte size typically under 150-300KB (well below 1MB limit)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(dataUrl);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}


export async function extractTextFromImage(file) {
  if (!file) {
    throw new Error('No image file provided for OCR.');
  }

  // Client-side resize and compression to guarantee payload stays well under OCR.space's 1MB limit
  const base64Data = await compressAndResizeImage(file, 1280);

  const bodyParams = new URLSearchParams();
  bodyParams.append('apikey', OCR_API_KEY);
  bodyParams.append('base64Image', base64Data);
  bodyParams.append('language', 'eng');
  bodyParams.append('isOverlayRequired', 'false');
  bodyParams.append('detectOrientation', 'true');
  bodyParams.append('scale', 'true');
  bodyParams.append('OCREngine', '2'); // Try Engine 2 first

  let response = await fetch(OCR_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams,
  });

  if (!response.ok) {
    throw new Error(`OCR service failed with status ${response.status}: ${response.statusText}`);
  }

  let data = await response.json();

  if (data.IsErroredOnProcessing) {
    const errorMsg = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(', ') : data.ErrorMessage;
    throw new Error(errorMsg || 'Failed to extract text from image.');
  }

  let parsedResults = data.ParsedResults || [];
  let extractedText = parsedResults
    .map((res) => res.ParsedText || '')
    .join('\n')
    .trim();

  // If Engine 2 returned empty or very short text, try Engine 1 fallback
  if (!extractedText || extractedText.length < 5) {
    bodyParams.set('OCREngine', '1');
    const fallbackResp = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams,
    });
    if (fallbackResp.ok) {
      const fallbackData = await fallbackResp.json();
      const fallbackText = (fallbackData.ParsedResults || [])
        .map((res) => res.ParsedText || '')
        .join('\n')
        .trim();
      if (fallbackText) {
        return { rawText: fallbackText, exitCode: fallbackData.OCRExitCode };
      }
    }
  }

  return {
    rawText: extractedText,
    exitCode: data.OCRExitCode,
  };
}


