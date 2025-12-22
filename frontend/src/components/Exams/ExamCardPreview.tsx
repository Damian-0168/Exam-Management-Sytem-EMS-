import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileX, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface ExamCardPreviewProps {
  pdfPath: string;
  examName: string;
}

export const ExamCardPreview = ({ pdfPath, examName }: ExamCardPreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: downloadError } = await supabase.storage
          .from('exam-pdfs')
          .download(pdfPath);

        if (downloadError) {
          console.error('PDF download error:', downloadError);
          throw new Error(downloadError.message || 'Failed to load PDF');
        }

        if (!data) {
          throw new Error('No PDF data received');
        }

        const url = URL.createObjectURL(data);
        setPdfUrl(url);
      } catch (err: any) {
        console.error('Error fetching PDF for preview:', err);
        setError(err.message || 'Failed to load PDF preview');
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfPath]);

  if (loading) {
    return (
      <div className="w-full h-32 bg-muted/30 rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="w-full h-32 bg-muted/30 rounded-lg flex flex-col items-center justify-center gap-2">
        <FileX className="h-6 w-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center px-2">
          {error || 'Preview unavailable'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-muted/30 rounded-lg overflow-hidden border border-border">
      <Document
        file={pdfUrl}
        loading={
          <div className="w-full h-32 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
        error={
          <div className="w-full h-32 flex flex-col items-center justify-center gap-2">
            <FileX className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Preview unavailable</p>
          </div>
        }
      >
        <Page
          pageNumber={1}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="exam-preview-page"
          width={280}
        />
      </Document>
    </div>
  );
};
