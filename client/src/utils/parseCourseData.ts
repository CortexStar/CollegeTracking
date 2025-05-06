import { calculateGradePoints } from "./grade-utils";

/**
 * Course object representing a single course within a semester
 */
export interface Course {
  _uid?: string; // unique identifier for each course object
  id: string; // the course code/ID (e.g., "MATH101")
  title: string; // the course title (e.g., "Introduction to Calculus")
  grade: string; // the letter grade (e.g., "A", "B+", etc.)
  credits: number; // number of credits (e.g., 3, 4, etc.)
  gradePoints: number; // calculated grade points (credits * grade value)
}

/**
 * Semester object representing a collection of courses
 */
export interface Semester {
  id: string; // unique identifier
  name: string; // display name (e.g., "Fall 2023")
  courses: Course[]; // list of courses in this semester
  totalCredits: number; // sum of all course credits
  totalGradePoints: number; // sum of all course grade points
  gpa: number; // calculated GPA for the semester
}

/**
 * Parse raw text input into Course objects
 * Expected format: Course ID, Title, Grade, Credits (one per line, blank line separates courses)
 * 
 * @param rawText The raw text input to parse
 * @returns Array of Course objects
 */
export function parseCourseData(rawText: string): Course[] {
  const lines = rawText.split("\n").map((line) => line.trim());
  const courses: Course[] = [];
  
  // Temporary holding variables
  let currentCourse: Partial<Course> = {};
  let lineCounter = 0;
  
  for (const line of lines) {
    // Skip empty lines that are not between courses
    if (!line && lineCounter === 0) continue;
    
    // If we encounter an empty line and we have a course in progress, it's a separator
    if (!line && Object.keys(currentCourse).length > 0) {
      if (isValidCourse(currentCourse)) {
        // All required fields are present, add the course
        const course = currentCourse as Course;
        
        // Calculate grade points
        course.gradePoints = calculateGradePoints(course.credits, course.grade);
        
        // Add a unique identifier
        course._uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        courses.push(course);
      }
      
      // Reset for the next course
      currentCourse = {};
      lineCounter = 0;
      continue;
    }
    
    // Process the line based on its position
    if (lineCounter === 0) {
      // First line is course ID
      currentCourse.id = line;
    } else if (lineCounter === 1) {
      // Second line is course title
      currentCourse.title = line;
    } else if (lineCounter === 2) {
      // Third line is grade
      currentCourse.grade = line.toUpperCase();
    } else if (lineCounter === 3) {
      // Fourth line is credits
      const credits = parseFloat(line);
      if (!isNaN(credits)) {
        currentCourse.credits = credits;
      } else {
        // Invalid credits, skip this course
        currentCourse = {};
        lineCounter = 0;
        continue;
      }
      
      // We have all 4 fields, add the course
      if (isValidCourse(currentCourse)) {
        const course = currentCourse as Course;
        
        // Calculate grade points
        course.gradePoints = calculateGradePoints(course.credits, course.grade);
        
        // Add a unique identifier
        course._uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        courses.push(course);
      }
      
      // Reset for the next course
      currentCourse = {};
      lineCounter = 0;
      continue;
    }
    
    lineCounter++;
  }
  
  // Don't forget the last course if there's no trailing empty line
  if (Object.keys(currentCourse).length > 0 && isValidCourse(currentCourse)) {
    const course = currentCourse as Course;
    
    // Calculate grade points
    course.gradePoints = calculateGradePoints(course.credits, course.grade);
    
    // Add a unique identifier
    course._uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    courses.push(course);
  }
  
  return courses;
}

/**
 * Create a blank course with default values
 * @returns A new Course object with empty/default values
 */
export function makeBlankCourse(): Course {
  return {
    _uid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    id: "",
    title: "",
    grade: "",
    credits: 0,
    gradePoints: 0,
  };
}

/**
 * Check if a course object has all required fields
 * @param course The course object to validate
 * @returns true if the course has all required fields
 */
function isValidCourse(course: Partial<Course>): boolean {
  return !!(
    course.id &&
    course.title &&
    course.grade &&
    typeof course.credits === "number"
  );
}