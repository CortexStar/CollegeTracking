/* src/utils/organizeSemesters.ts
   -------------------------------------------------------- */

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
  academicYear?: string;
}

interface Course {
  id: string;
  title: string;
  grade: string;
  credits: number;
  gradePoints: number;
}

export interface SemesterSection {
  label: string;          // 'Freshman Year', 'Summer 2024', …
  semesters: Semester[];
}

const TERM_ORDER: Record<string, number> = {
  spring: 1,
  summer: 2,
  fall:   3,
  winter: 4,
};

const YEAR_LABELS = [
  'Freshman Year',
  'Sophomore Year',
  'Junior Year',
  'Senior Year',
];

function parseName(name: string) {
  const m = name.match(/\b(Spring|Summer|Fall|Winter)\s+(\d{4})/i);
  return m ? { term: m[1].toLowerCase(), year: +m[2] } : null;
}

function cmp(a: Semester, b: Semester) {
  const pa = parseName(a.name), pb = parseName(b.name);
  if (!pa || !pb) return 0;
  if (pa.year !== pb.year) return pa.year - pb.year;
  return TERM_ORDER[pa.term] - TERM_ORDER[pb.term];
}

export function organizeSemesters(input: Semester[]): SemesterSection[] {
  const semesters = [...input].sort(cmp);
  const sections: SemesterSection[] = [];
  let nonSummerCount = 0;

  for (const s of semesters) {
    const meta = parseName(s.name);
    if (!meta) {                         // catch‑all
      (sections.find(x => x.label === 'Misc') ??
       sections[sections.push({ label: 'Misc', semesters: [] }) - 1])
      .semesters.push(s);
      continue;
    }

    // summer gets its own bucket
    if (meta.term === 'summer') {
      const lbl = `Summer ${meta.year}`;
      (sections.find(x => x.label === lbl) ??
       sections[sections.push({ label: lbl, semesters: [] }) - 1])
      .semesters.push(s);
      continue;
    }

    // non‑summer → freshman/soph/junior/… (two terms ≈ one year)
    const idx = Math.floor(nonSummerCount / 2);
    const lbl = YEAR_LABELS[idx] ?? `Year ${idx + 1}`;
    (sections.find(x => x.label === lbl) ??
     sections[sections.push({ label: lbl, semesters: [] }) - 1])
    .semesters.push(s);
    nonSummerCount++;
  }

  // final chronological sort of the sections
  sections.sort((a, b) => {
    if (a.semesters.length === 0 || b.semesters.length === 0) return 0;
    return cmp(a.semesters[0], b.semesters[0]);
  });
  
  return sections;
}