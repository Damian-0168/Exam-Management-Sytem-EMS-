import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useExamEvent } from '@/hooks/useExamEvents';
import { Loader2, BookOpen, Calendar, User, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface ExamEventPreviewProps {
  eventId: string;
}

export const ExamEventPreview: React.FC<ExamEventPreviewProps> = ({ eventId }) => {
  const { data: event, isLoading } = useExamEvent(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        Exam event not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{event.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {event.academicYear} • Term: {event.term}
              </p>
            </div>
            <Badge className={event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : ''}>
              {event.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(event.startDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{format(new Date(event.endDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subject Exams</p>
              <p className="font-medium text-2xl">{event.exams?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Academic Year</p>
              <p className="font-medium">{event.academicYear}</p>
            </div>
          </div>
          {event.description && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Subject Exams Uploaded</h3>
        
        {!event.exams || event.exams.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No subject exams uploaded yet</p>
                <p className="text-sm mt-2">Teachers need to upload their subject exams</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.exams.map((exam: any) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {exam.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {exam.class} - {exam.section}
                      </p>
                    </div>
                    <Badge variant={exam.status === 'completed' ? 'default' : 'secondary'}>
                      {exam.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Exam Date:</span>
                      <span className="font-medium">
                        {format(new Date(exam.exam_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>

                  {exam.exam_subjects && exam.exam_subjects.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Subjects:</p>
                      {exam.exam_subjects.map((es: any) => (
                        <div key={es.id} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                          <span>{es.subjects?.name || 'Unknown Subject'}</span>
                          {es.pdf_file_path && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(es.pdf_file_path, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
