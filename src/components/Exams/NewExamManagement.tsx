import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExamEventsList } from './ExamEventsList';
import { CreateExamEvent } from './CreateExamEvent';
import { MySubjectExams } from './MySubjectExams';
import { TestsPracticalsManagement } from './TestsPracticalsManagement';
import { Calendar, FileText, FlaskConical, BookOpen } from 'lucide-react';

export const NewExamManagement = () => {
  const [activeTab, setActiveTab] = useState('events');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Examination Management</CardTitle>
          <CardDescription>
            Manage exam events, upload your subject exams, and handle tests/practicals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="events" className="gap-2">
                <Calendar className="h-4 w-4" />
                Exam Events
              </TabsTrigger>
              <TabsTrigger value="my-exams" className="gap-2">
                <BookOpen className="h-4 w-4" />
                My Subject Exams
              </TabsTrigger>
              <TabsTrigger value="tests" className="gap-2">
                <FileText className="h-4 w-4" />
                Tests
              </TabsTrigger>
              <TabsTrigger value="practicals" className="gap-2">
                <FlaskConical className="h-4 w-4" />
                Practicals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-6 space-y-6">
              <CreateExamEvent />
              <ExamEventsList />
            </TabsContent>

            <TabsContent value="my-exams" className="mt-6">
              <MySubjectExams />
            </TabsContent>

            <TabsContent value="tests" className="mt-6">
              <TestsPracticalsManagement examType="test" />
            </TabsContent>

            <TabsContent value="practicals" className="mt-6">
              <TestsPracticalsManagement examType="practical" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
