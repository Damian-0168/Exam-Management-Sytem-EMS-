import { supabase } from '@/integrations/supabase/client';

/**
 * Generates the next sequential roll number with ST prefix
 * Format: ST001, ST002, ST003, etc.
 */
export const generateNextRollNumber = async (): Promise<string> => {
  try {
    // Fetch all existing roll numbers that start with 'ST'
    const { data, error } = await supabase
      .from('students')
      .select('roll_number')
      .like('roll_number', 'ST%')
      .order('roll_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching roll numbers:', error);
      throw error;
    }

    // If no students exist, start with ST001
    if (!data || data.length === 0) {
      return 'ST001';
    }

    // Extract the numeric part from the highest roll number
    const lastRollNumber = data[0].roll_number;
    if (!lastRollNumber) {
      return 'ST001';
    }

    // Extract number after 'ST' prefix
    const numericPart = lastRollNumber.replace('ST', '');
    const nextNumber = parseInt(numericPart, 10) + 1;

    // Format with leading zeros (3 digits)
    return `ST${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating roll number:', error);
    // Fallback to a timestamp-based roll number if generation fails
    const timestamp = Date.now().toString().slice(-3);
    return `ST${timestamp}`;
  }
};

/**
 * Validates if a roll number follows the ST### format
 */
export const isValidRollNumberFormat = (rollNumber: string): boolean => {
  const pattern = /^ST\d{3,}$/;
  return pattern.test(rollNumber);
};

/**
 * Generates multiple sequential roll numbers
 */
export const generateMultipleRollNumbers = async (count: number): Promise<string[]> => {
  const rollNumbers: string[] = [];
  
  try {
    // Get the starting roll number
    const { data, error } = await supabase
      .from('students')
      .select('roll_number')
      .like('roll_number', 'ST%')
      .order('roll_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let startNumber = 1;
    if (data && data.length > 0 && data[0].roll_number) {
      const numericPart = data[0].roll_number.replace('ST', '');
      startNumber = parseInt(numericPart, 10) + 1;
    }

    // Generate the requested count of roll numbers
    for (let i = 0; i < count; i++) {
      const number = startNumber + i;
      rollNumbers.push(`ST${number.toString().padStart(3, '0')}`);
    }

    return rollNumbers;
  } catch (error) {
    console.error('Error generating multiple roll numbers:', error);
    throw error;
  }
};
