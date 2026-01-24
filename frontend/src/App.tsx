
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTeacherAuth } from "./hooks/useTeacherAuth";
import { TeacherAuth } from "./components/Auth/TeacherAuth";
import { AdminSetup } from "./components/Auth/AdminSetup";
import { AdminLogin } from "./components/Auth/AdminLogin";
import { FirstLoginModal } from "./components/Auth/FirstLoginModal";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { DashboardLayout } from "./components/Layout/DashboardLayout";
import { AdminLayout } from "./components/Layout/AdminLayout";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { AdminDashboard } from "./components/Admin/AdminDashboard";
import { StudentManagement } from "./components/Students/StudentManagement";
import { NewExamManagement } from "./components/Exams/NewExamManagement";
import { ScoreEntry } from "./components/Scores/ScoreEntry";
import { ReportGeneration } from "./components/Reports/ReportGeneration";
import { Settings } from "./components/Settings/Settings";
import { ExamEventManagement } from "./components/Exams/ExamEventManagement";
import { ExamEventDetail } from "./components/Exams/ExamEventDetail";
import { StandaloneExams } from "./components/Exams/StandaloneExams";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { session, loading } = useTeacherAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!session ? <TeacherAuth /> : <Navigate to="/teacher/dashboard" />} />
      <Route path="/admin-setup" element={<AdminSetup />} />
      <Route path="/admin/login" element={!session ? <AdminLogin /> : <Navigate to="/admin/dashboard" />} />

      {/* Teacher Routes */}
      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin', 'super-admin']}>
          <FirstLoginModal onComplete={() => {}} />
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/teacher/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="exams" element={<ExamEventManagement />} />
        <Route path="exams/new" element={<NewExamManagement />} />
        <Route path="exams/events/:id" element={<ExamEventDetail />} />
        <Route path="exams/standalone" element={<StandaloneExams />} />
        <Route path="scores" element={<ScoreEntry />} />
        <Route path="reports" element={<ReportGeneration />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="teachers" element={<StudentManagement />} /> {/* Will create proper component later */}
        <Route path="exams" element={<ExamEventManagement />} />
        <Route path="exams/events/:id" element={<ExamEventDetail />} />
        <Route path="reports" element={<ReportGeneration />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Super Admin Routes (Future) */}
      <Route path="/super-admin" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/super-admin/dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Legacy routes - redirect to new structure */}
      <Route path="/students" element={<Navigate to="/teacher/students" />} />
      <Route path="/exams" element={<Navigate to="/teacher/exams" />} />
      <Route path="/scores" element={<Navigate to="/teacher/scores" />} />
      <Route path="/reports" element={<Navigate to="/teacher/reports" />} />
      <Route path="/settings" element={<Navigate to="/teacher/settings" />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
