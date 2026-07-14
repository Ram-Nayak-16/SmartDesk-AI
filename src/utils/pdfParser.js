import * as pdfjsLib from 'pdfjs-dist';

// Configure worker src with a reliable fallback
try {
  // Use Vite-friendly URL import for local bundling
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  console.warn('Failed to resolve local PDF worker, using CDN fallback', e);
  // Fallback to CDN matching the library version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.4.120'}/pdf.worker.min.js`;
}

/**
 * Parses a PDF file's ArrayBuffer and extracts its text contents.
 * Runs completely locally in the user's browser.
 * 
 * @param {ArrayBuffer} arrayBuffer - The PDF file binary content
 * @param {function} [onProgress] - Callback for extraction progress: (currentPage, totalPages)
 * @returns {Promise<string>} The extracted text content
 */
export async function extractTextFromPdf(arrayBuffer, onProgress) {
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
    disableFontFace: false
  });
  
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map(item => item.str)
      .join(' ');
    
    fullText += `[Page ${i}]\n${pageText}\n\n`;
    
    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return fullText.trim();
}
