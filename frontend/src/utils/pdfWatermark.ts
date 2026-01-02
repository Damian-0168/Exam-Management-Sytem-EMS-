import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface WatermarkOptions {
  text?: string;
  schoolName?: string;
  timestamp?: boolean;
  opacity?: number;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
}

/**
 * Add watermark to PDF blob
 * @param pdfBlob - Original PDF as Blob
 * @param options - Watermark configuration
 * @returns Watermarked PDF as Blob
 */
export const addWatermarkToPdf = async (
  pdfBlob: Blob,
  options: WatermarkOptions = {}
): Promise<Blob> => {
  try {
    const {
      text = 'CONFIDENTIAL',
      schoolName,
      timestamp = true,
      opacity = 0.3,
      fontSize = 48,
      color = { r: 0.5, g: 0.5, b: 0.5 },
    } = options;

    // Load PDF
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Prepare watermark text
    const watermarkLines: string[] = [];
    if (schoolName) watermarkLines.push(schoolName);
    watermarkLines.push(text);
    if (timestamp) {
      watermarkLines.push(new Date().toLocaleString());
    }

    // Add watermark to each page
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Draw diagonal watermark in center
      const centerX = width / 2;
      const centerY = height / 2;
      
      watermarkLines.forEach((line, index) => {
        const textWidth = font.widthOfTextAtSize(line, fontSize);
        const yOffset = (watermarkLines.length - 1 - index) * (fontSize + 10);
        
        page.drawText(line, {
          x: centerX - textWidth / 2,
          y: centerY + yOffset,
          size: fontSize,
          font: font,
          color: rgb(color.r, color.g, color.b),
          opacity: opacity,
          rotate: { angle: 45, type: 'degrees' },
        });
      });

      // Add small footer watermark
      const footerText = `${schoolName || ''} - ${text} - ${new Date().toLocaleDateString()}`;
      const footerFontSize = 8;
      page.drawText(footerText, {
        x: 10,
        y: 10,
        size: footerFontSize,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
        opacity: 0.5,
      });
    }

    // Save modified PDF
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error adding watermark:', error);
    // Return original PDF if watermarking fails
    return pdfBlob;
  }
};

/**
 * Create a watermarked URL for preview
 * @param originalUrl - Original PDF URL or Blob
 * @param options - Watermark configuration
 * @returns Object URL for watermarked PDF
 */
export const createWatermarkedPdfUrl = async (
  originalUrl: string | Blob,
  options: WatermarkOptions = {}
): Promise<string> => {
  try {
    let pdfBlob: Blob;
    
    if (typeof originalUrl === 'string') {
      // Fetch PDF from URL
      const response = await fetch(originalUrl);
      pdfBlob = await response.blob();
    } else {
      pdfBlob = originalUrl;
    }

    // Add watermark
    const watermarkedBlob = await addWatermarkToPdf(pdfBlob, options);
    
    // Create object URL
    return URL.createObjectURL(watermarkedBlob);
  } catch (error) {
    console.error('Error creating watermarked PDF:', error);
    // Return original URL if watermarking fails
    return typeof originalUrl === 'string' ? originalUrl : URL.createObjectURL(originalUrl);
  }
};
