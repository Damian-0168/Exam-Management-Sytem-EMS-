import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Student, Exam, Score, Subject, StudentReport, ClassReport, SubjectAnalytic } from '@/types';
import { calculateGrade } from '@/utils/gradeCalculation';

// Fetch complete student report for an exam
export const useStudentReport = (studentId: string, examId: string) => {
  return useQuery({
    queryKey: ['report', 'student', studentId, examId],
    queryFn: async () => {
      console.log('Fetching student report:', { studentId, examId });

      // Fetch student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Fetch exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;

      // Fetch scores with subject details
      const { data: scoresData, error: scoresError } = await supabase
        .from('scores')
        .select(`
          *,
          subjects (*)
        `)
        .eq('student_id', studentId)
        .eq('exam_id', examId);

      if (scoresError) throw scoresError;

      // Calculate totals
      const totalMarks = scoresData?.reduce((sum, s) => sum + s.max_marks, 0) || 0;
      const obtainedMarks = scoresData?.reduce((sum, s) => sum + Number(s.marks_obtained), 0) || 0;
      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
      const overallGrade = calculateGrade(percentage);

      // Get class position
      const { data: allScores } = await supabase
        .from('scores')
        .select('student_id, marks_obtained')
        .eq('exam_id', examId);

      const studentTotals = new Map<string, number>();
      allScores?.forEach(score => {
        const current = studentTotals.get(score.student_id) || 0;
        studentTotals.set(score.student_id, current + Number(score.marks_obtained));
      });

      const sortedStudents = Array.from(studentTotals.entries())
        .sort((a, b) => b[1] - a[1]);
      
      const position = sortedStudents.findIndex(([id]) => id === studentId) + 1;

      const report: StudentReport = {
        student: {
          id: studentData.id,
          name: studentData.name,
          rollNumber: studentData.roll_number || '',
          class: studentData.class,
          section: studentData.section,
          registrationDate: studentData.registration_date || '',
          guardian: studentData.guardian || '',
          guardianContact: studentData.guardian_contact || '',
          createdAt: studentData.created_at,
          updatedAt: studentData.updated_at
        },
        exam: {
          id: examData.id,
          name: examData.name,
          type: examData.type,
          class: examData.class,
          section: examData.section,
          subjects: [],
          startDate: examData.exam_date,
          endDate: examData.exam_date,
          academicYear: examData.academic_year,
          term: examData.term,
          status: examData.status,
          createdAt: examData.created_at
        },
        scores: scoresData?.map(s => ({
          id: s.id,
          studentId: s.student_id,
          examId: s.exam_id,
          subjectId: s.subject_id,
          marksObtained: Number(s.marks_obtained),
          maxMarks: s.max_marks,
          grade: s.grade || '',
          gpa: Number(s.gpa) || 0,
          remarks: s.remarks || '',
          teacherId: s.teacher_id || '',
          enteredAt: s.entered_at,
          updatedAt: s.updated_at,
          subject: {
            id: s.subjects.id,
            name: s.subjects.name,
            code: s.subjects.code,
            max_marks: s.subjects.max_marks,
            passing_marks: s.subjects.passing_marks,
            description: s.subjects.description || '',
            createdAt: s.subjects.created_at
          }
        })) || [],
        totalMarks,
        obtainedMarks,
        percentage: Math.round(percentage * 100) / 100,
        overallGrade: overallGrade.grade,
        overallGPA: overallGrade.gpa,
        position
      };

      console.log('Student report fetched successfully');
      return report;
    },
    enabled: !!studentId && !!examId
  });
};

