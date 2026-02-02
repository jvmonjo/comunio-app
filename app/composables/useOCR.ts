import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
// We use the CDN version to avoid complex vite setup for the worker file in this environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const useOCR = () => {
    const isProcessing = useState('ocr-processing', () => false);
    const progress = useState('ocr-progress', () => 0);

    const parseLine = (text: string) => {
        // Regex to find all potential money values in the line
        // Look for patterns like 10,00 | 1.000,00 | 10.00 | -50,20
        const moneyRegex = /-?[\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})/g;

        let match;
        let lastMatch = null;

        // Find the last match in the line (usually the Total column)
        while ((match = moneyRegex.exec(text)) !== null) {
            lastMatch = match;
        }

        if (!lastMatch) return null;

        const amountRaw = lastMatch[0];
        let amount = 0;

        // Clean amount string
        const cleanAmount = amountRaw.replace(/\s/g, '');

        // Spanish format heuristic: 
        // If comma is present and represents decimal separator (usually matches ,xx at end)
        if (cleanAmount.includes(',') && !cleanAmount.includes('.')) {
            amount = parseFloat(cleanAmount.replace(',', '.'));
        } else if (cleanAmount.includes('.') && !cleanAmount.includes(',')) {
            amount = parseFloat(cleanAmount);
        } else {
            // Mixed: 1.000,00 or 1,000.00
            if (cleanAmount.indexOf(',') > cleanAmount.indexOf('.')) {
                // 1.000,00
                amount = parseFloat(cleanAmount.replace(/\./g, '').replace(',', '.'));
            } else {
                // 1,000.00
                amount = parseFloat(cleanAmount.replace(/,/g, ''));
            }
        }

        if (isNaN(amount) || amount === 0) return null;

        // Description is the text before the last match
        let description = text.substring(0, lastMatch.index).trim();

        // Cleanup description
        description = description
            .replace(/[.|,|-]$/, '') // remove trailing separators
            .replace(/\.{2,}/g, '') // remove sequences of dots (common in invoices like 'Energia.........')
            .trim();

        if (description.length < 3) return null;

        // Classification heuristics
        const lowerDesc = description.toLowerCase();
        const isFixed =
            lowerDesc.includes('potencia') ||
            lowerDesc.includes('fijo') ||
            lowerDesc.includes('fix') ||
            lowerDesc.includes('alquiler') ||
            lowerDesc.includes('loguer') || // lloguer
            lowerDesc.includes('servicio') ||
            lowerDesc.includes('cnt') || // contador
            lowerDesc.includes('comptador') ||
            lowerDesc.includes('mesurament') ||
            lowerDesc.includes('abonament');

        console.log(`[OCR Match] Desc: ${description} | Amount: ${amount} | Raw: ${amountRaw}`); // Debug

        return {
            description,
            amount,
            isFixed
        };
    };

    const processPdf = async (file: File, worker: Tesseract.Worker) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const items = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 3.0 }); // Higher scale for better text recognition
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // IMPORTANT: Set white background. PDF.js renders on transparent by default, 
            // which confuses Tesseract (sees black background).
            if (context) {
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, canvas.width, canvas.height);
            }

            await page.render({ canvasContext: context!, viewport: viewport } as any).promise;

            const ret = await worker.recognize(canvas);
            const data: any = ret.data;
            const lines = data.lines || []; // Safety fallback

            console.log(`[OCR Page ${i}] Raw Lines:`, lines.map((l: any) => l.text));

            for (const line of lines) {
                const item = parseLine(line.text);
                if (item) {
                    if (item.description.length > 100) continue; // Relaxed limit
                    items.push({
                        id: Math.random().toString(36).substring(7),
                        ...item
                    });
                }
            }
        }
        return items;
    };


    const processImage = async (file: File) => {
        isProcessing.value = true;
        progress.value = 0;

        try {
            const worker = await createWorker('spa');
            let items: any[] = [];

            if (file.type === 'application/pdf') {
                items = await processPdf(file, worker);
            } else {
                const ret = await worker.recognize(file);
                const data: any = ret.data;
                const lines = data.lines || [];

                for (const line of lines) {
                    const item = parseLine(line.text);
                    if (item) {
                        // Skip headers or subheaders usually not having price or having generic names
                        if (item.description.length > 50) continue; // Likely a paragraph

                        items.push({
                            id: Math.random().toString(36).substring(7),
                            ...item
                        });
                    }
                }
            }

            await worker.terminate();
            return items;
        } catch (e) {
            console.error("OCR Error", e);
            throw e;
        } finally {
            isProcessing.value = false;
        }
    };

    return {
        processImage,
        isProcessing,
        progress
    };
};
