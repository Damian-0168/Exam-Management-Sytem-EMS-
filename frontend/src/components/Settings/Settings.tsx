import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeacherProfile } from './TeacherProfile';
import { Preferences } from './Preferences';
import { GradeScales } from './GradeScales';
import { AuditLogViewer } from './AuditLogViewer';
import { User, Settings as SettingsIcon, Award, Shield } from 'lucide-react';
import { useIsAdmin } from '@/hooks/usePermissions';

export const Settings = () => {
  const { isAdmin } = useIsAdmin();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your profile, preferences, and system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="grades" className="gap-2">
                <Award className="h-4 w-4" />
                Grade Scales
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="audit" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Audit Logs
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
              <TeacherProfile />
            </TabsContent>
            
            <TabsContent value="preferences" className="mt-6">
              <Preferences />
            </TabsContent>
            
            <TabsContent value="grades" className="mt-6">
              <GradeScales />
            </TabsContent>
            
            {isAdmin && (
              <TabsContent value="audit" className="mt-6">
                <AuditLogViewer />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
