/*import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default pdfjsLib;
*/

import type * as PDFJS from 'pdfjs-dist';

let pdfjsLib: typeof PDFJS | null = null;

export async function getPdfjs() {
  if (typeof window === 'undefined') return null; // SSR guard

  if (!pdfjsLib) {
    const mod = await import('pdfjs-dist');
    mod.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    pdfjsLib = mod;
  }
  return pdfjsLib;
}
