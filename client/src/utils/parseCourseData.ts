/**
 * Course data parsing utilities 
 */
import { z } from 'zod';
import { calculateGradePoints, DEFAULT_CREDITS, DEFAULT_GRADE_POINT, gradePointValues } from './grade-utils';
import { nanoid } from 'nanoid';

// Course interface
export interface Course {
  id: string;
  title: string;
  grade: string;
  credits: number;
  gradePoints: number;
  _uid?: string; // Internal key for React stable keys
}

// Define academic years
export type AcademicYear = "Freshman" | "Sophomore" | "Junior" | "Senior" | "Summer";

// Semester interface
export interface Semester {
  id: string;
  name: string;
  courses: Course[];
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
  academicYear?: AcademicYear;
}

// Constants for regex patterns
const COURSE_CODE_RE = /\b[A-Z]{3,4}\d{4}\b/;
const GRADE_RE = /^(?:A|A-|B\+|B|B-|C\+|C|C-|D\+|D|D-|F|--)(?:\s|$)/i;

// Validation schema for a course line
export const courseLineSchema = z.object({
  id: z.string().regex(COURSE_CODE_RE, "Must be a valid course code (e.g., MATH1101)"),
  title: z.string().min(1, "Title is required"),
  grade: z.string().regex(/^[A-F][+-]?$|^[A-F]$|^--$/, "Must be a valid grade (A, B+, C-, etc.)"),
  credits: z.number().min(0, "Credits must be a positive number")
});

/**
 * Create a blank course with default values but a unique ID for stable rendering
 */
export function makeBlankCourse(): Course {
  return {
    // leave user-visible fields empty
    id: "",
    title: "",
    grade: "",
    credits: 0,
    gradePoints: 0,
    // internal key so Drag-and-Drop stays stable
    _uid: nanoid(6),
  };
}

/**
 * Parse course data from raw text input
 * @param rawData Raw text input containing course information
 * @returns Array of parsed Course objects
 */
export function parseCourseData(rawData: string): Course[] {
  if (!rawData || !rawData.trim()) return [];

  // Normalize input: standardize line breaks, trim whitespace, remove empty lines
  const normalizedLines = rawData
    .replace(/\r\n?/g, "\n") // normalize line endings
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean); // remove empty lines

  const courses: Course[] = [];
  let cursor = 0;

  while (cursor < normalizedLines.length) {
    // Step 1: Find the next line containing a course code
    while (cursor < normalizedLines.length && !COURSE_CODE_RE.test(normalizedLines[cursor])) {
      cursor += 1;
    }

    if (cursor >= normalizedLines.length) break; // no more courses

    // Extract course ID
    const codeLine = normalizedLines[cursor++];
    const idMatch = codeLine.match(COURSE_CODE_RE);
    const id = idMatch ? idMatch[0] : "UNKNOWN";

    // Step 2: Course title - first non-empty line after the code line
    let title = "";
    if (cursor < normalizedLines.length) {
      // Check if the next line is a title (not a grade or number)
      if (!GRADE_RE.test(normalizedLines[cursor]) && !/^[-+]?\d/.test(normalizedLines[cursor])) {
        title = normalizedLines[cursor++];
      } else {
        // Look for title in the course ID line - extract anything after the course code
        const titleInCodeLine = codeLine.substring(codeLine.indexOf(id) + id.length).trim();
        if (titleInCodeLine) {
          // Remove leading separators like dash or colon
          title = titleInCodeLine.replace(/^[-:]\s*/, "");
        }
      }
    }

    // Step 3: Find grade - search for a pattern that looks like a grade
    let grade = "C"; // Default to C if no grade found
    while (
      cursor < normalizedLines.length &&
      !GRADE_RE.test(normalizedLines[cursor]) &&
      !/^[-+]?\d/.test(normalizedLines[cursor]) &&
      !COURSE_CODE_RE.test(normalizedLines[cursor])
    ) {
      cursor += 1;
    }

    if (cursor < normalizedLines.length && GRADE_RE.test(normalizedLines[cursor])) {
      grade = normalizedLines[cursor++].toUpperCase();
    }

    // Step 4: Collect numeric values until we hit the next course code
    const numericValues: number[] = [];
    while (cursor < normalizedLines.length && !COURSE_CODE_RE.test(normalizedLines[cursor])) {
      // Try to extract a number from the current line
      const numMatch = normalizedLines[cursor].match(/[-+]?(\d+(\.\d+)?)/);
      if (numMatch) {
        const value = parseFloat(numMatch[1]);
        if (!isNaN(value)) {
          numericValues.push(value);
        }
      }
      cursor += 1;
    }

    // Step 5: Determine which number is credits
    // Prefer integers between 1-5 as credits
    let credits = DEFAULT_CREDITS; // Default
    const creditCandidate = numericValues.find((n) => n % 1 === 0 && n >= 1 && n <= 5);
    if (creditCandidate !== undefined) {
      credits = creditCandidate;
    } else if (numericValues.length > 0) {
      // If no good candidate, use the last number
      credits = numericValues[numericValues.length - 1];
    }

    // Step 6: Calculate grade points
    const gradePoints = calculateGradePoints(credits, grade);

    // Add the parsed course
    courses.push({
      id,
      title: title || id, // Use ID as title if no title found
      grade,
      credits,
      gradePoints,
    });
  }

  return courses;
}