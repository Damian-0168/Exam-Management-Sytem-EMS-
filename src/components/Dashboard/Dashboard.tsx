import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Calendar,
  Award,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useExamStore } from '@/store/examStore';
import { PerformanceChart } from './PerformanceChart';
import { RecentActivity } from './RecentActivity';
import { UpcomingExams } from './UpcomingExams';
import { useStudents } from '@/hooks/useStudents';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeacherProfile } from '@/hooks/useTeacherProfile';
import { useSchools } from '@/hooks/useSchools';

export const Dashboard = () => {
  const navigate = useNavigate();
  
  const { 
    dashboardStats, 
    setDashboardStats, 
    students, 
    exams, 
    scores,
    currentTeacher,
    setCurrentTeacher
  } = useExamStore();

  // Fetch real data from database
  const { data: dbStudents, isLoading: studentsLoading } = useStudents();
  const { user } = useTeacherAuth();
  const { data: subjects } = useSubjects();
  const { data: teacherProfile } = useTeacherProfile(user?.id);
  const { data: schools } = useSchools();
  
  // Get the school name based on teacher's school_id
  const schoolName = schools?.find(school => school.id === teacherProfile?.school_id)?.name;

  useEffect(() => {
    // Set current teacher from auth user
    if (user && !currentTeacher) {
      const userMetadata = user.user_metadata;
      const teacherSubjects = userMetadata?.subjects || [];
      
      // Get subject names from the subjects array
      const subjectNames = subjects
        ?.filter(s => teacherSubjects.includes(s.id))
        .map(s => s.name)
        .join(', ') || 'No subjects assigned';

      setCurrentTeacher({
        id: user.id,
        name: userMetadata?.name || user.email || 'Teacher',
        email: user.email || '',
        subjects: teacherSubjects,
        classes: [],
        role: 'teacher',
        department: subjectNames,
        joinDate: new Date(user.created_at).toISOString().split('T')[0]
      });
    }
  }, [user, subjects, currentTeacher, setCurrentTeacher]);

  useEffect(() => {
    // Use real student count from database
    const studentCount = dbStudents?.length || 0;

    // Calculate dashboard stats
    const upcomingExams = exams.filter(exam => exam.status === 'upcoming').length;
    const pendingEvaluations = exams.filter(exam => exam.status === 'completed').length * 5 - scores.length;
    
    const classPerformance = ['10A', '10B', '11A'].map(className => {
      const classStudents = students.filter(s => s.class === className);
      const classScores = scores.filter(score => 
        classStudents.some(student => student.id === score.studentId)
      );
      
      let averagePercentage = 0;
      if (classScores.length > 0) {
        const totalPercentage = classScores.reduce((sum, score) => 
          sum + (score.marksObtained / score.maxMarks * 100), 0
        );
        averagePercentage = totalPercentage / classScores.length;
      }
      
      return {
        class: className,
        averagePercentage: Math.round(averagePercentage),
        totalStudents: classStudents.length
      };
    });

    const recentActivity = [
      {
        id: '1',
        type: 'score_entry' as const,
        description: 'Mathematics scores entered for Class 10A',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        teacherId: '1'
      },
      {
        id: '2',
        type: 'exam_created' as const,
        description: 'Created Midterm Exam for Class 11A',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        teacherId: '1'
      },
      {
        id: '3',
        type: 'report_generated' as const,
        description: 'Generated progress reports for 25 students',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        teacherId: '1'
      }
    ];

    setDashboardStats({
      totalStudents: studentCount,
      totalExams: exams.length,
      upcomingExams,
      pendingEvaluations: Math.max(0, pendingEvaluations),
      classPerformance,
      recentActivity
    });
  }, [dbStudents, students, exams, scores, currentTeacher, setCurrentTeacher, setDashboardStats]);

  const handleAddStudent = () => {
    navigate('/students', { state: { openAddForm: true } });
  };

  const statCards = [
    {
      title: 'Total Students',
      value: dashboardStats?.totalStudents || 0,
      icon: Users,
      color: 'text-educational-blue',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Exams',
      value: dashboardStats?.totalExams || 0,
      icon: BookOpen,
      color: 'text-educational-green',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Upcoming Exams',
      value: dashboardStats?.upcomingExams || 0,
      icon: Calendar,
      color: 'text-educational-amber',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Pending Evaluations',
      value: dashboardStats?.pendingEvaluations || 0,
      icon: Clock,
      color: 'text-educational-red',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {currentTeacher?.name || 'Teacher'}!
          {schoolName && (
            <span className="text-xl font-normal text-gray-600 ml-2">
              - {schoolName}
            </span>
          )}
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your classes today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-educational-blue" />
              Class Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={dashboardStats?.classPerformance || []} />
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-educational-green" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingExams />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-educational-purple" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity activities={dashboardStats?.recentActivity || []} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-educational-amber" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Enter New Scores
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Create New Exam
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={handleAddStudent}
            >
              <Users className="w-4 h-4 mr-2" />
              Add New Student
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Details */}
      {dashboardStats?.classPerformance && (
        <Card>
          <CardHeader>
            <CardTitle>Class Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.classPerformance.map((classData) => (
                <div key={classData.class} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-educational-blue rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Class {classData.class}</h3>
                      <p className="text-sm text-gray-600">{classData.totalStudents} students</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Progress value={classData.averagePercentage} className="w-24" />
                      <span className="text-lg font-bold text-gray-900">{classData.averagePercentage}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Average Performance</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
