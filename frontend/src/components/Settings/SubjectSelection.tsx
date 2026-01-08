import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubjectSelectionProps {
  currentSubjects?: string[];
  isFirstLogin?: boolean;
  onSave?: () => void;
}

export const SubjectSelection = ({ currentSubjects = [], isFirstLogin = false, onSave }: SubjectSelectionProps) => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(currentSubjects);
  const [saving, setSaving] = useState(false);
  const { data: subjects = [], isLoading } = useSubjects();
  const { user } = useTeacherAuth();
  const { toast } = useToast();

  useEffect(() => {
    setSelectedSubjects(currentSubjects);
  }, [currentSubjects]);

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSave = async () => {
    if (selectedSubjects.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one subject',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      const { error: profileError } = await supabase
        .from('teacher_profiles')
        .update({ subjects: selectedSubjects })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { subjects: selectedSubjects }
      });

      if (metadataError) throw metadataError;

      toast({
        title: 'Success',
        description: `${selectedSubjects.length} subject(s) saved successfully`
      });

      if (onSave) onSave();
    } catch (error: any) {
      console.error('Error saving subjects:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save subjects',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isFirstLogin ? 'border-primary shadow-lg' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {isFirstLogin ? 'Select Your Subjects' : 'My Subjects'}
        </CardTitle>
        <CardDescription>
          {isFirstLogin
            ? 'Please select at least one subject to continue. You can change this later in Settings.'
            : 'Select the subjects you teach. This helps organize your exams and scores.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFirstLogin && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> You must select at least one subject to access the system.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => handleToggleSubject(subject.id)}
            >
              <Checkbox
                checked={selectedSubjects.includes(subject.id)}
                onCheckedChange={() => handleToggleSubject(subject.id)}
              />
              <div className="flex-1">
                <p className="font-medium">{subject.name}</p>
                {subject.code && (
                  <p className="text-xs text-muted-foreground">Code: {subject.code}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {subjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subjects available. Please contact your administrator.</p>
          </div>
        )}

        {selectedSubjects.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Selected Subjects ({selectedSubjects.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map((subjectId) => {
                const subject = subjects.find((s) => s.id === subjectId);
                return (
                  <Badge key={subjectId} variant="secondary">
                    {subject?.name || 'Unknown'}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={saving || selectedSubjects.length === 0}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Subjects
            </>
          )}
        </Button>

        {selectedSubjects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Please select at least one subject to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
};
