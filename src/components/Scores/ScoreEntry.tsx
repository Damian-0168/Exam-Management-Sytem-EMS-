import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useExams } from '@/hooks/useExams';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { useScoresByExam, useCreateScore, useUpdateScore } from '@/hooks/useScores';
import { Loader2, Save, Upload, Download } from 'lucide-react';
import { BulkScoreUpload } from './BulkScoreUpload';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Score } from '@/types';

interface ScoreEntryData {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number | '';
  grade: string;
  gpa: number;
  remarks: string;
  scoreId?: string;
}

export const ScoreEntry = () => {
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [scoresData, setScoresData] = useState<Map<string, ScoreEntryData>>(new Map());
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const { toast } = useToast();
  const { data: exams, isLoading: examsLoading } = useExams();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: existingScores, isLoading: scoresLoading } = useScoresByExam(selectedExamId);
  const createScore = useCreateScore();
  const updateScore = useUpdateScore();

  // Filter students by class and section
  const filteredStudents = useMemo(() => {
    if (!students || !selectedClass || !selectedSection) return [];
    return students.filter(
      s => s.class === selectedClass && s.section === selectedSection
    ).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
  }, [students, selectedClass, selectedSection]);

  // Get selected exam details
  const selectedExam = useMemo(() => {
    return exams?.find(e => e.id === selectedExamId);
  }, [exams, selectedExamId]);

  // Get selected subject details
  const selectedSubject = useMemo(() => {
    return subjects?.find(s => s.id === selectedSubjectId);
  }, [subjects, selectedSubjectId]);

  // Load existing scores when exam and subject are selected
  React.useEffect(() => {
    if (!existingScores || !selectedSubjectId || !filteredStudents.length) {
      return;
    }

    const newScoresData = new Map<string, ScoreEntryData>();
    
    filteredStudents.forEach(student => {
      const existingScore = existingScores.find(
        s => s.studentId === student.id && s.subjectId === selectedSubjectId
      );

      if (existingScore) {
        newScoresData.set(student.id, {
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          marksObtained: existingScore.marksObtained,
          grade: existingScore.grade,
          gpa: existingScore.gpa,
          remarks: existingScore.remarks || '',
          scoreId: existingScore.id
        });
      } else {
        newScoresData.set(student.id, {
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          marksObtained: '',
          grade: '',
          gpa: 0,
          remarks: ''
        });
      }
    });

    setScoresData(newScoresData);
  }, [existingScores, selectedSubjectId, filteredStudents]);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const exam = exams?.find(e => e.id === examId);
    if (exam) {
      setSelectedClass(exam.class);
      setSelectedSection(exam.section);
    }
    setScoresData(new Map());
  };

  const handleMarksChange = (studentId: string, marks: string) => {
    const numMarks = marks === '' ? '' : Number(marks);
    const maxMarks = selectedSubject?.max_marks || 100;

    if (numMarks !== '' && (numMarks < 0 || numMarks > maxMarks)) {
      toast({
        title: 'Invalid marks',
        description: `Marks must be between 0 and ${maxMarks}`,
        variant: 'destructive'
      });
      return;
    }

    const currentData = scoresData.get(studentId);
    if (currentData) {
      setScoresData(new Map(scoresData.set(studentId, {
        ...currentData,
        marksObtained: numMarks
      })));
    }
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    const currentData = scoresData.get(studentId);
    if (currentData) {
      setScoresData(new Map(scoresData.set(studentId, {
        ...currentData,
        remarks
      })));
    }
  };

  const handleSaveScores = async () => {
    if (!selectedExamId || !selectedSubjectId) {
      toast({
        title: 'Missing selection',
        description: 'Please select exam and subject',
        variant: 'destructive'
      });
      return;
    }

    const maxMarks = selectedSubject?.max_marks || 100;
    const scoresToSave = Array.from(scoresData.values()).filter(
      data => data.marksObtained !== ''
    );

    if (scoresToSave.length === 0) {
      toast({
        title: 'No scores to save',
        description: 'Please enter at least one score',
        variant: 'destructive'
      });
      return;
    }

    try {
      let successCount = 0;
      let updateCount = 0;

      for (const scoreData of scoresToSave) {
        const scorePayload = {
          studentId: scoreData.studentId,
          examId: selectedExamId,
          subjectId: selectedSubjectId,
          marksObtained: scoreData.marksObtained as number,
          maxMarks,
          grade: '',
          gpa: 0,
          remarks: scoreData.remarks,
          teacherId: ''
        };

        if (scoreData.scoreId) {
          // Update existing score
          await updateScore.mutateAsync({
            id: scoreData.scoreId,
            updates: {
              marksObtained: scoreData.marksObtained as number,
              maxMarks,
              remarks: scoreData.remarks
            } as Partial<Score>
          });
          updateCount++;
        } else {
          // Create new score
          await createScore.mutateAsync(scorePayload);
          successCount++;
        }
      }

      toast({
        title: 'Scores saved successfully',
        description: `${successCount} new scores created, ${updateCount} scores updated`
      });
    } catch (error: any) {
      console.error('Error saving scores:', error);
      toast({
        title: 'Error saving scores',
        description: error.message || 'Failed to save scores',
        variant: 'destructive'
      });
    }
  };

  const handleBulkUploadComplete = () => {
    setShowBulkUpload(false);
    toast({
      title: 'Bulk upload completed',
      description: 'Scores have been uploaded successfully'
    });
  };

  const isLoading = examsLoading || studentsLoading || subjectsLoading || scoresLoading;
  const canSave = selectedExamId && selectedSubjectId && scoresData.size > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Score Entry</CardTitle>
              <CardDescription>
                Enter or update student scores for exams
              </CardDescription>
            </div>
            <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Score Upload</DialogTitle>
                </DialogHeader>
                <BulkScoreUpload 
                  examId={selectedExamId}
                  subjectId={selectedSubjectId}
                  onComplete={handleBulkUploadComplete}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label>Select Subject</Label>
              <Select 
                value={selectedSubjectId} 
                onValueChange={setSelectedSubjectId}
                disabled={!selectedExamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} (Max: {subject.max_marks})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info Cards */}
          {selectedExam && selectedSubject && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Class</div>
                  <div className="text-2xl font-bold">{selectedExam.class} {selectedExam.section}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Subject</div>
                  <div className="text-2xl font-bold">{selectedSubject.name}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Max Marks</div>
                  <div className="text-2xl font-bold">{selectedSubject.max_marks}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Students</div>
                  <div className="text-2xl font-bold">{filteredStudents.length}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scores Table */}
          {selectedExamId && selectedSubjectId && (
            <div className="border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  No students found for this class and section
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Roll No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="w-[150px]">Marks Obtained</TableHead>
                      <TableHead className="w-[200px]">Remarks</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map(student => {
                      const scoreData = scoresData.get(student.id);
                      const hasScore = scoreData?.scoreId;
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.rollNumber}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={selectedSubject?.max_marks || 100}
                              value={scoreData?.marksObtained ?? ''}
                              onChange={(e) => handleMarksChange(student.id, e.target.value)}
                              placeholder="Enter marks"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={scoreData?.remarks ?? ''}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              placeholder="Optional"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            {hasScore ? (
                              <Badge variant="secondary">Saved</Badge>
                            ) : scoreData?.marksObtained !== '' ? (
                              <Badge variant="outline">New</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {selectedExamId && selectedSubjectId && filteredStudents.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleSaveScores}
                disabled={!canSave || createScore.isPending || updateScore.isPending}
              >
                {createScore.isPending || updateScore.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Scores
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
