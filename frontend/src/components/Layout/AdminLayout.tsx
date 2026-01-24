import { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  User,
  Shield,
  School,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Teachers', href: '/admin/teachers', icon: UserCheck },
  { name: 'Exam Events', href: '/admin/exams', icon: BookOpen },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useTeacherAuth();

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard' || location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const adminName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 shadow-xl transition-all duration-300 flex flex-col h-full shrink-0`}>
        {/* Logo and Toggle */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-white">SEAMS</h1>
                  <p className="text-xs text-slate-400">Admin Portal</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center ${sidebarOpen ? 'px-3' : 'px-2 justify-center'} py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={!sidebarOpen ? item.name : undefined}
            >
              <item.icon className={`${sidebarOpen ? 'w-5 h-5 mr-3' : 'w-6 h-6'}`} />
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Admin Profile */}
        <div className="p-3 border-t border-slate-700 mt-auto">
          {sidebarOpen ? (
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{adminName}</p>
                <div className="flex items-center gap-1">
                  <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0">Admin</Badge>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut} 
                className="shrink-0 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut} 
                title="Logout"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <LogOut className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search students, teachers, exams..."
                  className="pl-10 w-80 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative text-slate-600">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* Role Badge */}
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Shield className="w-3 h-3 mr-1" />
                Administrator
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
