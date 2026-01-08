import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SubjectSelection } from '@/components/Settings/SubjectSelection';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useTeacherProfile } from '@/hooks/useTeacherProfile';

interface FirstLoginModalProps {
  onComplete: () => void;
}

export const FirstLoginModal = ({ onComplete }: FirstLoginModalProps) => {
  const [open, setOpen] = useState(false);
  const { user } = useTeacherAuth();
  const { data: teacherProfile } = useTeacherProfile(user?.id);

  useEffect(() => {
    if (teacherProfile && (!teacherProfile.subjects || teacherProfile.subjects.length === 0)) {
      setOpen(true);
    } else if (teacherProfile && teacherProfile.subjects && teacherProfile.subjects.length > 0) {
      setOpen(false);
    }
  }, [teacherProfile]);

  const handleSave = () => {
    setOpen(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome! 🎉</DialogTitle>
          <DialogDescription>
            Before you start using the system, please select the subjects you teach.
          </DialogDescription>
        </DialogHeader>
        <SubjectSelection
          currentSubjects={teacherProfile?.subjects || []}
          isFirstLogin={true}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
};
