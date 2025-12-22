import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useSubjects } from '@/hooks/useSubjects';
import { useSchools } from '@/hooks/useSchools';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, Plus } from 'lucide-react';

export const TeacherAuth = () => {
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    selectedSubjects: [] as string[],
    schoolId: ''
  });
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNewSchoolDialogOpen, setIsNewSchoolDialogOpen] = useState(false);
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [newSchoolData, setNewSchoolData] = useState({
    name: '',
    code: '',
    address: '',
    contactEmail: '',
    contactPhone: ''
  });

  const { signUp, signIn, loading } = useTeacherAuth();
  const { data: subjects = [] } = useSubjects();
  const { data: schools = [], isLoading: schoolsLoading, refetch: refetchSchools } = useSchools();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }
    
    if (signUpData.selectedSubjects.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one subject",
        variant: "destructive"
      });
      return;
    }

    if (!signUpData.schoolId) {
      toast({
        title: "Error",
        description: "Please select a school",
        variant: "destructive"
      });
      return;
    }

    const result = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.name,
      signUpData.selectedSubjects,
      signUpData.schoolId
    );

    if (result.success) {
      toast({
        title: "Success",
        description: "Teacher account created successfully"
      });
      // Reset form
      setSignUpData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        selectedSubjects: [],
        schoolId: ''
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await signIn(signInData.email, signInData.password);

    if (result.success) {
      toast({
        title: "Success",
        description: "Logged in successfully"
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    setSignUpData(prev => ({
      ...prev,
      selectedSubjects: checked 
        ? [...prev.selectedSubjects, subjectId]
        : prev.selectedSubjects.filter(id => id !== subjectId)
    }));
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSchoolData.name || !newSchoolData.code) {
      toast({
        title: "Error",
        description: "School name and code are required",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingSchool(true);

    try {
      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: newSchoolData.name,
          code: newSchoolData.code,
          address: newSchoolData.address || null,
          contact_email: newSchoolData.contactEmail || null,
          contact_phone: newSchoolData.contactPhone || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "School created successfully"
      });

      // Refresh schools list
      await refetchSchools();

      // Set the newly created school as selected
      setSignUpData(prev => ({ ...prev, schoolId: data.id }));

      // Reset form and close dialog
      setNewSchoolData({
        name: '',
        code: '',
        address: '',
        contactEmail: '',
        contactPhone: ''
      });
      setIsNewSchoolDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create school",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSchool(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Teacher Portal</CardTitle>
          <CardDescription>Sign in or create a new teacher account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? "text" : "password"}
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                    >
                      {showSignInPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? "text" : "password"}
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    >
                      {showSignUpPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signup-school">School *</Label>
                    <Dialog open={isNewSchoolDialogOpen} onOpenChange={setIsNewSchoolDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-8">
                          <Plus className="h-4 w-4 mr-1" />
                          Add New School
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Add New School</DialogTitle>
                          <DialogDescription>
                            Create a new school to add to the system
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSchool} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="school-name">School Name *</Label>
                            <Input
                              id="school-name"
                              value={newSchoolData.name}
                              onChange={(e) => setNewSchoolData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Greenwood High School"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="school-code">School Code *</Label>
                            <Input
                              id="school-code"
                              value={newSchoolData.code}
                              onChange={(e) => setNewSchoolData(prev => ({ ...prev, code: e.target.value }))}
                              placeholder="e.g., GHS001"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="school-address">Address</Label>
                            <Input
                              id="school-address"
                              value={newSchoolData.address}
                              onChange={(e) => setNewSchoolData(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="School address"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="school-email">Contact Email</Label>
                            <Input
                              id="school-email"
                              type="email"
                              value={newSchoolData.contactEmail}
                              onChange={(e) => setNewSchoolData(prev => ({ ...prev, contactEmail: e.target.value }))}
                              placeholder="contact@school.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="school-phone">Contact Phone</Label>
                            <Input
                              id="school-phone"
                              type="tel"
                              value={newSchoolData.contactPhone}
                              onChange={(e) => setNewSchoolData(prev => ({ ...prev, contactPhone: e.target.value }))}
                              placeholder="+1234567890"
                            />
                          </div>
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsNewSchoolDialogOpen(false)}
                              disabled={isCreatingSchool}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isCreatingSchool}>
                              {isCreatingSchool && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Create School
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select 
                    value={signUpData.schoolId} 
                    onValueChange={(value) => setSignUpData(prev => ({ ...prev, schoolId: value }))}
                    disabled={schoolsLoading}
                  >
                    <SelectTrigger id="signup-school">
                      <SelectValue placeholder="Select your school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name} ({school.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Subjects</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={subject.id}
                          checked={signUpData.selectedSubjects.includes(subject.id)}
                          onCheckedChange={(checked) => handleSubjectChange(subject.id, checked as boolean)}
                        />
                        <Label htmlFor={subject.id} className="text-sm">
                          {subject.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};