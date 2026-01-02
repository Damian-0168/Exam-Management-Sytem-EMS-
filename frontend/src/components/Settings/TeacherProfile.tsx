import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useTeacherProfile } from '@/hooks/useTeacherProfile';
import { useSchools } from '@/hooks/useSchools';
import { useSubjects } from '@/hooks/useSubjects';
import { Loader2, Save, User, Mail, Calendar, Building } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const TeacherProfile = () => {
  const { user } = useTeacherAuth();
  const { data: teacherProfile, isLoading: profileLoading } = useTeacherProfile(user?.id);
  const { data: schools } = useSchools();
  const { data: subjects } = useSubjects();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);

  const userMetadata = user?.user_metadata || {};
  const teacherName = userMetadata.name || user?.email?.split('@')[0] || 'Teacher';
  const teacherEmail = user?.email || '';
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';

  // Get school name
  const schoolName = schools?.find(school => school.id === teacherProfile?.school_id)?.name || 'Not assigned';

  // Get teacher subjects
  const teacherSubjects = subjects?.filter(subject => 
    userMetadata.subjects?.includes(subject.id)
  ) || [];

  const initials = teacherName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          {profileLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{teacherName}</h2>
                  <p className="text-sm text-muted-foreground">Teacher</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{teacherEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined: {joinDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>School: {schoolName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>ID: {user?.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Subjects</CardTitle>
          <CardDescription>
            Subjects you are authorized to teach
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teacherSubjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teacherSubjects.map(subject => (
                <Badge key={subject.id} variant="secondary" className="text-sm">
                  {subject.name} ({subject.code})
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No subjects assigned yet</p>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your authentication and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user?.id || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={teacherEmail} disabled />
            </div>
            <div className="space-y-2">
              <Label>Account Created</Label>
              <Input value={joinDate} disabled />
            </div>
            <div className="space-y-2">
              <Label>Last Sign In</Label>
              <Input 
                value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'} 
                disabled 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note about profile updates */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> To update your name, subjects, or school assignment, please contact your school administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
