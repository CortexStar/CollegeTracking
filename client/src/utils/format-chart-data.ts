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
 * Converts a letter grade to a grade point value
 * Returns null if the grade cannot be converted (like P/F, W, I)
 */
const getGradeValue = (grade: string): number | null => {
  const gradeMap: Record<string, number> = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  
  // Clean up the input grade and convert to uppercase
  const cleanGrade = grade.trim().toUpperCase();
  
  return gradeMap[cleanGrade] ?? null;
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

  return semesters.map(semester => {
    // Calculate total credits and grade points for this semester
    let totalCredits = 0;
    let totalGradePoints = 0;
    
    if (semester.courses) {
      semester.courses.forEach(course => {
        const credits = course.credits ? parseFloat(course.credits.toString()) : 0;
        
        if (credits > 0 && course.grade && typeof course.grade === 'string') {
          totalCredits += credits;
          
          // Convert letter grade to grade points
          const gradeValue = getGradeValue(course.grade);
          if (gradeValue !== null) {
            totalGradePoints += credits * gradeValue;
          }
        }
      });
    }
    
    return {
      id: semester.id,
      term: semester.name,
      yearLevel: mapYearToLevel(semesterYearMap.get(semester.id) || "Freshman"),
      gpa: semester.gpa,
      credits: totalCredits > 0 ? totalCredits : undefined,
      gradePoints: totalGradePoints > 0 ? totalGradePoints : undefined,
    };
  });
}