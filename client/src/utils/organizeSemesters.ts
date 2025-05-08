import { Semester } from "./parseCourseData";

/**
 * Interface for a section of semesters grouped by academic year category
 */
export interface SemesterSection {
  year: string;
  semesters: Semester[];
}

/**
 * Mapping of season names to their relative order within an academic year
 */
const SEASON_ORDER: Record<string, number> = { 
  spring: 1, 
  summer: 2, 
  fall: 3, 
  winter: 4 
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

/**
 * Organize a flat list of semesters into chronological sections:
 * - Non-summer semesters are grouped two per academic year: Freshman, Sophomore, etc.
 * - Summer semesters each get their own "Summer {year}" section,
 *   and appear at the correct point in the timeline.
 */
export function organizeSemesters(semesters: Semester[]): SemesterSection[] {
  if (!semesters || semesters.length === 0) {
    return [];
  }
  
  // Parse name to season/year, keep original semester
  const parsed = semesters
    .map((sem) => {
      const match = sem.name.match(/(Spring|Summer|Fall|Winter)\s+(\d{4})/i);
      if (!match) {
        // Check if it's already labeled as an academic year
        for (const academicLabel of ACADEMIC_LABELS) {
          if (sem.name.includes(academicLabel)) {
            return { sem, season: "", academicYear: true, year: 0, label: academicLabel };
          }
        }
        // Unknown format: push to end as misc
        return { sem, season: "", academicYear: false, year: 0, label: "Miscellaneous" };
      }
      return {
        sem,
        season: match[1].toLowerCase(),
        academicYear: false,
        year: parseInt(match[2], 10),
        label: ""
      };
    })
    .sort((a, b) => {
      // If either is pre-labeled as academic year, respect that
      if (a.academicYear && b.academicYear) {
        return ACADEMIC_LABELS.indexOf(a.label) - ACADEMIC_LABELS.indexOf(b.label);
      }
      if (a.academicYear) return -1;
      if (b.academicYear) return 1;
      
      // chronological: by year, then season order
      const yearDiff = a.year - b.year;
      if (yearDiff !== 0) return yearDiff;
      return (SEASON_ORDER[a.season] || 0) - (SEASON_ORDER[b.season] || 0);
    });

  const sections: SemesterSection[] = [];
  let nonSummerCount = 0;
  let academicYearLabels: Record<string, boolean> = {};
  
  // Initialize academic year tracking
  ACADEMIC_LABELS.forEach(label => {
    academicYearLabels[label] = false;
  });

  for (const item of parsed) {
    const { sem, season, academicYear, year, label } = item;
    
    // If it's already marked with an academic year label
    if (academicYear) {
      const existingSection = sections.find(s => s.year === label);
      if (existingSection) {
        existingSection.semesters.push(sem);
      } else {
        academicYearLabels[label] = true;
        sections.push({ year: label, semesters: [sem] });
      }
      continue;
    }
    
    if (season === "summer") {
      // Each summer gets its own section
      const summerLabel = `Summer ${year}`;
      sections.push({ year: summerLabel, semesters: [sem] });
    } 
    else if (season === "spring" || season === "fall" || season === "winter") {
      // Determine academic group index
      const level = Math.floor(nonSummerCount / 2);
      const academicLabel = level < ACADEMIC_LABELS.length 
        ? ACADEMIC_LABELS[level] 
        : `Year ${level + 1}`;
      
      // Find if this academic year section already exists
      const existingSection = sections.find(s => s.year === academicLabel);
      if (existingSection) {
        existingSection.semesters.push(sem);
      } else {
        academicYearLabels[academicLabel] = true;
        sections.push({ year: academicLabel, semesters: [sem] });
      }
      nonSummerCount++;
    } 
    else {
      // Fallback for unrecognized names: group under "Miscellaneous"
      const fallback = "Miscellaneous";
      const existingSection = sections.find(s => s.year === fallback);
      if (existingSection) {
        existingSection.semesters.push(sem);
      } else {
        sections.push({ year: fallback, semesters: [sem] });
      }
    }
  }

  // Sort sections in logical order:
  // 1. Academic year labels in order (Freshman, Sophomore, etc.)
  // 2. Summer sections by year
  // 3. Miscellaneous at the end
  return sections.sort((a, b) => {
    // Put academic years first, in specified order
    const aIsAcademic = ACADEMIC_LABELS.includes(a.year);
    const bIsAcademic = ACADEMIC_LABELS.includes(b.year);
    
    if (aIsAcademic && bIsAcademic) {
      return ACADEMIC_LABELS.indexOf(a.year) - ACADEMIC_LABELS.indexOf(b.year);
    }
    
    if (aIsAcademic) return -1;
    if (bIsAcademic) return 1;
    
    // Sort summer sections by year
    const aSummerMatch = a.year.match(/Summer\s+(\d{4})/i);
    const bSummerMatch = b.year.match(/Summer\s+(\d{4})/i);
    
    if (aSummerMatch && bSummerMatch) {
      return parseInt(aSummerMatch[1]) - parseInt(bSummerMatch[1]);
    }
    
    // Miscellaneous goes at the end
    if (a.year === "Miscellaneous") return 1;
    if (b.year === "Miscellaneous") return -1;
    
    // Default alphabetical sort
    return a.year.localeCompare(b.year);
  });
}