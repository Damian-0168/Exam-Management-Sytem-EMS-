import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateExamEvent } from '@/hooks/useExamEvents';
import { useClassesSections } from '@/hooks/useClassesSections';
import { Loader2, Plus, Calendar } from 'lucide-react';
import { ExamEventFormData } from '@/types/exams';

export const CreateExamEvent = () => {
  const { toast } = useToast();
  const createEvent = useCreateExamEvent();
  const { data: classesSections } = useClassesSections();

  const [formData, setFormData] = useState<ExamEventFormData>({
    name: '',
    description: '',
    academicYear: new Date().getFullYear().toString(),
    term: 'first',
    class: '',
    section: '',
    startDate: '',
    endDate: '',
    status: 'upcoming'
  });

  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.class || !formData.section || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Missing fields',
        description: 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createEvent.mutateAsync(formData);
      toast({
        title: 'Exam event created',
        description: `${formData.name} has been created successfully`
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        academicYear: new Date().getFullYear().toString(),
        term: 'first',
        class: '',
        section: '',
        startDate: '',
        endDate: '',
        status: 'upcoming'
      });
      setShowForm(false);
    } catch (error: any) {
      toast({
        title: 'Error creating exam event',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Create New Exam Event
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Create Exam Event
        </CardTitle>
        <CardDescription>
          Create a new exam event (Mid Term, Final, etc.) for teachers to upload their subject exams
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Exam Event Name *</Label>
              <Input
                placeholder="e.g., Mid Term Examination 2025"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Input
                placeholder="2025"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Term *</Label>
              <Select value={formData.term} onValueChange={(value: 'first' | 'second') => setFormData({ ...formData, term: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First Term</SelectItem>
                  <SelectItem value="second">Second Term</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value, section: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(classesSections?.map(cs => cs.class_name))).map(className => (
                    <SelectItem key={className} value={className}>{className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section *</Label>
              <Select 
                value={formData.section} 
                onValueChange={(value) => setFormData({ ...formData, section: value })}
                disabled={!formData.class}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {classesSections
                    ?.filter(cs => cs.class_name === formData.class)
                    .map(cs => (
                      <SelectItem key={cs.section} value={cs.section}>{cs.section}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'upcoming' | 'ongoing' | 'completed' | 'cancelled') => 
                  setFormData({ ...formData, status: value })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Additional details about this exam event..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Exam Event'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
