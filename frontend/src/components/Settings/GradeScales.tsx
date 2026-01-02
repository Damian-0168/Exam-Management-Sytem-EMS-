import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useExamStore } from '@/store/examStore';
import { Award, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const GradeScales = () => {
  const { gradeScales } = useExamStore();
  const defaultScale = gradeScales.find(scale => scale.isDefault);

  if (!defaultScale) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        No grade scale configured
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The grade scale defines how percentages are converted to letter grades and GPA.
          This scale is used for all score calculations.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {defaultScale.name}
              </CardTitle>
              <CardDescription>
                {defaultScale.isDefault && (
                  <Badge variant="default" className="mt-2">Default</Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Percentage Range</TableHead>
                  <TableHead className="text-center">GPA</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaultScale.grades.map((gradeRange, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge 
                        variant="default"
                        className="text-lg font-bold"
                      >
                        {gradeRange.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {gradeRange.minPercentage}% - {gradeRange.maxPercentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">
                        {gradeRange.gpa.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {gradeRange.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Grade Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Calculation Examples</CardTitle>
          <CardDescription>
            How different percentages translate to grades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { percentage: 95, description: 'Excellent' },
              { percentage: 85, description: 'Very Good' },
              { percentage: 70, description: 'Good' },
              { percentage: 55, description: 'Satisfactory' }
            ].map((example, index) => {
              const gradeInfo = defaultScale.grades.find(
                g => example.percentage >= g.minPercentage && example.percentage <= g.maxPercentage
              );
              
              return (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <p className="text-3xl font-bold">{example.percentage}%</p>
                      <Badge variant="default" className="text-lg">
                        {gradeInfo?.grade || 'N/A'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        GPA: {gradeInfo?.gpa.toFixed(2) || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {example.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Note about customization */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Grade scale customization is managed by school administrators.
            Contact your administrator if you need to modify the grading system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
