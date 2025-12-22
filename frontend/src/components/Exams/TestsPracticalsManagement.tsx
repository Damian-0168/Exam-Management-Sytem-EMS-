import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubjectExams } from '@/hooks/useSubjectExams';
import { Loader2, Plus, FileText, Trash2, ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { CreateTestPractical } from './CreateTestPractical';
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

interface TestsPracticalsManagementProps {
  examType: 'test' | 'practical';
}

export const TestsPracticalsManagement: React.FC<TestsPracticalsManagementProps> = ({ examType }) => {
  const { data: myExams, isLoading } = useSubjectExams(true);
  const deleteExam = useDeleteSubjectExam();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);

  // Filter by exam type
  const filteredExams = myExams?.filter(exam => exam.type === examType) || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteExam.mutateAsync(id);
      toast({
        title: `${examType === 'test' ? 'Test' : 'Practical'} deleted`,
        description: 'Exam has been removed'
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
            <h3 className="text-lg font-semibold capitalize">My {examType}s</h3>
            <p className="text-sm text-muted-foreground">
              Manage your {examType}s independently
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create {examType === 'test' ? 'Test' : 'Practical'}
          </Button>
        </div>

        {filteredExams.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {examType}s created yet</p>
                <p className="text-sm mt-2">Create your first {examType}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => (
              <Card key={exam.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {exam.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {exam.class} - {exam.section}
                      </p>
                    </div>
                    <Badge variant={exam.status === 'completed' ? 'default' : 'secondary'}>
                      {exam.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {format(new Date(exam.examDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {exam.examSubjects && exam.examSubjects.length > 0 && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Subjects:</span>
                        <span className="font-medium">{exam.examSubjects.length}</span>
                      </div>
                    )}
                    <div className="text-xs">
                      <span className="text-muted-foreground">Class:</span>{' '}
                      <span className="font-medium">{exam.class} {exam.section}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create {examType === 'test' ? 'Test' : 'Practical'}</DialogTitle>
          </DialogHeader>
          <CreateTestPractical 
            examType={examType} 
            onSuccess={() => setShowCreateDialog(false)} 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {examType === 'test' ? 'Test' : 'Practical'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {examType}? This action cannot be undone.
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
