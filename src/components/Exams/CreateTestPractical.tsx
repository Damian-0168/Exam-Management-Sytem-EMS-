import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateSubjectExam } from '@/hooks/useSubjectExams';
import { useSubjects } from '@/hooks/useSubjects';
import { useClassesSections } from '@/hooks/useClassesSections';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Loader2, Upload, FileText } from 'lucide-react';
import { SubjectExamFormData } from '@/types/exams';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateTestPracticalProps {
  examType: 'test' | 'practical';
  onSuccess?: () => void;
}

export const CreateTestPractical: React.FC<CreateTestPracticalProps> = ({ examType, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useTeacherAuth();
  const createExam = useCreateSubjectExam();
  const { data: subjects } = useSubjects();
  const { data: classesSections } = useClassesSections();

  // Get teacher's subjects
  const teacherSubjects = subjects?.filter(subject =>
    user?.user_metadata?.subjects?.includes(subject.id)
  ) || [];

  const [formData, setFormData] = useState<Partial<SubjectExamFormData>>({
    examType: examType,
    subjectId: '',
    examName: '',
    examDate: '',
    durationMinutes: examType === 'test' ? 60 : 90,
    maxMarks: examType === 'test' ? 20 : 30,
    passingMarks: examType === 'test' ? 8 : 12,
    instructions: '',
    status: 'draft',
    class: '',
    section: '',
    academicYear: new Date().getFullYear().toString(),
    term: 'first'
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);

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
      if (file.size > 10 * 1024 * 1024) {
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

    if (!formData.subjectId || !formData.examName || !formData.examDate || !formData.class || !formData.section) {
      toast({
        title: 'Missing fields',
        description: 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createExam.mutateAsync({
        ...formData as SubjectExamFormData,
        pdfFile: pdfFile || undefined
      });

      toast({
        title: `${examType === 'test' ? 'Test' : 'Practical'} created`,
        description: 'Your exam has been created successfully'
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error creating exam',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label>{examType === 'test' ? 'Test' : 'Practical'} Name *</Label>
        <Input
          placeholder={`e.g., Unit ${examType === 'test' ? 'Test' : 'Practical'} 1`}
          value={formData.examName}
          onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Class *</Label>
          <Select 
            value={formData.class} 
            onValueChange={(value) => setFormData({ ...formData, class: value, section: '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set(classesSections?.map(cs => cs.class_name))).map(className => (
                <SelectItem key={className} value={className}>{className}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Section *</Label>
          <Select 
            value={formData.section} 
            onValueChange={(value) => setFormData({ ...formData, section: value })}
            disabled={!formData.class}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {classesSections
                ?.filter(cs => cs.class_name === formData.class)
                .map(cs => (
                  <SelectItem key={cs.section} value={cs.section}>{cs.section}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Academic Year *</Label>
          <Input
            placeholder="2025"
            value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Term *</Label>
          <Select 
            value={formData.term} 
            onValueChange={(value: 'first' | 'second') => setFormData({ ...formData, term: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first">First Term</SelectItem>
              <SelectItem value="second">Second Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Upload Exam PDF (Optional)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
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
              Creating...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Create {examType === 'test' ? 'Test' : 'Practical'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
