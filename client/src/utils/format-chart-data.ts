import { Semester as GpaSemester } from "@/components/GpaDashboard";
import { Semester } from "@/utils/parseCourseData";

/**
 * Maps academic year to a year level string
 */
const mapYearToLevel = (year: string): "Freshman" | "Sophomore" | "Junior" | "Senior" => {
  if (year.toLowerCase().includes("freshman")) return "Freshman";
  if (year.toLowerCase().includes("sophomore")) return "Sophomore";
  if (year.toLowerCase().includes("junior")) return "Junior";
  return "Senior";
};

/**
 * Converts the application's semester data to the format expected by the GPA dashboard
 */
export function formatSemestersForChart(
  semesters: Semester[],
  organizedSections: { year: string; semesters: Semester[] }[]
): GpaSemester[] {
  // Create a map to associate each semester with its year
  const semesterYearMap = new Map<string, string>();
  
  organizedSections.forEach(section => {
    section.semesters.forEach(semester => {
      semesterYearMap.set(semester.id, section.year);
    });
  });

  return semesters.map(semester => ({
    id: semester.id,
    term: semester.name,
    yearLevel: mapYearToLevel(semesterYearMap.get(semester.id) || "Freshman"),
    gpa: semester.gpa,
  }));
}