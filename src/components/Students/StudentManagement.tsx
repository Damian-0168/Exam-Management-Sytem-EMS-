import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { StudentForm } from './StudentForm';
import { ExcelImport } from './ExcelImport';
import { Student } from '@/types';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useToast } from '@/hooks/use-toast';

export const StudentManagement = () => {
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const { toast } = useToast();
  const { data: students = [], isLoading, error } = useStudents();
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  // Check if we should auto-open the form from navigation state
  useEffect(() => {
    if (location.state?.openAddForm) {
      setShowForm(true);
      // Clear the state to prevent reopening on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const classes = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
  const sections = ['A', 'B', 'C', 'D'];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    const matchesSection = selectedSection === 'all' || student.section === selectedSection;
    
    return matchesSearch && matchesClass && matchesSection;
  });

  const handleCreateStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createStudentMutation.mutateAsync(studentData);
      setShowForm(false);
      toast({
        title: "Success",
        description: "Student created successfully",
      });
    } catch (error) {
      console.error('Failed to create student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create student. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkImport = async (students: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (const student of students) {
        try {
          await createStudentMutation.mutateAsync(student);
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${student.name}: ${errorMsg}`);
          console.error(`Failed to import student ${student.name}:`, error);
        }
      }

      setShowExcelImport(false);
      
      if (errorCount === 0) {
        toast({
          title: "Import Successful",
          description: `All ${successCount} students imported successfully`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial Import",
          description: `${successCount} students imported, ${errorCount} failed. Check console for details.`,
          variant: "destructive",
        });
        console.error('Import errors:', errors);
      } else {
        toast({
          title: "Import Failed",
          description: `Failed to import all students. ${errors[0] || 'Please check the file format.'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import students. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingStudent) return;
    
    try {
      await updateStudentMutation.mutateAsync({
        id: editingStudent.id,
        updates: studentData
      });
      setEditingStudent(null);
      setShowForm(false);
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    } catch (error) {
      console.error('Failed to update student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudentMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleView = (student: Student) => {
    setViewingStudent(student);
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Error loading students</h3>
          <p>Please check your database connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">Manage your student records and information</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowExcelImport(true)} 
            variant="outline"
            disabled={createStudentMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button 
            onClick={() => setShowForm(true)} 
            className="bg-educational-blue hover:bg-educational-blue/90"
            disabled={createStudentMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="flex-shrink-0">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search students by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {showExcelImport && (
              <ExcelImport 
                onImport={handleBulkImport}
                isLoading={createStudentMutation.isPending}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="flex-shrink-0">
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-educational-blue mx-auto mb-4"></div>
              <p>Loading students...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table with Independent Scrolling */}
      {!isLoading && filteredStudents.length > 0 && (
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.rollNumber}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.section}</TableCell>
                    <TableCell>{student.guardian || 'N/A'}</TableCell>
                    <TableCell>{student.guardianContact || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(student)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(student)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleteStudentMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {student.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteStudent(student.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {!isLoading && filteredStudents.length === 0 && (
        <Card className="flex-shrink-0">
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No students found</h3>
              <p>Try adjusting your search criteria or add a new student.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Form Modal */}
      {showForm && (
        <StudentForm
          student={editingStudent}
          onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent}
          onCancel={() => {
            setShowForm(false);
            setEditingStudent(null);
          }}
          isLoading={createStudentMutation.isPending || updateStudentMutation.isPending}
        />
      )}

      {/* View Student Details Dialog */}
      <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h3>
                  <p className="text-base">{viewingStudent.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Roll Number</h3>
                  <p className="text-base">{viewingStudent.rollNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Class</h3>
                  <p className="text-base">{viewingStudent.class}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Section</h3>
                  <p className="text-base">{viewingStudent.section}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Registration Date</h3>
                  <p className="text-base">
                    {viewingStudent.registrationDate 
                      ? new Date(viewingStudent.registrationDate).toLocaleDateString()
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Guardian Name</h3>
                  <p className="text-base">{viewingStudent.guardian || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Guardian Contact</h3>
                  <p className="text-base">{viewingStudent.guardianContact || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingStudent(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewingStudent(null);
                  handleEdit(viewingStudent);
                }}>
                  Edit Student
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
