import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubjectExams } from '@/hooks/useSubjectExams';
import { useExamEvents } from '@/hooks/useExamEvents';
import { Loader2, Plus, BookOpen, Calendar, FileText, Trash2, ExternalLink } from 'lucide-react';
import { UploadSubjectExam } from './UploadSubjectExam';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useDeleteSubjectExam } from '@/hooks/useSubjectExams';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const MySubjectExams = () => {
  const { data: myExams, isLoading } = useSubjectExams(true);
  const { data: examEvents } = useExamEvents();
  const deleteExam = useDeleteSubjectExam();
  const { toast } = useToast();

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);

  // Filter only full-examination types (linked to events)
  const eventExams = myExams?.filter(exam => exam.type === 'full-examination') || [];

  const getEventName = (eventId?: string) => {
    if (!eventId) return 'N/A';
    return examEvents?.find(e => e.id === eventId)?.name || 'Unknown Event';
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExam.mutateAsync(id);
      toast({
        title: 'Exam deleted',
        description: 'Subject exam has been removed'
      });
      setExamToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error deleting exam',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">My Subject Exams for Events</h3>
            <p className="text-sm text-muted-foreground">
              Upload your subject exams to exam events (Mid Term, Final, etc.)
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Exam
          </Button>
        </div>

        {eventExams.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>You haven't uploaded any subject exams yet</p>
                <p className="text-sm mt-2">Upload your exam to an exam event</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventExams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {exam.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {exam.class} - {exam.section}
                      </p>
                    </div>
                    <Badge variant={exam.status === 'completed' ? 'default' : 'secondary'}>
                      {exam.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div>
                      <p className="text-muted-foreground">Exam Event</p>
                      <p className="font-medium">{getEventName(exam.examEventId)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{format(new Date(exam.examDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>

                  {exam.examSubjects && exam.examSubjects.length > 0 && (
                    <div className="text-xs">
                      <p className="text-muted-foreground mb-1">Subjects:</p>
                      {exam.examSubjects.map(es => (
                        <span key={es.id} className="inline-block bg-muted px-2 py-1 rounded mr-1 mb-1">
                          {es.subject?.name || 'Unknown'} ({es.maxMarks} marks)
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {exam.pdfFilePath && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(exam.pdfFilePath, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View PDF
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setExamToDelete(exam.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Subject Exam</DialogTitle>
          </DialogHeader>
          <UploadSubjectExam onSuccess={() => setShowUploadDialog(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => examToDelete && handleDelete(examToDelete)}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteExam.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
