/**
 * Grade utilities for calculating GPA and handling grade-related operations
 */

// Constants
export const DEFAULT_CREDITS = 3.0;
export const MAX_GPA = 4.0;
export const DEFAULT_GRADE_POINT = 2.0; // Equivalent to C

// Define the grade point values
export const gradePointValues: Record<string, number> = {
  A: 4.0,
  "A-": 3.67,
  "B+": 3.33,
  B: 3.0,
  "B-": 2.67,
  "C+": 2.33,
  C: 2.0,
  "C-": 1.67,
  "D+": 1.33,
  D: 1.0,
  "D-": 0.67,
  F: 0.0,
  E: 0.0,
};

/**
 * Calculates grade points based on credits and grade
 * @param credits Number of credits
 * @param grade Letter grade (A, B, C, etc.)
 * @returns Grade points
 */
export function calculateGradePoints(credits: number, grade: string): number {
  const gradePoint = gradePointValues[grade] !== undefined 
    ? gradePointValues[grade] 
    : DEFAULT_GRADE_POINT;
  
  return parseFloat((credits * gradePoint).toFixed(2));
}

/**
 * Calculates GPA from total credits and grade points
 * @param totalCredits Total credit hours
 * @param totalGradePoints Total grade points
 * @returns GPA with two decimal places
 */
export function calculateGPA(totalCredits: number, totalGradePoints: number): number {
  if (totalCredits <= 0) return 0;
  return Math.round((totalGradePoints / totalCredits) * 100) / 100;
}

/**
 * Calculate semester totals based on courses
 * @param courses Array of courses
 * @returns Object with totalCredits, totalGradePoints, and gpa
 */
export function calculateSemesterTotals(courses: Array<{ credits: number; gradePoints: number }>) {
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const totalGradePoints = courses.reduce((sum, course) => sum + course.gradePoints, 0);
  const gpa = calculateGPA(totalCredits, totalGradePoints);

  return { totalCredits, totalGradePoints, gpa };
}