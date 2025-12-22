import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const PdfViewer = ({ fileUrl, fileName, isOpen, onClose, onDownload }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex flex-col items-center bg-muted/30 rounded-lg p-4">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full">
                <p className="text-destructive">Failed to load PDF. Please try again.</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
              width={Math.min(window.innerWidth * 0.7, 800)}
            />
          </Document>
        </div>

        {numPages > 0 && (
          <div className="flex items-center justify-center gap-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
