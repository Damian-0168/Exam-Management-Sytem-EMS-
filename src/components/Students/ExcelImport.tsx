import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStudentTemplate } from '@/hooks/useTemplateData';

interface Student {
  name: string;
  registrationDate?: string;
  class: string;
  section: string;
  rollNumber?: string;
  guardian?: string;
  guardianContact?: string;
}

interface ExcelImportProps {
  onImport: (students: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  isLoading: boolean;
}

export const ExcelImport = ({ onImport, isLoading }: ExcelImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: templateData, isLoading: templateLoading } = useStudentTemplate();

  const downloadTemplate = () => {
    if (!templateData || templateData.length === 0) {
      toast({
        title: "Template Unavailable",
        description: "No template data found in the database",
        variant: "destructive"
      });
      return;
    }

    const template = templateData[0];
    const worksheet = XLSX.utils.json_to_sheet(template.sample_data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, template.filename);
    
    toast({
      title: "Template Downloaded",
      description: `${template.filename} has been downloaded to your computer`
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        toast({
          title: "Empty File",
          description: "The Excel file contains no data",
          variant: "destructive"
        });
        return;
      }

      const students = jsonData.map((row: any) => ({
        name: row.name || row.Name || '',
        registrationDate: row.registrationDate || row.RegistrationDate || row.registration_date || '',
        class: row.class || row.Class || '',
        section: row.section || row.Section || '',
        rollNumber: row.rollNumber || row.RollNumber || row.roll_number || '',
        guardian: row.guardian || row.Guardian || '',
        guardianContact: row.guardianContact || row.GuardianContact || row.guardian_contact || ''
      }));

      // Validate required fields
      const invalidStudents = students.filter(student => 
        !student.name.trim() || !student.class || !student.section
      );

      if (invalidStudents.length > 0) {
        toast({
          title: "Validation Error",
          description: `${invalidStudents.length} students are missing required fields (name, class, or section)`,
          variant: "destructive"
        });
        return;
      }

      await onImport(students);
      
      toast({
        title: "Import Started",
        description: `Processing ${students.length} students...`
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Excel import error:', error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to read the Excel file. Please check the format.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border border-dashed border-border rounded-lg">
      <div className="text-center">
        <h3 className="text-lg font-medium">Import Students from Excel</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload an Excel file with student data. Required fields: name, class, section
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="flex items-center gap-2"
          disabled={templateLoading || !templateData || templateData.length === 0}
        >
          <Download className="h-4 w-4" />
          {templateLoading ? 'Loading...' : 'Download Template'}
        </Button>
        
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
            disabled={isLoading}
          />
          <Button 
            variant="default" 
            className="flex items-center gap-2"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload Excel File
          </Button>
        </div>
      </div>
    </div>
  );
};