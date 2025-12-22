
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Student } from '@/types';

interface StudentFormProps {
  student?: Student | null;
  onSubmit: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const StudentForm = ({ student, onSubmit, onCancel, isLoading = false }: StudentFormProps) => {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    rollNumber: student?.rollNumber || '',
    class: student?.class || '',
    section: student?.section || '',
    registrationDate: student?.registrationDate || '',
    guardian: student?.guardian || '',
    guardianContact: student?.guardianContact || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const classes = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
  const sections = ['A', 'B', 'C', 'D'];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.class) newErrors.class = 'Class is required';
    if (!formData.section) newErrors.section = 'Section is required';
    
    // Roll number, registration date, guardian, and guardian contact are now optional
    if (formData.guardianContact && !/^\+?[\d\s-()]+$/.test(formData.guardianContact)) {
      newErrors.guardianContact = 'Invalid contact number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && !isLoading) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {student ? 'Edit Student' : 'Add New Student'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    placeholder="e.g., STOO1 (optional)"
                    value={formData.rollNumber}
                    onChange={(e) => handleChange('rollNumber', e.target.value)}
                    className={errors.rollNumber ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.rollNumber && <p className="text-sm text-red-500 mt-1">{errors.rollNumber}</p>}
                </div>

                <div>
                  <Label htmlFor="registrationDate">Registration Date</Label>
                  <Input
                    id="registrationDate"
                    type="date"
                    value={formData.registrationDate}
                    onChange={(e) => handleChange('registrationDate', e.target.value)}
                    className={errors.registrationDate ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.registrationDate && <p className="text-sm text-red-500 mt-1">{errors.registrationDate}</p>}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Academic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Class *</Label>
                  <Select 
                    value={formData.class} 
                    onValueChange={(value) => handleChange('class', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={errors.class ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.class && <p className="text-sm text-red-500 mt-1">{errors.class}</p>}
                </div>

                <div>
                  <Label>Section *</Label>
                  <Select 
                    value={formData.section} 
                    onValueChange={(value) => handleChange('section', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={errors.section ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map(section => (
                        <SelectItem key={section} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.section && <p className="text-sm text-red-500 mt-1">{errors.section}</p>}
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Guardian Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guardian">Guardian Name</Label>
                  <Input
                    id="guardian"
                    placeholder="Optional"
                    value={formData.guardian}
                    onChange={(e) => handleChange('guardian', e.target.value)}
                    className={errors.guardian ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.guardian && <p className="text-sm text-red-500 mt-1">{errors.guardian}</p>}
                </div>

                <div>
                  <Label htmlFor="guardianContact">Guardian Contact</Label>
                  <Input
                    id="guardianContact"
                    placeholder="Optional"
                    value={formData.guardianContact}
                    onChange={(e) => handleChange('guardianContact', e.target.value)}
                    className={errors.guardianContact ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.guardianContact && <p className="text-sm text-red-500 mt-1">{errors.guardianContact}</p>}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-educational-blue hover:bg-educational-blue/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {student ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  student ? 'Update Student' : 'Add Student'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
