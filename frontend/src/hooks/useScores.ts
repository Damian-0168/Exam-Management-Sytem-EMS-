import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Score } from '@/types';
import { useTeacherAuth } from './useTeacherAuth';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { calculateGrade } from '@/utils/gradeCalculation';

type DatabaseScore = Tables<'scores'>;
type DatabaseScoreInsert = TablesInsert<'scores'>;
type DatabaseScoreUpdate = TablesUpdate<'scores'>;

// Transform database score to app score format
const transformDatabaseScore = (dbScore: DatabaseScore): Score => ({
  id: dbScore.id,
  studentId: dbScore.student_id,
  examId: dbScore.exam_id,
  subjectId: dbScore.subject_id,
  marksObtained: Number(dbScore.marks_obtained),
  maxMarks: dbScore.max_marks,
  grade: dbScore.grade || '',
  gpa: Number(dbScore.gpa) || 0,
  remarks: dbScore.remarks || '',
  teacherId: dbScore.teacher_id || '',
  enteredAt: dbScore.entered_at,
  updatedAt: dbScore.updated_at
});

// Transform app score to database format for insert
const transformToInsert = (score: Omit<Score, 'id' | 'enteredAt' | 'updatedAt'>, teacherId: string): DatabaseScoreInsert => {
  const percentage = (score.marksObtained / score.maxMarks) * 100;
  const gradeInfo = calculateGrade(percentage);
  
  return {
    student_id: score.studentId,
    exam_id: score.examId,
    subject_id: score.subjectId,
    marks_obtained: score.marksObtained,
    max_marks: score.maxMarks,
    grade: gradeInfo.grade,
    gpa: gradeInfo.gpa,
    remarks: score.remarks || null,
    teacher_id: teacherId
  };
};

// Fetch all scores
export const useScores = () => {
  return useQuery({
    queryKey: ['scores'],
    queryFn: async () => {
      console.log('Fetching scores from Supabase...');
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('entered_at', { ascending: false });

      if (error) {
        console.error('Error fetching scores:', error);
        throw error;
      }

      console.log('Scores fetched successfully:', data?.length || 0);
      return data ? data.map(transformDatabaseScore) : [];
    }
  });
};

// Fetch scores by exam
export const useScoresByExam = (examId: string) => {
  return useQuery({
    queryKey: ['scores', 'exam', examId],
    queryFn: async () => {
      console.log('Fetching scores for exam:', examId);
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('exam_id', examId);

      if (error) {
        console.error('Error fetching exam scores:', error);
        throw error;
      }

      console.log('Exam scores fetched:', data?.length || 0);
      return data ? data.map(transformDatabaseScore) : [];
    },
    enabled: !!examId
  });
};

// Fetch scores by student
export const useScoresByStudent = (studentId: string) => {
  return useQuery({
    queryKey: ['scores', 'student', studentId],
    queryFn: async () => {
      console.log('Fetching scores for student:', studentId);
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('student_id', studentId)
        .order('entered_at', { ascending: false });

      if (error) {
        console.error('Error fetching student scores:', error);
        throw error;
      }

      console.log('Student scores fetched:', data?.length || 0);
      return data ? data.map(transformDatabaseScore) : [];
    },
    enabled: !!studentId
  });
};

// Create a single score
export const useCreateScore = () => {
  const queryClient = useQueryClient();
  const { user } = useTeacherAuth();

  return useMutation({
    mutationFn: async (score: Omit<Score, 'id' | 'enteredAt' | 'updatedAt'>) => {
      console.log('Creating score:', score);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const insertData = transformToInsert(score, user.id);
      
      const { data, error } = await supabase
        .from('scores')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating score:', error);
        if (error.code === '23505') {
          throw new Error('Score already exists for this student, exam, and subject combination.');
        }
        throw new Error(error.message || 'Failed to create score');
      }

      console.log('Score created successfully:', data);
      return transformDatabaseScore(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] });
    }
  });
};

// Bulk create scores
export const useBulkCreateScores = () => {
  const queryClient = useQueryClient();
  const { user } = useTeacherAuth();

  return useMutation({
    mutationFn: async (scores: Omit<Score, 'id' | 'enteredAt' | 'updatedAt'>[]) => {
      console.log('Bulk creating scores:', scores.length);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const insertData = scores.map(score => transformToInsert(score, user.id));
      
      const { data, error } = await supabase
        .from('scores')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Error bulk creating scores:', error);
        throw new Error(error.message || 'Failed to create scores');
      }

      console.log('Scores created successfully:', data?.length || 0);
      return data ? data.map(transformDatabaseScore) : [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] });
    }
  });
};

// Update a score
export const useUpdateScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Score> }) => {
      console.log('Updating score:', id, updates);
      
      const updateData: DatabaseScoreUpdate = {};
      
      if (updates.marksObtained !== undefined && updates.maxMarks !== undefined) {
        const percentage = (updates.marksObtained / updates.maxMarks) * 100;
        const gradeInfo = calculateGrade(percentage);
        updateData.marks_obtained = updates.marksObtained;
        updateData.max_marks = updates.maxMarks;
        updateData.grade = gradeInfo.grade;
        updateData.gpa = gradeInfo.gpa;
      }
      
      if (updates.remarks !== undefined) {
        updateData.remarks = updates.remarks || null;
      }
      
      const { data, error } = await supabase
        .from('scores')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating score:', error);
        throw error;
      }

      console.log('Score updated successfully:', data);
      return transformDatabaseScore(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] });
    }
  });
};

// Delete a score
export const useDeleteScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting score:', id);
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting score:', error);
        throw error;
      }

      console.log('Score deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores'] });
    }
  });
};
