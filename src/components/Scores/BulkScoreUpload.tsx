import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useBulkCreateScores } from '@/hooks/useScores';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { Download, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { Score } from '@/types';

interface BulkScoreUploadProps {
  examId: string;
  subjectId: string;
  onComplete?: () => void;
}

interface ParsedScore {
  rollNumber: string;
  studentName: string;
  marksObtained: number;
  remarks?: string;
  studentId?: string;
  error?: string;
}

export const BulkScoreUpload: React.FC<BulkScoreUploadProps> = ({
  examId,
  subjectId,
  onComplete
}) => {
  const [parsedScores, setParsedScores] = useState<ParsedScore[]>([]);
  const [validScores, setValidScores] = useState<ParsedScore[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { data: students } = useStudents();
  const { data: subjects } = useSubjects();
  const bulkCreateScores = useBulkCreateScores();

  const selectedSubject = subjects?.find(s => s.id === subjectId);
  const maxMarks = selectedSubject?.max_marks || 100;

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      ['Roll Number', 'Student Name', 'Marks Obtained', 'Remarks (Optional)'],
      ['Example: 2024001', 'John Doe', '85', 'Excellent performance'],
      ['2024002', 'Jane Smith', '92', '']
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 30 }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scores Template');

    // Download
    XLSX.writeFile(wb, `scores_template_${Date.now()}.xlsx`);

    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and upload it back'
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Skip header row
        const rows = jsonData.slice(1).filter(row => row.length > 0 && row[0]);

        const parsed: ParsedScore[] = [];
        const errorsList: string[] = [];

        rows.forEach((row, index) => {
          const rollNumber = String(row[0] || '').trim();
          const studentName = String(row[1] || '').trim();
          const marksStr = String(row[2] || '').trim();
          const remarks = String(row[3] || '').trim();

          if (!rollNumber) {
            errorsList.push(`Row ${index + 2}: Missing roll number`);
            return;
          }

          // Find student by roll number
          const student = students?.find(s => s.rollNumber === rollNumber);
          
          if (!student) {
            parsed.push({
              rollNumber,
              studentName,
              marksObtained: Number(marksStr) || 0,
              remarks,
              error: 'Student not found'
            });
            return;
          }

          const marks = Number(marksStr);
          
          if (isNaN(marks)) {
            parsed.push({
              rollNumber,
              studentName: student.name,
              marksObtained: 0,
              remarks,
              studentId: student.id,
              error: 'Invalid marks format'
            });
            return;
          }

          if (marks < 0 || marks > maxMarks) {
            parsed.push({
              rollNumber,
              studentName: student.name,
              marksObtained: marks,
              remarks,
              studentId: student.id,
              error: `Marks must be between 0 and ${maxMarks}`
            });
            return;
          }

          parsed.push({
            rollNumber,
            studentName: student.name,
            marksObtained: marks,
            remarks,
            studentId: student.id
          });
        });

        setParsedScores(parsed);
        setValidScores(parsed.filter(s => !s.error && s.studentId));
        setErrors(errorsList);

        toast({
          title: 'File parsed',
          description: `Found ${parsed.length} records, ${parsed.filter(s => !s.error).length} valid`
        });
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          title: 'Error parsing file',
          description: 'Please check the file format and try again',
          variant: 'destructive'
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!examId || !subjectId) {
      toast({
        title: 'Missing information',
        description: 'Please select exam and subject first',
        variant: 'destructive'
      });
      return;
    }

    if (validScores.length === 0) {
      toast({
        title: 'No valid scores',
        description: 'Please upload a file with valid scores',
        variant: 'destructive'
      });
      return;
    }

    try {
      const scoresPayload: Omit<Score, 'id' | 'enteredAt' | 'updatedAt'>[] = validScores.map(score => ({
        studentId: score.studentId!,
        examId,
        subjectId,
        marksObtained: score.marksObtained,
        maxMarks,
        grade: '',
        gpa: 0,
        remarks: score.remarks || '',
        teacherId: ''
      }));

      await bulkCreateScores.mutateAsync(scoresPayload);

      toast({
        title: 'Scores uploaded successfully',
        description: `${validScores.length} scores have been saved`
      });

      // Reset state
      setParsedScores([]);
      setValidScores([]);
      setErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onComplete?.();
    } catch (error: any) {
      console.error('Error uploading scores:', error);
      toast({
        title: 'Error uploading scores',
        description: error.message || 'Failed to upload scores',
        variant: 'destructive'
      });
    }
  };

  const handleReset = () => {
    setParsedScores([]);
    setValidScores([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!examId || !subjectId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select an exam and subject before uploading scores.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Download the template Excel file</li>
              <li>Fill in the scores for each student using their roll number</li>
              <li>Upload the completed file</li>
              <li>Review the parsed data and click Upload</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>

      {/* Template Download */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Step 1: Download Template</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Download the Excel template to fill in scores
              </p>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base">Step 2: Upload Filled Template</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Upload the Excel file with student scores
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {parsedScores.length > 0 && (
                <Button onClick={handleReset} variant="outline">
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">File parsing errors:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {parsedScores.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Step 3: Review & Upload</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review the parsed scores before uploading
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Total: {parsedScores.length}
                  </Badge>
                  <Badge variant="default">
                    Valid: {validScores.length}
                  </Badge>
                  <Badge variant="destructive">
                    Errors: {parsedScores.filter(s => s.error).length}
                  </Badge>
                </div>
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedScores.map((score, index) => (
                      <TableRow key={index} className={score.error ? 'bg-destructive/10' : ''}>
                        <TableCell className="font-medium">{score.rollNumber}</TableCell>
                        <TableCell>{score.studentName}</TableCell>
                        <TableCell>{score.marksObtained}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {score.remarks || '-'}
                        </TableCell>
                        <TableCell>
                          {score.error ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {score.error}
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Valid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={validScores.length === 0 || bulkCreateScores.isPending}
                >
                  {bulkCreateScores.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {validScores.length} Scores
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
