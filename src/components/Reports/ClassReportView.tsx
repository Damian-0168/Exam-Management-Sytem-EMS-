import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useExams } from '@/hooks/useExams';
import { useClassReport } from '@/hooks/useReports';
import { Download, Loader2, TrendingUp, TrendingDown, Users, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { exportClassReportPDF } from '@/utils/pdfExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ClassReportView = () => {
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const { toast } = useToast();
  const { data: exams, isLoading: examsLoading } = useExams();
  const { data: report, isLoading: reportLoading } = useClassReport(
    selectedExamId,
    selectedClass,
    selectedSection
  );

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const exam = exams?.find(e => e.id === examId);
    if (exam) {
      setSelectedClass(exam.class);
      setSelectedSection(exam.section);
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;

    setIsExporting(true);
    try {
      await exportClassReportPDF(report);
      toast({
        title: 'Report exported',
        description: 'Class report has been downloaded'
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

  const isLoading = examsLoading || reportLoading;

  // Prepare chart data
  const subjectChartData = report?.subjectAnalytics.map(analytic => ({
    name: analytic.subject.name,
    average: analytic.averageMarks,
    highest: analytic.highestMarks,
    lowest: analytic.lowestMarks,
    passRate: analytic.passRate
  })) || [];

  const gradeDistributionData = React.useMemo(() => {
    if (!report) return [];
    
    const gradeCount: { [key: string]: number } = {};
    report.students.forEach(student => {
      const grade = student.overallGrade;
      gradeCount[grade] = (gradeCount[grade] || 0) + 1;
    });

    return Object.entries(gradeCount).map(([grade, count]) => ({
      name: grade,
      value: count
    }));
  }, [report]);

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Select Exam</Label>
          <Select value={selectedExamId} onValueChange={handleExamChange}>
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

        <div className="space-y-2">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass} disabled>
            <SelectTrigger>
              <SelectValue placeholder="Auto-filled" />
            </SelectTrigger>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Section</Label>
          <Select value={selectedSection} onValueChange={setSelectedSection} disabled>
            <SelectTrigger>
              <SelectValue placeholder="Auto-filled" />
            </SelectTrigger>
          </Select>
        </div>
      </div>

      {/* Report Content */}
      {isLoading && selectedExamId && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && report && (
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Class {report.class} {report.section} - {report.exam.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Academic Year: {report.exam.academicYear} | Term: {report.exam.term}
                  </p>
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
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{report.students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Class Average</p>
                    <p className="text-2xl font-bold">{report.classAverage.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Highest Score</p>
                    <p className="text-2xl font-bold">{report.highestScore.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                    <p className="text-2xl font-bold">{report.passRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#8884d8" name="Average" />
                    <Bar dataKey="highest" fill="#82ca9d" name="Highest" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Subject Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Average</TableHead>
                      <TableHead className="text-center">Highest</TableHead>
                      <TableHead className="text-center">Lowest</TableHead>
                      <TableHead className="text-center">Pass Rate</TableHead>
                      <TableHead>Grade Distribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.subjectAnalytics.map(analytic => (
                      <TableRow key={analytic.subject.id}>
                        <TableCell className="font-medium">{analytic.subject.name}</TableCell>
                        <TableCell className="text-center">{analytic.averageMarks.toFixed(2)}</TableCell>
                        <TableCell className="text-center">{analytic.highestMarks}</TableCell>
                        <TableCell className="text-center">{analytic.lowestMarks}</TableCell>
                        <TableCell className="text-center">{analytic.passRate.toFixed(1)}%</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {Object.entries(analytic.gradeDistribution).map(([grade, count]) => (
                              <Badge key={grade} variant="outline" className="text-xs">
                                {grade}: {count}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Student Rankings */}
          <Card>
            <CardHeader>
              <CardTitle>Student Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="text-center">Total Marks</TableHead>
                      <TableHead className="text-center">Obtained</TableHead>
                      <TableHead className="text-center">Percentage</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">GPA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.students.map(studentReport => (
                      <TableRow key={studentReport.student.id}>
                        <TableCell className="font-bold">
                          #{studentReport.position}
                        </TableCell>
                        <TableCell>{studentReport.student.rollNumber}</TableCell>
                        <TableCell>{studentReport.student.name}</TableCell>
                        <TableCell className="text-center">{studentReport.totalMarks}</TableCell>
                        <TableCell className="text-center">{studentReport.obtainedMarks}</TableCell>
                        <TableCell className="text-center">{studentReport.percentage.toFixed(2)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge>{studentReport.overallGrade}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{studentReport.overallGPA.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !report && selectedExamId && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data found for this exam and class combination</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
