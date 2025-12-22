import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateSubjectExam } from '@/hooks/useSubjectExams';
import { useExamEvents } from '@/hooks/useExamEvents';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Loader2, Upload, FileText } from 'lucide-react';
import { SubjectExamFormData } from '@/types/exams';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadSubjectExamProps {
  onSuccess?: () => void;
}

export const UploadSubjectExam: React.FC<UploadSubjectExamProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const { user } = useTeacherAuth();
  const createExam = useCreateSubjectExam();
  const { data: examEvents } = useExamEvents();
  const { data: subjects } = useSubjects();

  // Filter events that are upcoming or ongoing
  const availableEvents = examEvents?.filter(
    e => e.status === 'upcoming' || e.status === 'ongoing'
  ) || [];

  // Get teacher's subjects from user metadata
  const teacherSubjects = subjects?.filter(subject =>
    user?.user_metadata?.subjects?.includes(subject.id)
  ) || [];

  const [formData, setFormData] = useState<Partial<SubjectExamFormData>>({
    examType: 'full-examination',
    examEventId: '',
    subjectId: '',
    examName: '',
    examDate: '',
    durationMinutes: 180,
    maxMarks: 100,
    passingMarks: 40,
    instructions: '',
    status: 'draft'
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleEventChange = (eventId: string) => {
    const event = availableEvents.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setFormData(prev => ({
        ...prev,
        examEventId: eventId,
        academicYear: event.academicYear,
        term: event.term
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file',
          variant: 'destructive'
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File too large',
          description: 'File size should be less than 10MB',
          variant: 'destructive'
        });
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.examEventId || !formData.subjectId || !formData.examName || !formData.examDate) {
      toast({
        title: 'Missing fields',
        description: 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (!pdfFile) {
      toast({
        title: 'PDF required',
        description: 'Please upload the exam PDF',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createExam.mutateAsync({
        ...formData as SubjectExamFormData,
        pdfFile
      });

      toast({
        title: 'Exam uploaded',
        description: 'Your subject exam has been uploaded successfully'
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error uploading exam',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (teacherSubjects.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          You don't have any subjects assigned. Please contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  if (availableEvents.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No exam events available for upload. Please wait for an admin to create an exam event.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Select Exam Event *</Label>
        <Select
          value={formData.examEventId}
          onValueChange={handleEventChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose exam event" />
          </SelectTrigger>
          <SelectContent>
            {availableEvents.map(event => (
              <SelectItem key={event.id} value={event.id}>
                {event.name} ({event.term} Term - {event.academicYear})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedEvent && (
          <p className="text-xs text-muted-foreground">
            {selectedEvent.startDate} to {selectedEvent.endDate}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Your Subject *</Label>
        <Select
          value={formData.subjectId}
          onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose your subject" />
          </SelectTrigger>
          <SelectContent>
            {teacherSubjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Exam Name *</Label>
        <Input
          placeholder="e.g., Mathematics Mid Term"
          value={formData.examName}
          onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Exam Date *</Label>
          <Input
            type="date"
            value={formData.examDate}
            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Max Marks *</Label>
          <Input
            type="number"
            value={formData.maxMarks}
            onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Passing Marks *</Label>
          <Input
            type="number"
            value={formData.passingMarks}
            onChange={(e) => setFormData({ ...formData, passingMarks: Number(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Upload Exam PDF *</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
          {pdfFile && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <FileText className="h-4 w-4" />
              {pdfFile.name}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">PDF only, max 10MB</p>
      </div>

      <div className="space-y-2">
        <Label>Instructions (Optional)</Label>
        <Textarea
          placeholder="Special instructions for students..."
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: 'draft' | 'published' | 'completed') =>
            setFormData({ ...formData, status: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="submit" disabled={createExam.isPending}>
          {createExam.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Exam
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
