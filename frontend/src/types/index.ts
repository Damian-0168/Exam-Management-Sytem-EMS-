
// Core entity types
export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  registrationDate: string;
  guardian: string;
  guardianContact: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  max_marks: number;
  passing_marks: number;
  description?: string;
  createdAt: string;
}

export interface Exam {
  id: string;
  name: string;
  type: 'test' | 'practical' | 'full-examination';
  class: string;
  section: string;
  subjects: string[]; // subject IDs
  startDate: string;
  endDate: string;
  academicYear: string;
  term: 'first' | 'second';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Score {
  id: string;
  studentId: string;
  examId: string;
  subjectId: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  gpa: number;
  remarks?: string;
  teacherId: string;
  enteredAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[]; // subject IDs
  classes: string[];
  role: 'teacher' | 'head-teacher' | 'admin';
  department: string;
  joinDate: string;
}

// Grading system types
export interface GradeScale {
  id: string;
  name: string;
  grades: GradeRange[];
  isDefault: boolean;
}

export interface GradeRange {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gpa: number;
  description: string;
}

// Report and analytics types
export interface StudentReport {
  student: Student;
  exam: Exam;
  scores: (Score & { subject: Subject })[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  overallGrade: string;
  overallGPA: number;
  position: number;
  attendance?: number;
}

export interface ClassReport {
  exam: Exam;
  class: string;
  section: string;
  students: StudentReport[];
  subjectAnalytics: SubjectAnalytic[];
  classAverage: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
}

export interface SubjectAnalytic {
  subject: Subject;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  passRate: number;
  gradeDistribution: { [grade: string]: number };
}

// Form and UI types
export interface ScoreEntry {
  studentId: string;
  subjectId: string;
  marksObtained: number | '';
  remarks?: string;
}

export interface BulkScoreUpload {
  examId: string;
  subjectId: string;
  scores: {
    rollNumber: string;
    marksObtained: number;
    remarks?: string;
  }[];
}

// Filter and search types
export interface StudentFilter {
  class?: string;
  section?: string;
  search?: string;
}

export interface ExamFilter {
  class?: string;
  section?: string;
  type?: string;
  status?: string;
  academicYear?: string;
  term?: string;
}

// Dashboard analytics types
export interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  upcomingExams: number;
  pendingEvaluations: number;
  classPerformance: {
    class: string;
    averagePercentage: number;
    totalStudents: number;
  }[];
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  type: 'score_entry' | 'exam_created' | 'student_added' | 'report_generated';
  description: string;
  timestamp: string;
  teacherId: string;
  relatedEntityId?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
