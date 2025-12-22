import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentReportView } from './StudentReportView';
import { ClassReportView } from './ClassReportView';
import { FileText, Users } from 'lucide-react';

export const ReportGeneration = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>
            Generate and export student and class reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" className="gap-2">
                <FileText className="h-4 w-4" />
                Student Reports
              </TabsTrigger>
              <TabsTrigger value="class" className="gap-2">
                <Users className="h-4 w-4" />
                Class Reports
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="student" className="mt-6">
              <StudentReportView />
            </TabsContent>
            
            <TabsContent value="class" className="mt-6">
              <ClassReportView />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
