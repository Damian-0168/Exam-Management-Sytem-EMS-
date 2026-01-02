import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileX, Loader2, Shield, Clock } from 'lucide-react';
import { getSignedPdfUrl } from '@/utils/pdfSecurity';
import { createWatermarkedPdfUrl } from '@/utils/pdfWatermark';
import { useAuditLogger } from '@/hooks/useAuditLogs';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface SecurePdfViewerProps {
  pdfPath: string;
  examSubjectId: string;
  examName: string;
  schoolName?: string;
  enableWatermark?: boolean;
  showControls?: boolean;
  width?: number;
  height?: string;
}

export const SecurePdfViewer = ({
  pdfPath,
  examSubjectId,
  examName,
  schoolName,
  enableWatermark = true,
  showControls = true,
  width,
  height = '70vh',
}: SecurePdfViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const auditLogger = useAuditLogger();

  useEffect(() => {
    const loadSecurePdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Generate signed URL (expires in 1 hour)
        const signedUrl = await getSignedPdfUrl(pdfPath, 3600);
        setExpiresAt(new Date(Date.now() + 3600 * 1000));

        if (enableWatermark) {
          // Fetch PDF and add watermark
          const response = await fetch(signedUrl);
          const pdfBlob = await response.blob();
          
          const watermarkedUrl = await createWatermarkedPdfUrl(pdfBlob, {
            text: 'CONFIDENTIAL',
            schoolName: schoolName || 'School Examination',
            timestamp: true,
            opacity: 0.15,
            fontSize: 48,
          });
          
          setPdfUrl(watermarkedUrl);
        } else {
          setPdfUrl(signedUrl);
        }

        // Log PDF view
        await auditLogger.logPdfView(examSubjectId, pdfPath);
      } catch (err: any) {
        console.error('Error loading secure PDF:', err);
        setError(err.message || 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    if (pdfPath) {
      loadSecurePdf();
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfPath, examSubjectId, enableWatermark, schoolName]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-muted/30 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading secure PDF...</p>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-muted/30 rounded-lg">
        <FileX className="h-12 w-12 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground text-center px-4">
          {error || 'Failed to load PDF'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Security Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Secure View
          </Badge>
          {enableWatermark && (
            <Badge variant="outline">Watermarked</Badge>
          )}
        </div>
        {expiresAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Expires: {expiresAt.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="w-full border rounded-lg overflow-hidden bg-gray-100">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="w-full h-96 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
          error={
            <div className="w-full h-96 flex flex-col items-center justify-center">
              <FileX className="h-12 w-12 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">Failed to render PDF</p>
            </div>
          }
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg"
          />
        </Document>
      </div>

      {/* Navigation Controls */}
      {showControls && numPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
