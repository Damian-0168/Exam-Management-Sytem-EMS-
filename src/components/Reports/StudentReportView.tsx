import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useStudents } from '@/hooks/useStudents';
import { useExams } from '@/hooks/useExams';
import { useStudentReport } from '@/hooks/useReports';
import { Download, Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { exportStudentReportPDF } from '@/utils/pdfExport';

export const StudentReportView = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const { toast } = useToast();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: exams, isLoading: examsLoading } = useExams();
  const { data: report, isLoading: reportLoading } = useStudentReport(selectedStudentId, selectedExamId);

  const handleExportPDF = async () => {
    if (!report) return;

    setIsExporting(true);
    try {
      await exportStudentReportPDF(report);
      toast({
        title: 'Report exported',
        description: 'Student report card has been downloaded'
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export report as PDF',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = studentsLoading || examsLoading || reportLoading;

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Select Student</Label>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose student" />
            </SelectTrigger>
            <SelectContent>
              {students?.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  {student.rollNumber} - {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Select Exam</Label>
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose exam" />
            </SelectTrigger>
            <SelectContent>
              {exams?.map(exam => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name} - {exam.class} {exam.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Content */}
      {isLoading && selectedStudentId && selectedExamId && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && report && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{report.student.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Roll Number: {report.student.rollNumber} | Class: {report.student.class} {report.student.section}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Guardian</p>
                      <p className="font-medium">{report.student.guardian}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-medium">{report.student.guardianContact}</p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleExportPDF} disabled={isExporting}>
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Exam Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Exam</p>
                  <p className="font-medium">{report.exam.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Academic Year</p>
                  <p className="font-medium">{report.exam.academicYear}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Term</p>
                  <p className="font-medium capitalize">{report.exam.term}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(report.exam.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Scores Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Subject-wise Performance</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Marks Obtained</TableHead>
                        <TableHead className="text-center">Max Marks</TableHead>
                        <TableHead className="text-center">Percentage</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">GPA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.scores.map(score => {
                        const percentage = (score.marksObtained / score.maxMarks) * 100;
                        return (
                          <TableRow key={score.id}>
                            <TableCell className="font-medium">{score.subject.name}</TableCell>
                            <TableCell className="text-center">{score.marksObtained}</TableCell>
                            <TableCell className="text-center">{score.maxMarks}</TableCell>
                            <TableCell className="text-center">{percentage.toFixed(1)}%</TableCell>
                            <TableCell className="text-center">
                              <Badge>{score.grade}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{score.gpa.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Total / Average</TableCell>
                        <TableCell className="text-center">{report.obtainedMarks}</TableCell>
                        <TableCell className="text-center">{report.totalMarks}</TableCell>
                        <TableCell className="text-center">{report.percentage.toFixed(2)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default">{report.overallGrade}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{report.overallGPA.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Overall Percentage</p>
                      <p className="text-3xl font-bold">{report.percentage.toFixed(2)}%</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Overall Grade</p>
                      <p className="text-3xl font-bold">{report.overallGrade}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Class Position</p>
                      <p className="text-3xl font-bold">#{report.position}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Remarks */}
              {report.scores.some(s => s.remarks) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Teacher Remarks</h3>
                  <div className="space-y-2">
                    {report.scores
                      .filter(s => s.remarks)
                      .map(score => (
                        <div key={score.id} className="flex gap-2">
                          <Badge variant="outline">{score.subject.name}</Badge>
                          <p className="text-sm text-muted-foreground">{score.remarks}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !report && selectedStudentId && selectedExamId && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scores found for this student and exam combination</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
