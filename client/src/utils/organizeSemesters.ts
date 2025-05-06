import { Semester } from "./parseCourseData";

/**
 * Interface for a section of semesters grouped by academic year
 */
export interface SemesterSection {
  year: string;
  semesters: Semester[];
}

/**
 * Mapping of term names to their relative order within an academic year
 */
const termOrder: Record<string, number> = {
  spring: 0,
  summer: 1,
  fall: 2,
  winter: 3,
};

/**
 * Extract academic year from semester name (e.g., "Fall 2023" -> "2023")
 * @param name Semester name
 * @returns Extracted year
 */
function extractYear(name: string): string {
  // Look for 4-digit year
  const yearMatch = name.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return yearMatch[0];
  }
  
  // No year found, try to extract term
  const termMatch = Object.keys(termOrder).find(term => 
    name.toLowerCase().includes(term.toLowerCase())
  );
  
  if (termMatch) {
    // Use current year if we found a term but no year
    const currentYear = new Date().getFullYear();
    return currentYear.toString();
  }
  
  // Default to "Other" if no recognizable pattern
  return "Other";
}

/**
 * Extract term from semester name (e.g., "Fall 2023" -> "fall")
 * @param name Semester name
 * @returns Extracted term
 */
function extractTerm(name: string): string {
  const lowerName = name.toLowerCase();
  for (const term of Object.keys(termOrder)) {
    if (lowerName.includes(term)) {
      return term;
    }
  }
  return "other";
}

/**
 * Get sorting value for a semester based on term and year
 * @param name Semester name
 * @returns Sorting value
 */
function getSortValue(name: string): number {
  const year = extractYear(name);
  const term = extractTerm(name);
  const yearNum = parseInt(year) * 10;
  const termNum = termOrder[term] ?? 5;
  return yearNum + termNum;
}

/**
 * Organize semesters into sections by academic year
 * @param semesters Array of semester objects
 * @returns Array of semester sections organized by year
 */
export function organizeSemesters(semesters: Semester[]): SemesterSection[] {
  if (!semesters || semesters.length === 0) {
    return [];
  }
  
  // Group semesters by year
  const semestersByYear: Record<string, Semester[]> = {};
  
  for (const semester of semesters) {
    const year = extractYear(semester.name);
    if (!semestersByYear[year]) {
      semestersByYear[year] = [];
    }
    semestersByYear[year].push(semester);
  }
  
  // Sort semesters within each year by term
  for (const year in semestersByYear) {
    semestersByYear[year].sort((a, b) => {
      return getSortValue(a.name) - getSortValue(b.name);
    });
  }
  
  // Convert to array and sort by year (most recent first)
  const result: SemesterSection[] = [];
  const years = Object.keys(semestersByYear).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return parseInt(b) - parseInt(a);
  });
  
  for (const year of years) {
    result.push({
      year,
      semesters: semestersByYear[year],
    });
  }
  
  return result;
}