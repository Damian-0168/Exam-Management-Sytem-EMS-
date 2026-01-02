
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTeacherAuth } from "./hooks/useTeacherAuth";
import { TeacherAuth } from "./components/Auth/TeacherAuth";
import { DashboardLayout } from "./components/Layout/DashboardLayout";
import { Dashboard } from "./components/Dashboard/Dashboard";
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

  if (!session) {
    return <TeacherAuth />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="exams" element={<ExamEventManagement />} />
        <Route path="exams/" element={<NewExamManagement />} />
        <Route path="exams/events/:id" element={<ExamEventDetail />} />
        <Route path="exams/standalone" element={<StandaloneExams />} />
        <Route path="scores" element={<ScoreEntry />} />
        <Route path="reports" element={<ReportGeneration />} />
        <Route path="settings" element={<Settings />} />
      </Route>
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
