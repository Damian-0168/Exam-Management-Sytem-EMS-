import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useExamEvent } from '@/hooks/useExamEvents';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useCreateExam, useUpdateExam, useDeleteExam } from '@/hooks/useExams';
import { ExamForm } from './ExamForm';
import { SubjectPdfManager } from './SubjectPdfManager';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export const ExamEventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useExamEvent(id!);
  const isAdmin = useIsAdmin();
  const createExamMutation = useCreateExam();
  const updateExamMutation = useUpdateExam();
  const deleteExamMutation = useDeleteExam();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const handleCreateExam = (data: any) => {
    createExamMutation.mutate(
      { ...data, exam_event_id: id },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
        }
      }
    );
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

  const canEditExam = (exam: any) => {
    return isAdmin || exam.teacher_id === currentUserId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found</p>
        <Button onClick={() => navigate('/exams')} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/exams')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
            {event.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}
          </div>
          <Badge className={getStatusColor(event.status)}>
            {event.status}
          </Badge>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd, yyyy')}</span>
          </div>
          <Badge variant="outline">{event.term === 'first' ? '1st' : '2nd'} Term</Badge>
          <Badge variant="outline">{event.academicYear}</Badge>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subject Examinations</h2>
        <Button onClick={() => { setSelectedExam(null); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subject Exam
        </Button>
      </div>

      {!event.exams || event.exams.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No subject exams added yet</p>
          <Button onClick={() => { setSelectedExam(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Subject Exam
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {event.exams.map((exam: any) => (
            <Card key={exam.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{exam.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Class {exam.class} - Section {exam.section}
                  </p>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(exam.exam_date), 'MMM dd, yyyy')}
                </div>

                {exam.exam_subjects && exam.exam_subjects.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Subject Exam Papers</p>
                    {exam.exam_subjects.map((es: any) => (
                      <SubjectPdfManager
                        key={es.id}
                        examSubjectId={es.id}
                        subjectName={es.subjects?.name || 'Unknown'}
                        pdfPath={es.pdf_file_path}
                        canEdit={canEditExam(exam)}
                      />
                    ))}
                  </div>
                )}

                {isAdmin && exam.teacher_id && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="w-4 h-4 mr-2" />
                    <span>Created by teacher</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {canEditExam(exam) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => { setSelectedExam(exam); setIsDialogOpen(true); }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExamToDelete(exam.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedExam(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam ? 'Edit Subject Exam' : 'Add Subject Exam'}</DialogTitle>
          </DialogHeader>
          <ExamForm
            exam={selectedExam || undefined}
            onSubmit={selectedExam ? handleUpdateExam : handleCreateExam}
            onCancel={() => { setIsDialogOpen(false); setSelectedExam(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subject exam. This action cannot be undone.
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
    </div>
  );
};
