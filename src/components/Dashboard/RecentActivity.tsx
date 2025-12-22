
import { formatDistanceToNow } from 'date-fns';
import { FileText, BookOpen, Users, BarChart3, Clock } from 'lucide-react';
import { ActivityLog } from '@/types';

interface RecentActivityProps {
  activities: ActivityLog[];
}

const activityIcons = {
  score_entry: FileText,
  exam_created: BookOpen,
  student_added: Users,
  report_generated: BarChart3
};

const activityColors = {
  score_entry: 'text-blue-600 bg-blue-50',
  exam_created: 'text-green-600 bg-green-50',
  student_added: 'text-purple-600 bg-purple-50',
  report_generated: 'text-amber-600 bg-amber-50'
};

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type];
        const colorClasses = activityColors[activity.type];
        
        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${colorClasses}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
