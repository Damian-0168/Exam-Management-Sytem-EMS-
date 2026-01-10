import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Eye,
  Edit,
  Download,
  Trash2,
  Calendar,
  BookOpen,
  Users,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { SecurePdfViewer } from './SecurePdfViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useHasPermission } from '@/hooks/usePermissions';
import { logPdfDownload } from '@/utils/pdfSecurity';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ModernExamCardProps {
  examSubjectId: string;
  examName: string;
  subjectName: string;
  className: string;
  section: string;
  examType: 'full-examination' | 'test' | 'practical';
  examDate: string;
  status: 'draft' | 'published' | 'completed';
  pdfPath?: string | null;
  teacherName?: string;
  teacherId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  schoolName?: string;
}

export const ModernExamCard = ({
  examSubjectId,
  examName,
  subjectName,
  className,
  section,
  examType,
  examDate,
  status,
  pdfPath,
  teacherName,
  teacherId,
  currentUserId,
  isAdmin = false,
  onEdit,
  onDelete,
  schoolName
}: ModernExamCardProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const { hasPermission: canDownload } = useHasPermission('download_pdf');
  const { hasPermission: canDelete } = useHasPermission('delete_pdf');

  const canEdit = isAdmin || teacherId === currentUserId;
  const canDeleteExam = (isAdmin && canDelete) || (teacherId === currentUserId && canDelete);

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'full-examination':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'test':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'practical':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      case 'draft':
      default:
        return 'bg-yellow-500';
    }
  };

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'full-examination':
        return 'Examination';
      case 'test':
        return 'Test';
      case 'practical':
        return 'Practical';
      default:
        return type;
    }
  };

  const handleDownload = async () => {
    if (!pdfPath || !canDownload) return;

    try {
      const { data, error } = await supabase.storage
        .from('exam-pdfs')
        .download(pdfPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${examName}-${subjectName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log the download
      await logPdfDownload(pdfPath, examSubjectId);

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
    <>
      <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getExamTypeColor(examType)} text-white font-semibold`}>
                    {getExamTypeLabel(examType)}
                  </Badge>
                  <Badge className={`${getStatusColor(status)} text-white`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {examName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">{subjectName}</span>
                </div>
              </div>
              {pdfPath && (
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  <span className="font-medium">Class:</span> {className} - {section}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  <span className="font-medium">Date:</span>{' '}
                  {format(new Date(examDate), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>

            {/* Teacher Info */}
            {teacherName && (
              <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  <span className="font-medium">Uploaded by:</span> {teacherName}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {pdfPath && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              {pdfPath && canDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDeleteExam && onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* No PDF Message */}
            {!pdfPath && (
              <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed">
                <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No PDF uploaded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {pdfPath && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {examName} - {subjectName}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <SecurePdfViewer
                pdfPath={pdfPath}
                examSubjectId={examSubjectId}
                examName={`${examName} - ${subjectName}`}
                schoolName={schoolName}
                enableWatermark={true}
                showControls={true}
                width={900}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
