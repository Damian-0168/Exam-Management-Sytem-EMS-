import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Calendar,
  Plus,
  Settings,
  BarChart3,
  Clock,
  User,
  Activity,
  School,
  UserCog,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalExamEvents: number;
  totalTests: number;
  totalPracticals: number;
}

interface RecentActivity {
  id: string;
  action: string;
  description: string;
  user_name: string;
  timestamp: string;
}

interface Teacher {
  id: string;
  name: string;
  department: string | null;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useTeacherAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalExamEvents: 0,
    totalTests: 0,
    totalPracticals: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get admin profile and school info
      const { data: profile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('name, school_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      // Use user metadata as fallback
      const userName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Admin';
      setAdminName(userName);

      const schoolId = profile?.school_id || user.user_metadata?.school_id;

      if (schoolId) {
        // Get school name
        const { data: school } = await supabase
          .from('schools')
          .select('name')
          .eq('id', schoolId)
          .single();
        
        if (school) setSchoolName(school.name);

        // Get students count for this school
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId);

        // Get teachers count for this school
        const { data: teachersList, count: teachersCount } = await supabase
          .from('teacher_profiles')
          .select('id, name, department', { count: 'exact' })
          .eq('school_id', schoolId);

        if (teachersList) {
          setTeachers(teachersList as Teacher[]);
        }

        // Get exam events count
        const { count: examEventsCount } = await supabase
          .from('exam_events')
          .select('*', { count: 'exact', head: true });

        // Get exams by type
        const { data: exams } = await supabase
          .from('exams')
          .select('type');

        const testsCount = exams?.filter(e => e.type === 'test').length || 0;
        const practicalsCount = exams?.filter(e => e.type === 'practical').length || 0;

        setStats({
          totalStudents: studentsCount || 0,
          totalTeachers: teachersCount || 0,
          totalExamEvents: examEventsCount || 0,
          totalTests: testsCount,
          totalPracticals: practicalsCount
        });
      } else {
        // No school assigned - show empty stats
        console.warn('No school_id found for admin user');
      }

      // Mock recent activities (in production, this would come from audit_logs)
      setRecentActivities([
        {
          id: '1',
          action: 'EXAM_CREATED',
          description: 'New exam event created: Midterm Examination',
          user_name: 'Teacher A',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          action: 'STUDENT_ADDED',
          description: '5 new students added to Class 10A',
          user_name: 'Admin',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          action: 'SCORES_UPLOADED',
          description: 'Mathematics scores uploaded for Class 9B',
          user_name: 'Teacher B',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          action: 'REPORT_GENERATED',
          description: 'Progress reports generated for 45 students',
          user_name: 'Admin',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Exam Events',
      value: stats.totalExamEvents,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Tests',
      value: stats.totalTests,
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      title: 'Practicals',
      value: stats.totalPracticals,
      icon: BookOpen,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    }
  ];

  const quickActions = [
    {
      title: 'Create Exam Event',
      description: 'Schedule a new examination event',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => navigate('/admin/exams')
    },
    {
      title: 'Add Teacher',
      description: 'Register a new teacher',
      icon: User,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => navigate('/admin/teachers')
    },
    {
      title: 'Add Students',
      description: 'Add students manually or in bulk',
      icon: Users,
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => navigate('/admin/students')
    },
    {
      title: 'View Reports',
      description: 'Generate and view reports',
      icon: BarChart3,
      color: 'bg-amber-600 hover:bg-amber-700',
      onClick: () => navigate('/admin/reports')
    },
    {
      title: 'Settings',
      description: 'Configure school settings',
      icon: Settings,
      color: 'bg-slate-600 hover:bg-slate-700',
      onClick: () => navigate('/admin/settings')
    }
  ];

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'EXAM_CREATED':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'STUDENT_ADDED':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'SCORES_UPLOADED':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'REPORT_GENERATED':
        return <BarChart3 className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleSwitchToTeacher = (teacherId: string) => {
    if (!teacherId) return;
    // Store original admin info and switch to teacher view
    localStorage.setItem('adminImpersonating', JSON.stringify({
      adminId: user?.id,
      adminName: adminName,
      teacherId: teacherId
    }));
    // Navigate to teacher dashboard with the selected teacher context
    navigate(`/teacher/dashboard?viewAs=${teacherId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="admin-dashboard">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {adminName}!
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <School className="w-4 h-4 text-gray-500" />
            <Badge variant="outline" className="bg-white border-blue-300 text-blue-700 font-medium px-3">
              {schoolName || 'No School Assigned'}
            </Badge>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Admin</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Switch to Teacher View */}
          {teachers.length > 0 && (
            <div className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-gray-500" />
              <Select value={selectedTeacher} onValueChange={handleSwitchToTeacher}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="View as Teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className={`border ${stat.borderColor} transition-all hover:shadow-md`}
            data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.user_name}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-center text-gray-500 py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                className={`w-full justify-start ${action.color} text-white`}
                onClick={action.onClick}
                data-testid={`quick-action-${action.title.toLowerCase().replace(' ', '-')}`}
              >
                <action.icon className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-xs opacity-80">{action.description}</p>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800">Examinations</h4>
              <p className="text-sm text-blue-600 mt-1">
                {stats.totalExamEvents} active exam events with {stats.totalTests} tests and {stats.totalPracticals} practicals
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800">Staff</h4>
              <p className="text-sm text-green-600 mt-1">
                {stats.totalTeachers} registered teachers in your school
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800">Students</h4>
              <p className="text-sm text-purple-600 mt-1">
                {stats.totalStudents} enrolled students across all classes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
