
import { Calendar, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExamStore } from '@/store/examStore';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';

export const UpcomingExams = () => {
  const { exams } = useExamStore();
  
  const upcomingExams = exams
    .filter(exam => exam.status === 'upcoming' || exam.status === 'ongoing')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM dd');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (upcomingExams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No upcoming exams</p>
        <Button variant="outline" size="sm" className="mt-2">
          Create New Exam
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {upcomingExams.map((exam) => (
        <div key={exam.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">{exam.name}</h3>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Users className="w-4 h-4 mr-1" />
                <span>Class {exam.class}-{exam.section}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>{getDateLabel(exam.startDate)}</span>
              </div>
            </div>
            <Badge className={getStatusColor(exam.status)}>
              {exam.status}
            </Badge>
          </div>
        </div>
      ))}
      
      <Button variant="outline" className="w-full">
        <Calendar className="w-4 h-4 mr-2" />
        View All Exams
      </Button>
    </div>
  );
};
