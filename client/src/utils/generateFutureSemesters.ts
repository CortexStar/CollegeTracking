import { Semester as GpaSemester } from "@/components/GpaDashboard";
import { Semester } from "@/utils/parseCourseData";

const ORDER = ["Fall", "Spring"] as const;
const LEVELS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;

// Parse a semester name to extract season and year
function parseSemesterName(name: string): [string, number] {
  // Default fallbacks
  let season = "Fall";
  let year = new Date().getFullYear();

  // Try to extract season and year from common formats
  if (name.includes("Fall") || name.includes("fall")) {
    season = "Fall";
  } else if (name.includes("Spring") || name.includes("spring")) {
    season = "Spring";
  }

  // Extract year (find 4 consecutive digits)
  const yearMatch = name.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
  }

  return [season, year];
}

export function generateFutureSemesters(existing: Semester[]): Semester[] {
  if (!existing.length) return [];

  // sort existing just in case (naive sort by ID as a backup)
  const semesters = [...existing].sort(
    (a, b) => parseInt(a.id) - parseInt(b.id)
  );

  const last = semesters[semesters.length - 1];
  const [lastSeason, lastYear] = parseSemesterName(last.name);
  let seasonIdx = ORDER.indexOf(lastSeason as any);
  if (seasonIdx === -1) seasonIdx = 0; // Default to Fall if not found
  
  // Default to Freshman if can't determine
  let levelIdx = 0;
  let year = lastYear;

  while (levelIdx < LEVELS.length) {
    // advance to next term
    seasonIdx = (seasonIdx + 1) % 2;
    if (seasonIdx === 0) year += 1; // wrapped from Spring -> Fall

    if (seasonIdx === 0 && levelIdx < LEVELS.length - 1) levelIdx++; // promote after Spring
    
    const yearLevel = LEVELS[levelIdx];
    const next: Semester = {
      id: `${ORDER[seasonIdx]}${year}`,
      name: `${ORDER[seasonIdx]} ${year}`,
      courses: [],
      totalCredits: 0,
      totalGradePoints: 0,
      gpa: 0,
    };

    // stop once we've added Senior Spring
    semesters.push(next);
    if (yearLevel === "Senior" && ORDER[seasonIdx] === "Spring") break;
  }

  return semesters;
}