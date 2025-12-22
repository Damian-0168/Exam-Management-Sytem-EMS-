import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubjectPdfManager } from './SubjectPdfManager';
import { ExamWithSubjects } from '@/hooks/useExams';

interface ExamPdfManagementProps {
  exam: ExamWithSubjects;
  canEdit: boolean;
}

export const ExamPdfManagement = ({ exam, canEdit }: ExamPdfManagementProps) => {
  if (!exam.exam_subjects || exam.exam_subjects.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Subject Exam Papers</h3>
      <Tabs defaultValue={exam.exam_subjects[0]?.id} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
          {exam.exam_subjects.map((subject) => (
            <TabsTrigger
              key={subject.id}
              value={subject.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              {subject.subjects.code}
            </TabsTrigger>
          ))}
        </TabsList>

        {exam.exam_subjects.map((subject) => (
          <TabsContent key={subject.id} value={subject.id} className="mt-4">
            <SubjectPdfManager
              examSubjectId={subject.id}
              subjectName={subject.subjects.name}
              pdfPath={subject.pdf_file_path}
              canEdit={canEdit}
            />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};
