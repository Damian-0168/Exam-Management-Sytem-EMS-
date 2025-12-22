
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Student, Subject, Exam, Score, Teacher, GradeScale, StudentFilter, ExamFilter, DashboardStats } from '@/types';

interface ExamStore {
  // State
  students: Student[];
  subjects: Subject[];
  exams: Exam[];
  scores: Score[];
  teachers: Teacher[];
  gradeScales: GradeScale[];
  currentTeacher: Teacher | null;
  dashboardStats: DashboardStats | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedExam: Exam | null;
  selectedClass: string;
  selectedSection: string;
  studentFilter: StudentFilter;
  examFilter: ExamFilter;

  // Actions
  setStudents: (students: Student[]) => void;
  setSubjects: (subjects: Subject[]) => void;
  setExams: (exams: Exam[]) => void;
  setScores: (scores: Score[]) => void;
  setCurrentTeacher: (teacher: Teacher) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  
  // CRUD operations
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  
  addExam: (exam: Exam) => void;
  updateExam: (id: string, exam: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  
  addScore: (score: Score) => void;
  updateScore: (id: string, score: Partial<Score>) => void;
  bulkUpdateScores: (scores: Score[]) => void;
  
  // Filters and selections
  setSelectedExam: (exam: Exam | null) => void;
  setSelectedClass: (className: string) => void;
  setSelectedSection: (section: string) => void;
  setStudentFilter: (filter: StudentFilter) => void;
  setExamFilter: (filter: ExamFilter) => void;
  
  // Computed values
  getFilteredStudents: () => Student[];
  getFilteredExams: () => Exam[];
  getStudentScores: (studentId: string, examId: string) => Score[];
  getSubjectAverage: (subjectId: string, examId: string) => number;
  getClassAverage: (examId: string, className: string, section: string) => number;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

// Default grade scale
const defaultGradeScale: GradeScale = {
  id: 'default',
  name: 'Standard Grading',
  isDefault: true,
  grades: [
    { grade: 'A+', minPercentage: 90, maxPercentage: 100, gpa: 4.0, description: 'Outstanding' },
    { grade: 'A', minPercentage: 80, maxPercentage: 89, gpa: 3.5, description: 'Excellent' },
    { grade: 'B+', minPercentage: 70, maxPercentage: 79, gpa: 3.0, description: 'Very Good' },
    { grade: 'B', minPercentage: 60, maxPercentage: 69, gpa: 2.5, description: 'Good' },
    { grade: 'C+', minPercentage: 50, maxPercentage: 59, gpa: 2.0, description: 'Satisfactory' },
    { grade: 'C', minPercentage: 40, maxPercentage: 49, gpa: 1.5, description: 'Needs Improvement' },
    { grade: 'F', minPercentage: 0, maxPercentage: 39, gpa: 0.0, description: 'Fail' }
  ]
};

export const useExamStore = create<ExamStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      students: [],
      subjects: [
        { id: '1', name: 'Mathematics', code: 'MATH', maxMarks: 100, passingMarks: 40, createdAt: new Date().toISOString() },
        { id: '2', name: 'English', code: 'ENG', maxMarks: 100, passingMarks: 40, createdAt: new Date().toISOString() },
        { id: '3', name: 'Science', code: 'SCI', maxMarks: 100, passingMarks: 40, createdAt: new Date().toISOString() },
        { id: '4', name: 'Social Studies', code: 'SS', maxMarks: 100, passingMarks: 40, createdAt: new Date().toISOString() },
        { id: '5', name: 'Computer Science', code: 'CS', maxMarks: 100, passingMarks: 40, createdAt: new Date().toISOString() }
      ],
      exams: [],
      scores: [],
      teachers: [],
      gradeScales: [defaultGradeScale],
      currentTeacher: null,
      dashboardStats: null,
      
      // UI State
      loading: false,
      error: null,
      selectedExam: null,
      selectedClass: '',
      selectedSection: '',
      studentFilter: {},
      examFilter: {},

      // Actions
      setStudents: (students) => set({ students }),
      setSubjects: (subjects) => set({ subjects }),
      setExams: (exams) => set({ exams }),
      setScores: (scores) => set({ scores }),
      setCurrentTeacher: (teacher) => set({ currentTeacher: teacher }),
      setDashboardStats: (stats) => set({ dashboardStats: stats }),
      
      // CRUD operations
      addStudent: (student) => set((state) => ({ 
        students: [...state.students, student] 
      })),
      
      updateStudent: (id, updates) => set((state) => ({
        students: state.students.map(student => 
          student.id === id ? { ...student, ...updates } : student
        )
      })),
      
      deleteStudent: (id) => set((state) => ({
        students: state.students.filter(student => student.id !== id)
      })),
      
      addExam: (exam) => set((state) => ({ 
        exams: [...state.exams, exam] 
      })),
      
      updateExam: (id, updates) => set((state) => ({
        exams: state.exams.map(exam => 
          exam.id === id ? { ...exam, ...updates } : exam
        )
      })),
      
      deleteExam: (id) => set((state) => ({
        exams: state.exams.filter(exam => exam.id !== id)
      })),
      
      addScore: (score) => set((state) => ({ 
        scores: [...state.scores, score] 
      })),
      
      updateScore: (id, updates) => set((state) => ({
        scores: state.scores.map(score => 
          score.id === id ? { ...score, ...updates } : score
        )
      })),
      
      bulkUpdateScores: (newScores) => set((state) => {
        const existingScoreIds = new Set(state.scores.map(s => s.id));
        const updatedScores = [...state.scores];
        
        newScores.forEach(newScore => {
          if (existingScoreIds.has(newScore.id)) {
            const index = updatedScores.findIndex(s => s.id === newScore.id);
            updatedScores[index] = newScore;
          } else {
            updatedScores.push(newScore);
          }
        });
        
        return { scores: updatedScores };
      }),
      
      // Selections and filters
      setSelectedExam: (exam) => set({ selectedExam: exam }),
      setSelectedClass: (className) => set({ selectedClass: className }),
      setSelectedSection: (section) => set({ selectedSection: section }),
      setStudentFilter: (filter) => set({ studentFilter: filter }),
      setExamFilter: (filter) => set({ examFilter: filter }),
      
      // Computed values
      getFilteredStudents: () => {
        const { students, studentFilter } = get();
        return students.filter(student => {
          if (studentFilter.class && student.class !== studentFilter.class) return false;
          if (studentFilter.section && student.section !== studentFilter.section) return false;
          if (studentFilter.search) {
            const search = studentFilter.search.toLowerCase();
            return student.name.toLowerCase().includes(search) || 
                   student.rollNumber.toLowerCase().includes(search);
          }
          return true;
        });
      },
      
      getFilteredExams: () => {
        const { exams, examFilter } = get();
        return exams.filter(exam => {
          if (examFilter.class && exam.class !== examFilter.class) return false;
          if (examFilter.section && exam.section !== examFilter.section) return false;
          if (examFilter.type && exam.type !== examFilter.type) return false;
          if (examFilter.status && exam.status !== examFilter.status) return false;
          if (examFilter.academicYear && exam.academicYear !== examFilter.academicYear) return false;
          if (examFilter.term && exam.term !== examFilter.term) return false;
          return true;
        });
      },
      
      getStudentScores: (studentId, examId) => {
        const { scores } = get();
        return scores.filter(score => score.studentId === studentId && score.examId === examId);
      },
      
      getSubjectAverage: (subjectId, examId) => {
        const { scores } = get();
        const subjectScores = scores.filter(score => 
          score.subjectId === subjectId && score.examId === examId
        );
        if (subjectScores.length === 0) return 0;
        const total = subjectScores.reduce((sum, score) => sum + score.marksObtained, 0);
        return total / subjectScores.length;
      },
      
      getClassAverage: (examId, className, section) => {
        const { scores, students } = get();
        const classStudents = students.filter(student => 
          student.class === className && student.section === section
        );
        const classStudentIds = new Set(classStudents.map(s => s.id));
        const classScores = scores.filter(score => 
          score.examId === examId && classStudentIds.has(score.studentId)
        );
        
        if (classScores.length === 0) return 0;
        const total = classScores.reduce((sum, score) => sum + (score.marksObtained / score.maxMarks * 100), 0);
        return total / classScores.length;
      },
      
  // Utility actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  resetStore: () => set({
    currentTeacher: null,
    dashboardStats: null,
    students: [],
    exams: [],
    scores: []
  })
    }),
    { name: 'exam-store' }
  )
);
