import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

import { useSubjects } from '@/hooks/useSubjects';
import { useClassesSections } from '@/hooks/useClassesSections';
import type { ExamWithSubjects } from '@/hooks/useExams';

const examSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  academic_year: z.string().min(1, 'Academic year is required'),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  exam_date: z.string().min(1, 'Exam date is required'),
  term: z.enum(['first', 'second']),
  type: z.enum(['test', 'practical', 'full-examination']),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
  is_visible: z.boolean().optional()
});

type ExamFormData = z.infer<typeof examSchema>;

interface ExamFormProps {
  exam?: ExamWithSubjects;
  onSubmit: (data: ExamFormData & { subjects: { subject_id: string; max_marks: number }[] }) => void;
  onCancel: () => void;
}

export const ExamForm = ({ exam, onSubmit, onCancel }: ExamFormProps) => {
  const { data: subjects = [] } = useSubjects();
  const { data: classesSections = [] } = useClassesSections();
  const [selectedSubjects, setSelectedSubjects] = useState<{ subject_id: string; max_marks: number }[]>([]);

  // Extract unique classes and sections from classesSections
  const uniqueClasses = [...new Set(classesSections.map(cs => cs.class_name))].sort();
  const uniqueSections = [...new Set(classesSections.map(cs => cs.section))].sort();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: exam ? {
      name: exam.name,
      academic_year: exam.academic_year,
      class: exam.class,
      section: exam.section,
      exam_date: exam.exam_date,
      term: exam.term,
      type: exam.type,
      status: exam.status,
      is_visible: exam.is_visible
    } : {
      status: 'upcoming',
      is_visible: true
    }
  });

  useEffect(() => {
    if (exam?.exam_subjects) {
      setSelectedSubjects(
        exam.exam_subjects.map(es => ({
          subject_id: es.subject_id,
          max_marks: es.max_marks
        }))
      );
    }
  }, [exam]);

  const handleSubjectToggle = (subjectId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubjects([...selectedSubjects, { subject_id: subjectId, max_marks: 100 }]);
    } else {
      setSelectedSubjects(selectedSubjects.filter(s => s.subject_id !== subjectId));
    }
  };

  const handleMaxMarksChange = (subjectId: string, maxMarks: number) => {
    setSelectedSubjects(selectedSubjects.map(s => 
      s.subject_id === subjectId ? { ...s, max_marks: maxMarks } : s
    ));
  };

  const onFormSubmit = (data: ExamFormData) => {
    onSubmit({ ...data, subjects: selectedSubjects });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Exam Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Exam Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Mid-Term Examination" />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="academic_year">Academic Year *</Label>
            <Input id="academic_year" {...register('academic_year')} placeholder="e.g., 2024-2025" />
            {errors.academic_year && <p className="text-sm text-destructive mt-1">{errors.academic_year.message}</p>}
          </div>

          <div>
            <Label htmlFor="class">Class *</Label>
            <Select onValueChange={(value) => setValue('class', value)} defaultValue={exam?.class}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {uniqueClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.class && <p className="text-sm text-destructive mt-1">{errors.class.message}</p>}
          </div>

          <div>
            <Label htmlFor="section">Section *</Label>
            <Select onValueChange={(value) => setValue('section', value)} defaultValue={exam?.section}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {uniqueSections.map((sec) => (
                  <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.section && <p className="text-sm text-destructive mt-1">{errors.section.message}</p>}
          </div>

          <div>
            <Label htmlFor="exam_date">Exam Date *</Label>
            <Input id="exam_date" type="date" {...register('exam_date')} />
            {errors.exam_date && <p className="text-sm text-destructive mt-1">{errors.exam_date.message}</p>}
          </div>

          <div>
            <Label htmlFor="term">Term *</Label>
            <Select onValueChange={(value) => setValue('term', value as any)} defaultValue={exam?.term}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first">1st Term</SelectItem>
                <SelectItem value="second">2nd Term</SelectItem>
              </SelectContent>
            </Select>
            {errors.term && <p className="text-sm text-destructive mt-1">{errors.term.message}</p>}
          </div>

          <div>
            <Label htmlFor="type">Exam Type *</Label>
            <Select onValueChange={(value) => setValue('type', value as any)} defaultValue={exam?.type}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="practical">Practical</SelectItem>
                <SelectItem value="full-examination">Full Examination</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => setValue('status', value as any)} defaultValue={exam?.status || 'upcoming'}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="is_visible">Display on System</Label>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="is_visible"
                checked={watch('is_visible') ?? true}
                onCheckedChange={(checked) => setValue('is_visible', checked as boolean)}
              />
              <Label htmlFor="is_visible" className="text-sm font-normal cursor-pointer">
                Make exam visible on the system
              </Label>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Select Subjects</h3>
        <div className="space-y-3">
          {subjects.map((subject) => {
            const isSelected = selectedSubjects.some(s => s.subject_id === subject.id);
            const selectedSubject = selectedSubjects.find(s => s.subject_id === subject.id);

            return (
              <div key={subject.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSubjectToggle(subject.id, checked as boolean)}
                />
                <div className="flex-1">
                  <p className="font-medium">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">{subject.code}</p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`max-marks-${subject.id}`} className="text-sm">Max Marks:</Label>
                    <Input
                      id={`max-marks-${subject.id}`}
                      type="number"
                      className="w-24"
                      value={selectedSubject?.max_marks || 100}
                      onChange={(e) => handleMaxMarksChange(subject.id, parseInt(e.target.value) || 100)}
                      min="1"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {exam ? 'Update Exam' : 'Create Exam'}
        </Button>
      </div>
    </form>
  );
};
