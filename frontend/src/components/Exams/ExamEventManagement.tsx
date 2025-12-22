import { useState } from 'react';
import { Plus, Calendar, BookOpen, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useExamEvents, useCreateExamEvent, useUpdateExamEvent, useDeleteExamEvent, type ExamEvent } from '@/hooks/useExamEvents';
import { useIsAdmin } from '@/hooks/useUserRole';
import { ExamEventForm } from './ExamEventForm';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const ExamEventManagement = () => {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useExamEvents();
  const isAdmin = useIsAdmin();
  const createEventMutation = useCreateExamEvent();
  const updateEventMutation = useUpdateExamEvent();
  const deleteEventMutation = useDeleteExamEvent();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExamEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const handleCreateEvent = (data: any) => {
    createEventMutation.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false);
      }
    });
  };

  const handleUpdateEvent = (data: any) => {
    if (selectedEvent) {
      updateEventMutation.mutate(
        { id: selectedEvent.id, updates: data },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setSelectedEvent(null);
          }
        }
      );
    }
  };

  const handleDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete, {
        onSuccess: () => {
          setEventToDelete(null);
        }
      });
    }
  };

  const openEditDialog = (event: ExamEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedEvent(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Events</h1>
          <p className="text-muted-foreground mt-1">Manage major examination events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/exams/standalone')}>
            View Tests & Practicals
          </Button>
          {isAdmin && (
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No exam events found</h3>
          <p className="text-muted-foreground mb-4">
            {isAdmin ? 'Get started by creating your first exam event' : 'No exam events have been created yet'}
          </p>
          {isAdmin && (
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Event
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{event.name}</h3>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  )}
                </div>
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{event.term === 'first' ? '1st' : '2nd'} Term</Badge>
                  <Badge variant="outline">{event.academicYear}</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/exams/events/${event.id}`)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(event)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventToDelete(event.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Exam Event' : 'Create New Exam Event'}</DialogTitle>
          </DialogHeader>
          <ExamEventForm
            event={selectedEvent || undefined}
            onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this exam event and all associated subject exams. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
