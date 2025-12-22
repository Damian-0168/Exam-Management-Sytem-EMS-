// Exam Event (Container for full examinations)
export interface ExamEvent {
  id: string;
  name: string;
  description?: string;
  academicYear: string;
  term: 'first' | 'second';
  class: string;
  section: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  schoolId: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Subject Exam (Individual teacher upload)
export interface SubjectExam {
  id: string;
  examEventId?: string; // null for tests/practicals
  subjectId: string;
  teacherId: string;
  examType: 'full-examination' | 'test' | 'practical';
  examName: string;
  examDate: string;
  durationMinutes?: number;
  maxMarks: number;
  passingMarks: number;
  instructions?: string;
  pdfFilePath?: string;
  status: 'draft' | 'published' | 'completed';
  class: string;
  section: string;
  academicYear: string;
  term: 'first' | 'second';
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

// Extended types with relations
export interface ExamEventWithExams extends ExamEvent {
  subjectExams: (SubjectExam & {
    subject: {
      id: string;
      name: string;
      code: string;
    };
    teacher: {
      id: string;
      name: string;
      email: string;
    };
  })[];
}

export interface SubjectExamWithDetails extends SubjectExam {
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  examEvent?: ExamEvent;
}

// Form types
export interface ExamEventFormData {
  name: string;
  description?: string;
  academicYear: string;
  term: 'first' | 'second';
  class: string;
  section: string;
  startDate: string;
  endDate: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface SubjectExamFormData {
  examEventId?: string;
  subjectId: string;
  examType: 'full-examination' | 'test' | 'practical';
  examName: string;
  examDate: string;
  durationMinutes?: number;
  maxMarks: number;
  passingMarks: number;
  instructions?: string;
  pdfFile?: File;
  status?: 'draft' | 'published' | 'completed';
  class: string;
  section: string;
  academicYear: string;
  term: 'first' | 'second';
}
