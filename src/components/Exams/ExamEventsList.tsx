import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExamEvents } from '@/hooks/useExamEvents';
import { Loader2, Calendar, Eye, Users, BookOpen } from 'lucide-react';
import { ExamEventPreview } from './ExamEventPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

export const ExamEventsList = () => {
  const { data: examEvents, isLoading } = useExamEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!examEvents || examEvents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No exam events created yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exam Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Start:</span>
                  </div>
                  <span className="font-medium">
                    {format(new Date(event.startDate), 'MMM dd, yyyy')}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">End:</span>
                  </div>
                  <span className="font-medium">
                    {format(new Date(event.endDate), 'MMM dd, yyyy')}
                  </span>

                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Term:</span>
                  </div>
                  <span className="font-medium capitalize">{event.term}</span>

                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Year:</span>
                  </div>
                  <span className="font-medium">{event.academicYear}</span>
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}

                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Subject Exams
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedEventId} onOpenChange={() => setSelectedEventId(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exam Event Preview</DialogTitle>
          </DialogHeader>
          {selectedEventId && <ExamEventPreview eventId={selectedEventId} />}
        </DialogContent>
      </Dialog>
    </>
  );
};
