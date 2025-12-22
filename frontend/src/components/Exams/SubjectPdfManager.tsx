import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Eye, Trash2, Download } from 'lucide-react';
import { useUploadSubjectPdf, useDeleteSubjectPdf } from '@/hooks/useExamSubjectPdf';
import { ExamCardPreview } from './ExamCardPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SubjectPdfManagerProps {
  examSubjectId: string;
  subjectName: string;
  teacherName?: string;
  pdfPath?: string | null;
  canEdit: boolean;
}

export const SubjectPdfManager = ({
  examSubjectId,
  subjectName,
  teacherName,
  pdfPath,
  canEdit
}: SubjectPdfManagerProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const uploadPdf = useUploadSubjectPdf();
  const deletePdf = useDeleteSubjectPdf();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      uploadPdf.mutate({ examSubjectId, pdfFile: file });
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please select a PDF file',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = async () => {
    if (!pdfPath) return;

    try {
      const { data, error } = await supabase.storage
        .from('exam-pdfs')
        .download(pdfPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${subjectName}-exam.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'PDF downloaded successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to download PDF',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{subjectName}</h4>
              {teacherName && (
                <p className="text-sm text-muted-foreground">Teacher: {teacherName}</p>
              )}
            </div>
          </div>

          {pdfPath ? (
            <div className="space-y-3">
              <ExamCardPreview pdfPath={pdfPath} examName={subjectName} />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {canEdit && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePdf.mutate(examSubjectId)}
                    disabled={deletePdf.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            canEdit && (
              <div>
                <Label htmlFor={`pdf-${examSubjectId}`} className="text-sm mb-2 block">
                  Upload Exam Paper (PDF)
                </Label>
                <label
                  htmlFor={`pdf-${examSubjectId}`}
                  className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  <span className="text-sm">Click to upload PDF file</span>
                </label>
                <input
                  id={`pdf-${examSubjectId}`}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploadPdf.isPending}
                />
              </div>
            )
          )}

          {!pdfPath && !canEdit && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No exam paper uploaded yet
            </div>
          )}
        </div>

        {pdfPath && (
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>{subjectName} - Exam Paper</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <iframe
                  src={`https://kcsiqhxghfmrbshmodzi.supabase.co/storage/v1/object/public/exam-pdfs/${pdfPath}`}
                  className="w-full h-[70vh] rounded-lg border"
                  title={`${subjectName} Exam Paper`}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};
