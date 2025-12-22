import { useState } from 'react';
import { Plus, Filter, Search, Calendar, BookOpen, Edit, Trash2, Download, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExams, useCreateExam, useUpdateExam, useDeleteExam, type ExamWithSubjects } from '@/hooks/useExams';
import { ExamForm } from './ExamForm';
import { PdfViewer } from './PdfViewer';
import { ExamCardPreview } from './ExamCardPreview';
import { SubjectPdfUploadManager } from './SubjectPdfUploadManager';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export const ExamManagement = () => {
  const { data: exams = [], isLoading } = useExams();
  const createExamMutation = useCreateExam();
  const updateExamMutation = useUpdateExam();
  const deleteExamMutation = useDeleteExam();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamWithSubjects | null>(null);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null);
  const [managingSubjectPdfs, setManagingSubjectPdfs] = useState<ExamWithSubjects | null>(null);

  const handleCreateExam = (data: any) => {
    createExamMutation.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false);
      }
    });
  };

  const handleUpdateExam = (data: any) => {
    if (selectedExam) {
      updateExamMutation.mutate(
        { 
          id: selectedExam.id, 
          updates: data, 
          subjects: data.subjects
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setSelectedExam(null);
          }
        }
      );
    }
  };

  const handleDeleteExam = () => {
    if (examToDelete) {
      deleteExamMutation.mutate(examToDelete, {
        onSuccess: () => {
          setExamToDelete(null);
        }
      });
    }
  };

  const handleViewPdf = async (pdfPath: string, examName: string) => {
    try {
      console.log('Attempting to view PDF:', pdfPath);
      
      const { data, error } = await supabase.storage
        .from('exam-pdfs')
        .download(pdfPath);

      if (error) {
        console.error('Storage download error:', error);
        throw new Error(error.message || 'Failed to download PDF');
      }

      if (!data) {
        throw new Error('No PDF data received from storage');
      }

      const url = URL.createObjectURL(data);
      setViewingPdf({ url, name: examName });
      
      console.log('PDF loaded successfully');
    } catch (error: any) {
      console.error('Error viewing PDF:', error);
      toast({
        title: 'Failed to Load PDF',
        description: error.message || 'Could not load the exam file. Please check if the file exists and try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadPdf = async (pdfPath: string) => {
    try {
      console.log('Attempting to download PDF:', pdfPath);
      
      const { data, error } = await supabase.storage
        .from('exam-pdfs')
        .download(pdfPath);

      if (error) {
        console.error('Storage download error:', error);
        throw new Error(error.message || 'Failed to download PDF');
      }

      if (!data) {
        throw new Error('No PDF data received from storage');
      }

      // Create a blob URL and trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfPath.split('/').pop() || 'exam.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'PDF downloaded successfully'
      });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Failed to Download PDF',
        description: error.message || 'Could not download the exam file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleClosePdfViewer = () => {
    if (viewingPdf) {
      URL.revokeObjectURL(viewingPdf.url);
      setViewingPdf(null);
    }
  };

  const openEditDialog = (exam: ExamWithSubjects) => {
    setSelectedExam(exam);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedExam(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedExam(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exam.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exam.section.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    const matchesTerm = termFilter === 'all' || exam.term === termFilter;
    
    return matchesSearch && matchesStatus && matchesTerm;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-500 mt-1">Create and manage exams for your classes</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              <SelectItem value="first">1st Term</SelectItem>
              <SelectItem value="second">2nd Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No exams found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' || termFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first exam'}
          </p>
          {!searchQuery && statusFilter === 'all' && termFilter === 'all' && (
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Exam
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{exam.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Class {exam.class} - Section {exam.section}
                  </p>
                </div>
                <Badge className={getStatusColor(exam.status)}>
                  {exam.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(exam.exam_date), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{exam.term === 'first' ? '1st' : '2nd'} Term</Badge>
                  <Badge variant="outline">{getTypeLabel(exam.type)}</Badge>
                </div>
              </div>

              {exam.exam_subjects && exam.exam_subjects.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Subjects ({exam.exam_subjects.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {exam.exam_subjects.slice(0, 3).map((es) => (
                      <Badge key={es.id} variant="secondary" className="text-xs">
                        {es.subjects.code}
                      </Badge>
                    ))}
                    {exam.exam_subjects.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{exam.exam_subjects.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {exam.pdf_file_path && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Exam Preview</p>
                  <ExamCardPreview pdfPath={exam.pdf_file_path} examName={exam.name} />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setManagingSubjectPdfs(exam)}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Manage PDFs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(exam)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                {exam.pdf_file_path && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPdf(exam.pdf_file_path!, exam.name)}
                      title="View PDF"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(exam.pdf_file_path!)}
                      title="Download PDF"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExamToDelete(exam.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
          </DialogHeader>
          <ExamForm
            exam={selectedExam || undefined}
            onSubmit={selectedExam ? handleUpdateExam : handleCreateExam}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this exam and all associated scores. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Viewer */}
      {viewingPdf && (
        <PdfViewer
          fileUrl={viewingPdf.url}
          fileName={viewingPdf.name}
          isOpen={true}
          onClose={handleClosePdfViewer}
          onDownload={() => {
            const a = document.createElement('a');
            a.href = viewingPdf.url;
            a.download = viewingPdf.name + '.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
        />
      )}

      {/* Subject PDF Management Dialog */}
      <Dialog open={!!managingSubjectPdfs} onOpenChange={() => setManagingSubjectPdfs(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Subject Exam Papers - {managingSubjectPdfs?.name}</DialogTitle>
          </DialogHeader>
          {managingSubjectPdfs && (
            <div className="mt-4">
              <Separator className="mb-6" />
              <SubjectPdfUploadManager
                examName={managingSubjectPdfs.name}
                examClass={managingSubjectPdfs.class}
                examSubjects={managingSubjectPdfs.exam_subjects || []}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
