import { Semester } from "./parseCourseData";

/**
 * Interface for a section of semesters grouped by academic year category
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
 * Academic year categories (Freshman, Sophomore, etc.)
 */
const academicYearCategories = [
  "Freshman",
  "Sophomore",
  "Junior", 
  "Senior",
  "Graduate"
];

/**
 * Extract academic year from semester name (e.g., "Fall 2023" -> "2023")
 * @param name Semester name
 * @returns Extracted year
 */
function extractYear(name: string): string {
  // First check for academic year categories
  const categoryMatch = academicYearCategories.find(category => 
    name.toLowerCase().includes(category.toLowerCase())
  );
  
  if (categoryMatch) {
    return categoryMatch;
  }
  
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
  
  // If it's an academic year category, use that for ordering
  const categoryIndex = academicYearCategories.findIndex(
    cat => cat === year
  );
  
  if (categoryIndex >= 0) {
    return (categoryIndex * 10) + (termOrder[term] ?? 5);
  }
  
  // Otherwise use the numeric year
  const yearNum = parseInt(year) * 10;
  const termNum = termOrder[term] ?? 5;
  return yearNum + termNum;
}

/**
 * Get a display name for a year group (includes special handling for academic year categories)
 */
function getYearGroupDisplayName(year: string): string {
  if (academicYearCategories.includes(year)) {
    return year + " Year";
  }
  
  if (year === "Other") {
    return "Other Semesters";
  }
  
  return year;
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
  
  // Group semesters by year or category
  const semestersByCategory: Record<string, Semester[]> = {};
  
  for (const semester of semesters) {
    const category = extractYear(semester.name);
    if (!semestersByCategory[category]) {
      semestersByCategory[category] = [];
    }
    semestersByCategory[category].push(semester);
  }
  
  // Sort semesters within each category by term
  for (const category in semestersByCategory) {
    semestersByCategory[category].sort((a, b) => {
      return getSortValue(a.name) - getSortValue(b.name);
    });
  }
  
  // Convert to array and sort by category order
  const result: SemesterSection[] = [];
  
  // First add academic year categories in order
  for (const category of academicYearCategories) {
    if (semestersByCategory[category]) {
      result.push({
        year: getYearGroupDisplayName(category),
        semesters: semestersByCategory[category],
      });
      delete semestersByCategory[category];
    }
  }
  
  // Then add numeric years in descending order
  const remainingYears = Object.keys(semestersByCategory).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    
    // Try to parse as numbers, if both are numbers, sort numerically
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numB - numA; // Descending order
    }
    
    // Otherwise alphabetical
    return a.localeCompare(b);
  });
  
  for (const year of remainingYears) {
    result.push({
      year: getYearGroupDisplayName(year),
      semesters: semestersByCategory[year],
    });
  }
  
  return result;
}