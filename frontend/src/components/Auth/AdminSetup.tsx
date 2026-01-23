import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User, Mail, Lock, Building, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateSchoolCode } from '@/utils/schoolCodeGenerator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SchoolSelector } from './SchoolSelector';

export const AdminSetup = () => {
  const [mode, setMode] = useState<'new-school' | 'existing-school'>('new-school');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    schoolName: '',
    schoolAddress: '',
    schoolId: '',
    department: 'Administration'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (mode === 'new-school') {
      if (!formData.schoolName || formData.schoolName.trim().length < 3) {
        newErrors.schoolName = 'School name must be at least 3 characters';
      }
    } else {
      if (!formData.schoolId) {
        newErrors.schoolId = 'Please select a school';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      let schoolId = formData.schoolId;
      let schoolCode = '';

      // Step 1: Handle school creation/selection
      if (mode === 'new-school') {
        schoolCode = generateSchoolCode(formData.schoolName);

        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: formData.schoolName.trim(),
            code: schoolCode,
            address: formData.schoolAddress.trim() || null,
            contact_email: formData.email
          })
          .select()
          .single();

        if (schoolError) {
          if (schoolError.code === '23505') {
            throw new Error('A school with similar name already exists.');
          }
          throw schoolError;
        }

        schoolId = schoolData.id;
      }

      // Step 2: Check if user already exists
      const { data: existingProfile } = await supabase
        .from('teacher_profiles')
        .select('id, email, role')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingProfile) {
        // User exists - update to admin role
        if (existingProfile.role === 'admin') {
          throw new Error('This user is already an admin.');
        }

        // Update existing user to admin
        const { error: updateError } = await supabase
          .from('teacher_profiles')
          .update({
            role: 'admin',
            school_id: schoolId,
            department: formData.department
          })
          .eq('id', existingProfile.id);

        if (updateError) throw updateError;

        // Update user metadata
        const { error: metaError } = await supabase.auth.updateUser({
          data: { role: 'admin', school_id: schoolId }
        });

        if (metaError) throw metaError;

        toast({
          title: 'Success!',
          description: 'User has been promoted to Admin. Please login with your existing credentials.'
        });

        setTimeout(() => navigate('/'), 2000);
        return;
      }

      // Step 3: Create new auth user (only if doesn't exist)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: 'admin',
            school_id: schoolId
          }
        }
      });

      if (authError) {
        // Check if it's a "user already exists" error
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          throw new Error('This email is already registered. Please login or use a different email.');
        }
        throw authError;
      }

      // Step 4: Create teacher profile with admin role
      const { error: profileError } = await supabase
        .from('teacher_profiles')
        .insert({
          id: authData.user?.id,
          school_id: schoolId,
          name: formData.name,
          email: formData.email,
          department: formData.department,
          role: 'admin',
          subjects: []
        });

      if (profileError) throw profileError;

      const message = mode === 'new-school' 
        ? `Admin account created! School Code: ${schoolCode}. Please check your email to verify.`
        : 'Admin account created! Please check your email to verify.';

      toast({
        title: 'Success!',
        description: message
      });

      setTimeout(() => navigate('/'), 3000);

    } catch (error: any) {
      console.error('Admin setup error:', error);
      
      let errorMessage = error.message || 'Failed to create admin account';
      
      if (error.message?.includes('role')) {
        errorMessage = '⚠️ Database migration required! Please run the migration first. See MIGRATION_INSTRUCTIONS.md';
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return null;

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: 'text-red-500' };
    if (strength <= 3) return { label: 'Medium', color: 'text-yellow-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength();
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Admin Setup</CardTitle>
          <CardDescription>
            Create or promote an administrator account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> If the email is already registered, the existing account will be promoted to Admin. Otherwise, a new account will be created.
            </AlertDescription>
          </Alert>

          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new-school" className="gap-2">
                <Plus className="h-4 w-4" />
                New School
              </TabsTrigger>
              <TabsTrigger value="existing-school" className="gap-2">
                <Building className="h-4 w-4" />
                Existing School
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-school" className="space-y-2 mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>First Admin?</strong> Create a new school and become its administrator.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="existing-school" className="space-y-2 mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Additional Admin?</strong> Select your existing school.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'new-school' ? (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  New School Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName"
                    type="text"
                    placeholder="Enter your school name"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className={errors.schoolName ? 'border-destructive' : ''}
                  />
                  {errors.schoolName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.schoolName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">School Address (Optional)</Label>
                  <Input
                    id="schoolAddress"
                    type="text"
                    placeholder="Enter school address"
                    value={formData.schoolAddress}
                    onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Select Your School
                </h3>

                <SchoolSelector
                  value={formData.schoolId}
                  onChange={(schoolId) => {
                    setFormData({ ...formData, schoolId });
                    setErrors({ ...errors, schoolId: '' });
                  }}
                  error={errors.schoolId}
                />
              </div>
            )}

            <div className="bg-green-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Administrator Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  If this email exists, the account will be promoted to Admin
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {passwordStrength && (
                  <p className={`text-sm ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.label}
                  </p>
                )}
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Required only for new accounts
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {passwordsMatch && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Passwords match
                  </p>
                )}
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Create/Promote Admin Account'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
