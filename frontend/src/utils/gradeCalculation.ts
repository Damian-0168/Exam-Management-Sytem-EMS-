
import { GradeScale, GradeRange, Score, Subject } from '@/types';

// Default grade scale for calculations
const defaultGradeScale: GradeScale = {
  id: 'default',
  name: 'Standard Grading Scale',
  grades: [
    { grade: 'A+', minPercentage: 90, maxPercentage: 100, gpa: 4.0, description: 'Outstanding' },
    { grade: 'A', minPercentage: 80, maxPercentage: 89, gpa: 3.7, description: 'Excellent' },
    { grade: 'B+', minPercentage: 70, maxPercentage: 79, gpa: 3.3, description: 'Very Good' },
    { grade: 'B', minPercentage: 60, maxPercentage: 69, gpa: 3.0, description: 'Good' },
    { grade: 'C+', minPercentage: 50, maxPercentage: 59, gpa: 2.7, description: 'Satisfactory' },
    { grade: 'C', minPercentage: 40, maxPercentage: 49, gpa: 2.0, description: 'Pass' },
    { grade: 'F', minPercentage: 0, maxPercentage: 39, gpa: 0, description: 'Fail' }
  ],
  isDefault: true
};

export const calculateGrade = (percentage: number, gradeScale: GradeScale = defaultGradeScale): { grade: string; gpa: number; description: string } => {
  const gradeRange = gradeScale.grades.find(range => 
    percentage >= range.minPercentage && percentage <= range.maxPercentage
  );
  
  return gradeRange ? {
    grade: gradeRange.grade,
    gpa: gradeRange.gpa,
    description: gradeRange.description
  } : {
    grade: 'N/A',
    gpa: 0,
    description: 'Not Available'
  };
};

export const calculatePercentage = (marksObtained: number, maxMarks: number): number => {
  if (maxMarks === 0) return 0;
  return Math.round((marksObtained / maxMarks) * 100 * 100) / 100; // Round to 2 decimal places
};

export const calculateOverallGPA = (scores: Score[], subjects: Subject[], gradeScale: GradeScale): number => {
  if (scores.length === 0) return 0;
  
  const totalGPA = scores.reduce((sum, score) => {
    const percentage = calculatePercentage(score.marksObtained, score.maxMarks);
    const gradeInfo = calculateGrade(percentage, gradeScale);
    return sum + gradeInfo.gpa;
  }, 0);
  
  return Math.round((totalGPA / scores.length) * 100) / 100;
};

export const calculateOverallPercentage = (scores: Score[]): number => {
  if (scores.length === 0) return 0;
  
  const totalObtained = scores.reduce((sum, score) => sum + score.marksObtained, 0);
  const totalMax = scores.reduce((sum, score) => sum + score.maxMarks, 0);
  
  return calculatePercentage(totalObtained, totalMax);
};

export const determinePassStatus = (scores: Score[], subjects: Subject[]): boolean => {
  const subjectMap = new Map(subjects.map(subject => [subject.id, subject]));
  
  return scores.every(score => {
    const subject = subjectMap.get(score.subjectId);
    if (!subject) return false;
    
    const percentage = calculatePercentage(score.marksObtained, score.maxMarks);
    const passingPercentage = (subject.passing_marks / subject.max_marks) * 100;
    
    return percentage >= passingPercentage;
  });
};

export const getGradeDistribution = (scores: Score[], gradeScale: GradeScale): { [grade: string]: number } => {
  const distribution: { [grade: string]: number } = {};
  
  // Initialize all grades with 0
  gradeScale.grades.forEach(gradeRange => {
    distribution[gradeRange.grade] = 0;
  });
  
  // Count occurrences
  scores.forEach(score => {
    const percentage = calculatePercentage(score.marksObtained, score.maxMarks);
    const gradeInfo = calculateGrade(percentage, gradeScale);
    distribution[gradeInfo.grade] = (distribution[gradeInfo.grade] || 0) + 1;
  });
  
  return distribution;
};

export const rankStudents = (studentScores: { studentId: string; totalPercentage: number }[]): { studentId: string; rank: number; totalPercentage: number }[] => {
  // Sort by percentage in descending order
  const sorted = [...studentScores].sort((a, b) => b.totalPercentage - a.totalPercentage);
  
  let currentRank = 1;
  return sorted.map((student, index) => {
    // Handle ties - students with same percentage get same rank
    if (index > 0 && student.totalPercentage < sorted[index - 1].totalPercentage) {
      currentRank = index + 1;
    }
    
    return {
      ...student,
      rank: currentRank
    };
  });
};

export const calculateClassStatistics = (scores: Score[], gradeScale: GradeScale) => {
  if (scores.length === 0) {
    return {
      average: 0,
      highest: 0,
      lowest: 0,
      passRate: 0,
      gradeDistribution: {}
    };
  }
  
  const percentages = scores.map(score => calculatePercentage(score.marksObtained, score.maxMarks));
  const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  const highest = Math.max(...percentages);
  const lowest = Math.min(...percentages);
  
  // Calculate pass rate (assuming 40% is passing)
  const passingPercentage = 40;
  const passedCount = percentages.filter(p => p >= passingPercentage).length;
  const passRate = (passedCount / percentages.length) * 100;
  
  const gradeDistribution = getGradeDistribution(scores, gradeScale);
  
  return {
    average: Math.round(average * 100) / 100,
    highest,
    lowest,
    passRate: Math.round(passRate * 100) / 100,
    gradeDistribution
  };
};

export const validateScore = (marksObtained: number, maxMarks: number): { isValid: boolean; error?: string } => {
  if (marksObtained < 0) {
    return { isValid: false, error: 'Marks cannot be negative' };
  }
  
  if (marksObtained > maxMarks) {
    return { isValid: false, error: `Marks cannot exceed maximum marks (${maxMarks})` };
  }
  
  if (!Number.isInteger(marksObtained) && marksObtained % 0.5 !== 0) {
    return { isValid: false, error: 'Marks should be in increments of 0.5' };
  }
  
  return { isValid: true };
};
