//import { getPdfjs } from './pdfSetup';

/*export const extractPdfText = async (file: File) => {
  const pdfjsLib = await getPdfjs();
  if (!pdfjsLib) throw new Error('PDF.js can only run in the browser.');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    const pageText = text.items.map((item: any) => item.str || '').join(' ');
    textContent += pageText + '\n';
  }

  return textContent.trim();
};*/

import { getPdfjs } from './pdfSetup';

export const extractPdfText = async (file: File) => {
  const pdfjsLib = await getPdfjs();
  if (!pdfjsLib) throw new Error('PDF.js can only run in the browser.');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    const pageText = text.items.map((item: any) => item.str || '').join(' ');
    textContent += pageText + '\n';
  }

  return textContent.trim();
};