// Fetch class report for an exam
export const useClassReport = (examId: string, className: string, section: string) => {
  return useQuery({
    queryKey: ['report', 'class', examId, className, section],
    queryFn: async () => {
      console.log('Fetching class report:', { examId, className, section });

      // Fetch exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;

      // Fetch students in class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class', className)
        .eq('section', section);

      if (studentsError) throw studentsError;

      // Fetch all scores for the exam
      const { data: scoresData, error: scoresError } = await supabase
        .from('scores')
        .select(`
          *,
          subjects (*)
        `)
        .eq('exam_id', examId);

      if (scoresError) throw scoresError;

      // Filter scores for students in this class
      const studentIds = new Set(studentsData?.map(s => s.id) || []);
      const classScores = scoresData?.filter(s => studentIds.has(s.student_id)) || [];

      // Calculate student reports
      const studentReports: StudentReport[] = [];
      
      for (const student of studentsData || []) {
        const studentScores = classScores.filter(s => s.student_id === student.id);
        const totalMarks = studentScores.reduce((sum, s) => sum + s.max_marks, 0);
        const obtainedMarks = studentScores.reduce((sum, s) => sum + Number(s.marks_obtained), 0);
        const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
        const overallGrade = calculateGrade(percentage);

        studentReports.push({
          student: {
            id: student.id,
            name: student.name,
            rollNumber: student.roll_number || '',
            class: student.class,
            section: student.section,
            registrationDate: student.registration_date || '',
            guardian: student.guardian || '',
            guardianContact: student.guardian_contact || '',
            createdAt: student.created_at,
            updatedAt: student.updated_at
          },
          exam: {
            id: examData.id,
            name: examData.name,
            type: examData.type,
            class: examData.class,
            section: examData.section,
            subjects: [],
            startDate: examData.exam_date,
            endDate: examData.exam_date,
            academicYear: examData.academic_year,
            term: examData.term,
            status: examData.status,
            createdAt: examData.created_at
          },
          scores: studentScores.map(s => ({
            id: s.id,
            studentId: s.student_id,
            examId: s.exam_id,
            subjectId: s.subject_id,
            marksObtained: Number(s.marks_obtained),
            maxMarks: s.max_marks,
            grade: s.grade || '',
            gpa: Number(s.gpa) || 0,
            remarks: s.remarks || '',
            teacherId: s.teacher_id || '',
            enteredAt: s.entered_at,
            updatedAt: s.updated_at,
            subject: {
              id: s.subjects.id,
              name: s.subjects.name,
              code: s.subjects.code,
              max_marks: s.subjects.max_marks,
              passing_marks: s.subjects.passing_marks,
              description: s.subjects.description || '',
              createdAt: s.subjects.created_at
            }
          })),
          totalMarks,
          obtainedMarks,
          percentage: Math.round(percentage * 100) / 100,
          overallGrade: overallGrade.grade,
          overallGPA: overallGrade.gpa,
          position: 0 // Will be calculated after sorting
        });
      }

      // Sort by percentage and assign positions
      studentReports.sort((a, b) => b.percentage - a.percentage);
      studentReports.forEach((report, index) => {
        report.position = index + 1;
      });

      // Calculate subject analytics
      const subjectMap = new Map<string, any>();
      classScores.forEach(score => {
        if (!subjectMap.has(score.subject_id)) {
          subjectMap.set(score.subject_id, {
            subject: score.subjects,
            scores: []
          });
        }
        subjectMap.get(score.subject_id).scores.push(score);
      });

      const subjectAnalytics: SubjectAnalytic[] = [];
      
      for (const [subjectId, data] of subjectMap.entries()) {
        const scores = data.scores;
        const averageMarks = scores.reduce((sum: number, s: any) => sum + Number(s.marks_obtained), 0) / scores.length;
        const highestMarks = Math.max(...scores.map((s: any) => Number(s.marks_obtained)));
        const lowestMarks = Math.min(...scores.map((s: any) => Number(s.marks_obtained)));
        const passingMarks = data.subject.passing_marks;
        const passedCount = scores.filter((s: any) => Number(s.marks_obtained) >= passingMarks).length;
        const passRate = (passedCount / scores.length) * 100;

        // Grade distribution
        const gradeDistribution: { [grade: string]: number } = {};
        scores.forEach((s: any) => {
          const grade = s.grade || 'N/A';
          gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
        });

        subjectAnalytics.push({
          subject: {
            id: data.subject.id,
            name: data.subject.name,
            code: data.subject.code,
            max_marks: data.subject.max_marks,
            passing_marks: data.subject.passing_marks,
            description: data.subject.description || '',
            createdAt: data.subject.created_at
          },
          averageMarks: Math.round(averageMarks * 100) / 100,
          highestMarks,
          lowestMarks,
          passRate: Math.round(passRate * 100) / 100,
          gradeDistribution
        });
      }

      // Calculate class statistics
      const allPercentages = studentReports.map(r => r.percentage);
      const classAverage = allPercentages.length > 0 
        ? allPercentages.reduce((sum, p) => sum + p, 0) / allPercentages.length 
        : 0;
      const highestScore = Math.max(...allPercentages, 0);
      const lowestScore = Math.min(...allPercentages, 100);
      const passedStudents = studentReports.filter(r => r.percentage >= 40).length;
      const passRate = studentReports.length > 0 
        ? (passedStudents / studentReports.length) * 100 
        : 0;

      const report: ClassReport = {
        exam: {
          id: examData.id,
          name: examData.name,
          type: examData.type,
          class: examData.class,
          section: examData.section,
          subjects: [],
          startDate: examData.exam_date,
          endDate: examData.exam_date,
          academicYear: examData.academic_year,
          term: examData.term,
          status: examData.status,
          createdAt: examData.created_at
        },
        class: className,
        section: section,
        students: studentReports,
        subjectAnalytics,
        classAverage: Math.round(classAverage * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        lowestScore: Math.round(lowestScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100
      };

      console.log('Class report fetched successfully');
      return report;
    },
    enabled: !!examId && !!className && !!section
  });
};
