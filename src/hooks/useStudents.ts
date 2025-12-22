
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types';
import { useTeacherProfile } from './useTeacherProfile';
import { useTeacherAuth } from './useTeacherAuth';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { generateNextRollNumber, isValidRollNumberFormat } from '@/utils/rollNumberGenerator';

type DatabaseStudent = Tables<'students'>;
type DatabaseStudentInsert = TablesInsert<'students'>;
type DatabaseStudentUpdate = TablesUpdate<'students'>;

// Transform database student to app student format
const transformDatabaseStudent = (dbStudent: DatabaseStudent): Student => ({
  id: dbStudent.id,
  name: dbStudent.name,
  rollNumber: dbStudent.roll_number || '',
  class: dbStudent.class,
  section: dbStudent.section,
  registrationDate: dbStudent.registration_date || '',
  guardian: dbStudent.guardian || '',
  guardianContact: dbStudent.guardian_contact || '',
  createdAt: dbStudent.created_at,
  updatedAt: dbStudent.updated_at
});

// Transform app student to database format for insert
const transformToInsert = (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): DatabaseStudentInsert => ({
  name: student.name,
  roll_number: student.rollNumber || null,
  class: student.class,
  section: student.section,
  registration_date: student.registrationDate || null,
  guardian: student.guardian || null,
  guardian_contact: student.guardianContact || null
});

// Transform app student to database format for update
const transformToUpdate = (student: Partial<Student>): DatabaseStudentUpdate => ({
  ...(student.name && { name: student.name }),
  ...(student.rollNumber && { roll_number: student.rollNumber }),
  ...(student.class && { class: student.class }),
  ...(student.section && { section: student.section }),
  ...(student.registrationDate !== undefined && { registration_date: student.registrationDate || null }),
  ...(student.guardian !== undefined && { guardian: student.guardian || null }),
  ...(student.guardianContact !== undefined && { guardian_contact: student.guardianContact || null })
});

export const useStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      console.log('Fetching students from Supabase...');
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name'); // Sort alphabetically

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }

      console.log('Students fetched successfully:', data?.length || 0);
      return data ? data.map(transformDatabaseStudent) : [];
    }
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  const { user } = useTeacherAuth();
  const { data: teacherProfile } = useTeacherProfile(user?.id);

  return useMutation({
    mutationFn: async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
      console.log('Creating student:', student);
      
      let schoolId = teacherProfile?.school_id;

      if (!schoolId) {
        const { data: rpcSchoolId, error: rpcError } = await supabase.rpc(
          'get_teacher_school_id',
          { _teacher_id: user?.id }
        );
        if (rpcError) {
          console.error('Error fetching school id via RPC:', rpcError);
        }
        schoolId = rpcSchoolId || undefined;
      }

      if (!schoolId) {
        throw new Error('Teacher school not found. Please contact administrator.');
      }

      // Auto-generate roll number if not provided or invalid
      let rollNumber = student.rollNumber?.trim() || '';
      
      if (!rollNumber || !isValidRollNumberFormat(rollNumber)) {
        console.log('Generating new roll number...');
        rollNumber = await generateNextRollNumber();
        console.log('Generated roll number:', rollNumber);
      }

      const insertData = {
        ...transformToInsert({ ...student, rollNumber }),
        school_id: schoolId
      };
      
      const { data, error } = await supabase
        .from('students')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating student:', error);
        
        // Provide user-friendly error messages
        if (error.code === '23505' && error.message.includes('roll_number')) {
          throw new Error(`Roll number "${rollNumber}" already exists. Please use a different roll number.`);
        }
        
        throw new Error(error.message || 'Failed to create student. Please try again.');
      }

      console.log('Student created successfully:', data);
      return transformDatabaseStudent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Student> }) => {
      console.log('Updating student:', id, updates);
      const { data, error } = await supabase
        .from('students')
        .update(transformToUpdate(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating student:', error);
        throw error;
      }

      console.log('Student updated successfully:', data);
      return transformDatabaseStudent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting student:', id);
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting student:', error);
        throw error;
      }

      console.log('Student deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  });
};
