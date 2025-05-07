import { Semester } from "@/components/GpaDashboard";

const ORDER = ["Fall", "Spring"] as const;
const LEVELS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;

export function generateFutureSemesters(existing: Semester[]): Semester[] {
  if (!existing.length) return [];

  // sort existing just in case
  const semesters = [...existing].sort(
    (a, b) => new Date(a.term).getTime() - new Date(b.term).getTime()
  );

  const last = semesters[semesters.length - 1];
  const [lastSeason, lastYear] = last.term.split(" ") as [typeof ORDER[number], string];
  let seasonIdx = ORDER.indexOf(lastSeason);
  let year = Number(lastYear);
  let levelIdx = LEVELS.indexOf(last.yearLevel);

  while (levelIdx < LEVELS.length) {
    // advance to next term
    seasonIdx = (seasonIdx + 1) % 2;
    if (seasonIdx === 0) year += 1; // wrapped from Spring -> Fall

    if (seasonIdx === 0 && levelIdx < LEVELS.length - 1) levelIdx++; // promote after Spring

    const next: Semester = {
      id: `${ORDER[seasonIdx]}${year}`,
      term: `${ORDER[seasonIdx]} ${year}`,
      yearLevel: LEVELS[levelIdx],
      gpa: null,
    };

    // stop once we've added Senior Spring
    semesters.push(next);
    if (next.yearLevel === "Senior" && ORDER[seasonIdx] === "Spring") break;
  }

  return semesters;
}