import { Semester } from "./parseCourseData";

/**
 * Interface for a section of semesters grouped by academic year category
 */
export interface SemesterSection {
  year: string;
  semesters: Semester[];
}

// Renamed to match the provided code style
export interface OrganizedSemesterGroup {
  yearLabel: string; // e.g., "FRESHMAN", "SOPHOMORE"
  semesters: Semester[];
}

/**
 * Defines the chronological order of terms within a calendar year
 */
const termOrderMap: { [key: string]: number } = {
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
  WINTER: 4,
};

/**
 * Academic year categories (Freshman, Sophomore, etc.)
 */
const ACADEMIC_LABELS = [
  "Freshman", 
  "Sophomore", 
  "Junior", 
  "Senior",
  "Graduate"
];

interface SortableSemester extends Semester {
  parsedYear: number;
  termSortOrder: number;
  termName: string; // "SPRING", "SUMMER", "FALL"
}

/**
 * Parse a semester name to extract year and term information
 */
function parseSemesterName(name: string): { year: number; term: string; termSortOrder: number } {
  const upperName = name.toUpperCase();
  const yearMatch = upperName.match(/\d{4}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;

  let term = "UNKNOWN";
  let termSortOrder = 99; // Default for unknown terms, sorts last

  if (upperName.includes("SPRING")) {
    term = "SPRING";
    termSortOrder = termOrderMap.SPRING;
  } else if (upperName.includes("SUMMER")) {
    term = "SUMMER";
    termSortOrder = termOrderMap.SUMMER;
  } else if (upperName.includes("FALL")) {
    term = "FALL";
    termSortOrder = termOrderMap.FALL;
  } else if (upperName.includes("WINTER")) {
    term = "WINTER";
    termSortOrder = termOrderMap.WINTER;
  }

  return { year, term, termSortOrder };
}

/**
 * Organize a flat list of semesters into chronological sections:
 * - First sorts all semesters chronologically by year and term
 * - Then groups them into academic years (Freshman, Sophomore, etc.)
 */
export function organizeSemesters(semesters: Semester[]): SemesterSection[] {
  if (!semesters || semesters.length === 0) {
    return [];
  }

  // 1. Create sortable semester objects
  const sortableSemesters: SortableSemester[] = semesters.map(s => {
    const { year, term, termSortOrder } = parseSemesterName(s.name);
    return {
      ...s,
      parsedYear: year,
      termSortOrder: termSortOrder,
      termName: term,
    };
  });

  // 2. Sort all semesters chronologically
  sortableSemesters.sort((a, b) => {
    if (a.parsedYear !== b.parsedYear) {
      return a.parsedYear - b.parsedYear; // Sort by year first
    }
    return a.termSortOrder - b.termSortOrder; // Then by term order (Spring < Summer < Fall)
  });

  // 3. Apply grouping logic for academic years
  const groups: { [yearLabel: string]: SortableSemester[] } = {};
  const academicYearLabels = ACADEMIC_LABELS.map(label => label.toUpperCase());
  let firstFallYear = -1;

  // Determine the first Fall year to anchor academic years
  for (const sem of sortableSemesters) {
    if (sem.termName === "FALL") {
      firstFallYear = sem.parsedYear;
      break;
    }
  }
  
  // If no Fall semester, use the earliest year as the anchor
  if (firstFallYear === -1 && sortableSemesters.length > 0) {
    // If starts with Spring or Summer, that academic year effectively 
    // started the previous calendar year's Fall
    firstFallYear = sortableSemesters[0].parsedYear - 
      (sortableSemesters[0].termName === "FALL" ? 0 : 1);
  }

  sortableSemesters.forEach(semester => {
    let academicYearStart = semester.parsedYear;
    if (semester.termName === "SPRING" || semester.termName === "SUMMER") {
      academicYearStart--; // Spring & Summer belong to academic year that started with previous Fall
    }

    const yearIndex = firstFallYear !== -1 ? academicYearStart - firstFallYear : 0;
    const yearLabel = yearIndex < academicYearLabels.length ? 
      ACADEMIC_LABELS[yearIndex] : 
      `Year ${yearIndex + 1}`;

    if (!groups[yearLabel]) {
      groups[yearLabel] = [];
    }
    groups[yearLabel].push(semester);
  });

  // 4. Convert to expected output format
  const organizedResult: SemesterSection[] = Object.keys(groups)
    // Sort the groups themselves (e.g., FRESHMAN before SOPHOMORE)
    .sort((labelA, labelB) => {
      const indexA = ACADEMIC_LABELS.indexOf(labelA);
      const indexB = ACADEMIC_LABELS.indexOf(labelB);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1; // Known label comes first
      if (indexB !== -1) return 1;
      return labelA.localeCompare(labelB); // Fallback for "YEAR X"
    })
    .map(yearLabel => ({
      year: yearLabel,
      semesters: groups[yearLabel], // Semesters within group are already sorted chronologically
    }));

  return organizedResult;
}