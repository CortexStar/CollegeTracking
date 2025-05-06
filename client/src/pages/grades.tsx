import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { nanoid } from "nanoid";

import { organizeSemesters } from "@/utils/organizeSemesters";
import { useToast } from "@/hooks/use-toast";
import { EditableSpan, Editable } from "@/components/ui/inline-edit";

// ─── Constants ──────────────────────────────────────────────────────────

const gradePointValues: Record<string, number> = {
  A: 4.0,
  "A-": 3.67,
  "B+": 3.33,
  B: 3.0,
  "B-": 2.67,
  "C+": 2.33,
  C: 2.0,
  "C-": 1.67,
  "D+": 1.33,
  D: 1.0,
  "D-": 0.67,
  F: 0.0,
  E: 0.0,
};

// ─── Types ──────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
  grade: string;
  credits: number;
  gradePoints: number;
  _uid?: string; // Internal key for React DnD
}

type AcademicYear = "Freshman" | "Sophomore" | "Junior" | "Senior" | "Summer";

interface Semester {
  id: string;
  name: string;
  courses: Course[];
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
  academicYear?: AcademicYear;
}

// ─── Component ──────────────────────────────────────────────────────────

export default function GradesPage() {
  // ── State ────────────────────────────────────────────────────────────
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [rawCourseData, setRawCourseData] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [currentSemesterId, setCurrentSemesterId] = useState<string | null>(null);
  const [newCourseData, setNewCourseData] = useState("");

  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [editedSemesterName, setEditedSemesterName] = useState("");

  const [editingCourse, setEditingCourse] = useState<{
    semesterId: string;
    courseIndex: number;
    field: "id" | "title" | "grade" | "credits";
    value: string;
  } | null>(null);

  const { toast } = useToast();

  // ── Derived stats ────────────────────────────────────────────────────

  const overallStats = semesters.reduce(
    (stats, sem) => ({
      totalCredits: stats.totalCredits + sem.totalCredits,
      totalGradePoints: stats.totalGradePoints + sem.totalGradePoints,
    }),
    { totalCredits: 0, totalGradePoints: 0 }
  );

  const overallGPA = overallStats.totalCredits
    ? +(overallStats.totalGradePoints / overallStats.totalCredits).toFixed(2)
    : 0;

  // ── Effects: load & persist ──────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem("gradeSemesters");
    if (!stored) return;

    const parsed: Semester[] = JSON.parse(stored).map((sem: Semester) => {
      const totalCredits = sem.courses.reduce((s, c) => s + c.credits, 0);
      const totalGradePoints = sem.courses.reduce((s, c) => s + c.gradePoints, 0);
      const gpa = totalCredits ? +(totalGradePoints / totalCredits).toFixed(2) : 0;
      return { ...sem, totalCredits, totalGradePoints, gpa };
    });

    setSemesters(parsed);
  }, []);

  useEffect(() => {
    localStorage.setItem("gradeSemesters", JSON.stringify(semesters));
  }, [semesters]);

  // ── Memo: group by academic year ─────────────────────────────────────

  const organizedSections = useMemo(() => organizeSemesters(semesters), [semesters]);

  // ─── Helpers: parsing / builders ──────────────────────────────────────

  const parseCourseData = (raw: string): Course[] => {
    if (!raw.trim()) return [];

    const COURSE_CODE_RE = /\b[A-Z]{3,4}\d{4}\b/;
    const GRADE_RE = /^(?:A|A-|B\+|B|B-|C\+|C|C-|D\+|D|D-|F|E)(?:\s|$)/i;

    const lines = raw
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const courses: Course[] = [];
    let i = 0;

    while (i < lines.length) {
      while (i < lines.length && !COURSE_CODE_RE.test(lines[i])) i++;
      if (i >= lines.length) break;

      const codeLine = lines[i++];
      const idMatch = codeLine.match(COURSE_CODE_RE);
      const id = idMatch ? idMatch[0] : "UNKNOWN";

      let title = "";
      if (i < lines.length && !GRADE_RE.test(lines[i]) && !/^[-+]?\d/.test(lines[i])) {
        title = lines[i++];
      } else {
        const afterCode = codeLine.slice(codeLine.indexOf(id) + id.length).trim();
        if (afterCode) title = afterCode.replace(/^[-:]\s*/, "");
      }

      let grade = "C";
      while (
        i < lines.length &&
        !GRADE_RE.test(lines[i]) &&
        !/^[-+]?\d/.test(lines[i]) &&
        !COURSE_CODE_RE.test(lines[i])
      )
        i++;
      if (i < lines.length && GRADE_RE.test(lines[i])) grade = lines[i++].toUpperCase();

      const numbers: number[] = [];
      while (i < lines.length && !COURSE_CODE_RE.test(lines[i])) {
        const m = lines[i].match(/[-+]?(\d+(?:\.\d+)?)/);
        if (m) numbers.push(parseFloat(m[1]));
        i++;
      }

      let credits = 3;
      const intCred = numbers.find((n) => Number.isInteger(n) && n >= 1 && n <= 5);
      if (intCred !== undefined) credits = intCred;
      else if (numbers.length) credits = numbers[numbers.length - 1];

      const gradePoints = +(credits * (gradePointValues[grade] ?? 2)).toFixed(2);

      courses.push({
        id,
        title: title || id,
        grade,
        credits,
        gradePoints,
      });
    }

    return courses;
  };

  const makeBlankCourse = (): Course => ({
    id: "",
    title: "",
    grade: "",
    credits: 0,
    gradePoints: 0,
    _uid: nanoid(6) as unknown as never,
  });

  // ─── CRUD: semesters ─────────────────────────────────────────────────

  const addSemester = () => {
    const id = Date.now().toString();

    let courses: Course[] = [];
    if (rawCourseData.trim()) {
      courses = parseCourseData(rawCourseData);
      if (!courses.length) {
        toast({
          title: "Error",
          description: "Could not parse any valid courses from the input",
          variant: "destructive",
        });
        return;
      }
    }

    const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
    const totalGradePoints = courses.reduce((s, c) => s + c.gradePoints, 0);
    const gpa = totalCredits ? +(totalGradePoints / totalCredits).toFixed(2) : 0;

    setSemesters((prev) => [
      ...prev,
      {
        id,
        name: newSemesterName || "New Semester",
        courses,
        totalCredits,
        totalGradePoints,
        gpa,
      },
    ]);

    setNewSemesterName("");
    setRawCourseData("");
    setIsDialogOpen(false);

    if (!newSemesterName) {
      // open inline editor immediately for default name
      setTimeout(() => startEditingSemesterName(id, "New Semester"), 0);
    }
  };

  const removeSemester = (id: string) => setSemesters((prev) => prev.filter((s) => s.id !== id));

  // ─── CRUD: courses ───────────────────────────────────────────────────

  const addCourseToSemester = () => {
    if (!currentSemesterId) return;

    let newCourses: Course[] = [];
    if (newCourseData.trim()) {
      newCourses = parseCourseData(newCourseData);
      if (!newCourses.length) {
        toast({
          title: "Error",
          description: "Could not parse any valid courses from the input",
          variant: "destructive",
        });
        return;
      }
    } else {
      newCourses = [makeBlankCourse()];
    }

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;
        const courses = [...sem.courses, ...newCourses];
        const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
        const totalGradePoints = courses.reduce((s, c) => s + c.gradePoints, 0);
        const gpa = totalCredits ? +(totalGradePoints / totalCredits).toFixed(2) : 0;
        return { ...sem, courses, totalCredits, totalGradePoints, gpa };
      })
    );

    setIsAddCourseDialogOpen(false);
    setNewCourseData("");
  };

  const removeCourse = (semesterId: string, index: number) =>
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== semesterId) return sem;
        const courses = [...sem.courses];
        courses.splice(index, 1);
        const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
        const totalGradePoints = courses.reduce((s, c) => s + c.gradePoints, 0);
        const gpa = totalCredits ? +(totalGradePoints / totalCredits).toFixed(2) : 0;
        return { ...sem, courses, totalCredits, totalGradePoints, gpa };
      })
    );

  // ─── Inline‑edit handlers ────────────────────────────────────────────

  const startEditingSemesterName = (id: string, currentName: string) => {
    setEditingSemesterId(id);
    setEditedSemesterName(currentName);
  };

  const saveEditedSemesterName = (newName?: string) => {
    if (!editingSemesterId) return;

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === editingSemesterId ? { ...sem, name: newName || sem.name } : sem
      )
    );

    setEditingSemesterId(null);
    setEditedSemesterName("");
  };

  const startEditingCourse = (
    semesterId: string,
    courseIndex: number,
    field: "id" | "title" | "grade" | "credits",
    currentValue: string
  ) => {
    setEditingCourse({ semesterId, courseIndex, field, value: currentValue });
  };

  const saveEditedCourse = (override?: string) => {
    if (!editingCourse) return;

    const { semesterId, courseIndex, field } = editingCourse;
    const value = override ?? editingCourse.value;

    if (field === "credits") {
      const n = parseFloat(value);
      if (isNaN(n) || n < 0) {
        toast({
          title: "Invalid Credits",
          description: "Credits must be a positive number",
          variant: "destructive",
        });
        return;
      }
    }

    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== semesterId) return sem;
        const courses = [...sem.courses];
        const c = { ...courses[courseIndex] };

        switch (field) {
          case "id":
            c.id = value;
            break;
          case "title":
            c.title = value;
            break;
          case "grade":
            c.grade = value.toUpperCase();
            c.gradePoints = +(c.credits * (gradePointValues[c.grade] ?? 2)).toFixed(2);
            break;
          case "credits": {
            const num = parseFloat(value);
            c.credits = num;
            c.gradePoints = +(num * (gradePointValues[c.grade] ?? 2)).toFixed(2);
            break;
          }
        }

        courses[courseIndex] = c;
        const totalCredits = courses.reduce((s, v) => s + v.credits, 0);
        const totalGradePoints = courses.reduce((s, v) => s + v.gradePoints, 0);
        const gpa = totalCredits ? +(totalGradePoints / totalCredits).toFixed(2) : 0;
        return { ...sem, courses, totalCredits, totalGradePoints, gpa };
      })
    );

    setEditingCourse(null);
  };

  // ─── Drag‑and‑drop ───────────────────────────────────────────────────

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;
    setSemesters((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(src, 1);
      copy.splice(dst, 0, moved);
      return copy;
    });
  };

  // ─── JSX ─────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl">
      {/* Overview cards */}
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-6">Grades & Forecasting</h1>
          <div className="flex mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg justify-between items-center">
            <div>
              <h3 className="text-xl font-medium">Overall GPA</h3>
              <p className="text-4xl font-bold mt-2 min-w-[3.5ch] text-left">
                {overallGPA.toFixed(2)}
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">Total Credits</h3>
              <p className="text-4xl font-bold mt-2 min-w-[3.5ch] text-left">
                {overallStats.totalCredits.toFixed(1)}
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">Total Grade Points</h3>
              <p className="text-4xl font-bold mt-2 min-w-[3.5ch] text-left">
                {overallStats.totalGradePoints.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Semester tracking card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-4xl font-bold">Semester Tracking</CardTitle>
            {/* Add semester dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Add Semester
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Semester</DialogTitle>
                  <DialogDescription>
                    Enter a name for the semester and optionally add course information.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Semester Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Fall 2025"
                      value={newSemesterName}
                      onChange={(e) => setNewSemesterName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="courseData">Course Information (Optional)</Label>
                    <Textarea
                      id="courseData"
                      placeholder="Enter course information"
                      rows={10}
                      className="font-mono text-sm"
                      value={rawCourseData}
                      onChange={(e) => setRawCourseData(e.target.value)}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Format: Course ID, Course Title, Grade, Credits (one per line)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={addSemester}>Add Semester</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>

          {/* Semester list */}
          <CardContent>
            {semesters.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No semesters added yet.</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Click "Add Semester" to get started.
                </p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="semesters" type="SEMESTERS">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {organizedSections.map((section) => {
                        if (!section.semesters.length) return null;
                        return (
                          <div key={section.label} className="mb-6">
                            <h3 className="text-lg font-semibold tracking-wider uppercase text-gray-400 mb-3">
                              {section.label.replace(/ *Year$/i, "")}
                            </h3>
                            <Accordion type="single" collapsible className="w-full mb-4">
                              {section.semesters.map((semester) => {
                                const semesterIndex = semesters.findIndex(
                                  (s) => s.id === semester.id
                                );
                                return (
                                  <Draggable
                                    key={semester.id}
                                    draggableId={semester.id}
                                    index={semesterIndex}
                                  >
                                    {(drag) => (
                                      <div
                                        ref={drag.innerRef}
                                        {...drag.draggableProps}
                                        className="mb-2"
                                      >
                                        <AccordionItem
                                          value={semester.id}
                                          className="border rounded-md overflow-hidden"
                                        >
                                          <ContextMenu>
                                            <ContextMenuTrigger className="w-full block">
                                              <AccordionTrigger
                                                {...drag.dragHandleProps}
                                                className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 hover:no-underline"
                                              >
                                                <div className="flex items-center justify-between w-full pr-4">
                                                  <div className="flex items-center">
                                                    {editingSemesterId === semester.id ? (
                                                      <EditableSpan
                                                        value={editedSemesterName}
                                                        onSave={saveEditedSemesterName}
                                                      />
                                                    ) : (
                                                      <Editable
                                                        onEdit={() =>
                                                          startEditingSemesterName(
                                                            semester.id,
                                                            semester.name
                                                          )
                                                        }
                                                      >
                                                        {semester.name}
                                                      </Editable>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-5">
                                                    <div className="text-right">
                                                      <span className="text-sm text-gray-500">
                                                        GPA
                                                      </span>
                                                      <p className="font-semibold min-w-[3ch] text-right">
                                                        {semester.gpa.toFixed(2)}
                                                      </p>
                                                    </div>
                                                    <div className="text-right">
                                                      <span className="text-sm text-gray-500">
                                                        Credits
                                                      </span>
                                                      <p className="font-semibold min-w-[3ch] text-right">
                                                        {semester.totalCredits.toFixed(1)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </AccordionTrigger>
                                            </ContextMenuTrigger>

                                            {/* Right‑click menu on semester */}
                                            <ContextMenuContent>
                                              <ContextMenuItem
                                                onClick={() => {
                                                  setCurrentSemesterId(semester.id);
                                                  setIsAddCourseDialogOpen(true);
                                                }}
                                              >
                                                Add Course
                                              </ContextMenuItem>
                                              <ContextMenuSeparator />
                                              <ContextMenuItem
                                                className="text-red-500 hover:text-red-600 focus:text-red-600"
                                                onClick={() => removeSemester(semester.id)}
                                              >
                                                Delete Semester
                                              </ContextMenuItem>
                                            </ContextMenuContent>
                                          </ContextMenu>

                                          {/* Courses table */}
                                          <AccordionContent className="px-4 pt-2 pb-4">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="w-32">Course ID</TableHead>
                                                  <TableHead>Course Title</TableHead>
                                                  <TableHead className="w-20 text-center">
                                                    Grade
                                                  </TableHead>
                                                  <TableHead className="w-20 text-center">
                                                    Credits
                                                  </TableHead>
                                                  <TableHead className="w-32 text-center">
                                                    Grade Points
                                                  </TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {semester.courses.length === 0 ? (
                                                  <TableRow>
                                                    <TableCell
                                                      colSpan={5}
                                                      className="text-center py-8 text-gray-500"
                                                    >
                                                      No courses added yet. Right‑click the semester
                                                      and select "Add Course" to add courses.
                                                    </TableCell>
                                                  </TableRow>
                                                ) : (
                                                  semester.courses.map((course, idx) => {
                                                    const points =
                                                      course.credits *
                                                      (gradePointValues[course.grade] ?? 2);
                                                    return (
                                                      <ContextMenu key={course._uid ?? idx}>
                                                        <ContextMenuTrigger asChild>
                                                          <TableRow>
                                                            {/* Course ID */}
                                                            <TableCell className="font-medium">
                                                              {editingCourse &&
                                                              editingCourse.semesterId ===
                                                                semester.id &&
                                                              editingCourse.courseIndex === idx &&
                                                              editingCourse.field === "id" ? (
                                                                <EditableSpan
                                                                  value={editingCourse.value}
                                                                  onSave={saveEditedCourse}
                                                                  align="center"
                                                                />
                                                              ) : (
                                                                <Editable
                                                                  onEdit={() =>
                                                                    startEditingCourse(
                                                                      semester.id,
                                                                      idx,
                                                                      "id",
                                                                      course.id
                                                                    )
                                                                  }
                                                                >
                                                                  {course.id}
                                                                </Editable>
                                                              )}
                                                            </TableCell>
                                                            {/* Title */}
                                                            <TableCell>
                                                              {editingCourse &&
                                                              editingCourse.semesterId ===
                                                                semester.id &&
                                                              editingCourse.courseIndex === idx &&
                                                              editingCourse.field === "title" ? (
                                                                <EditableSpan
                                                                  value={editingCourse.value}
                                                                  onSave={saveEditedCourse}
                                                                />
                                                              ) : (
                                                                <Editable
                                                                  onEdit={() =>
                                                                    startEditingCourse(
                                                                      semester.id,
                                                                      idx,
                                                                      "title",
                                                                      course.title
                                                                    )
                                                                  }
                                                                >
                                                                  {course.title}
                                                                </Editable>
                                                              )}
                                                            </TableCell>
                                                            {/* Grade */}
                                                            <TableCell className="text-center">
                                                              {editingCourse &&
                                                              editingCourse.semesterId ===
                                                                semester.id &&
                                                              editingCourse.courseIndex === idx &&
                                                              editingCourse.field === "grade" ? (
                                                                <EditableSpan
                                                                  value={editingCourse.value}
                                                                  onSave={saveEditedCourse}
                                                                  align="center"
                                                                />
                                                              ) : (
                                                                <Editable
                                                                  align="center"
                                                                  onEdit={() =>
                                                                    startEditingCourse(
                                                                      semester.id,
                                                                      idx,
                                                                      "grade",
                                                                      course.grade
                                                                    )
                                                                  }
                                                                >
                                                                  {course.grade}
                                                                </Editable>
                                                              )}
                                                            </TableCell>
                                                            {/* Credits */}
                                                            <TableCell className="text-center">
                                                              {editingCourse &&
                                                              editingCourse.semesterId ===
                                                                semester.id &&
                                                              editingCourse.courseIndex === idx &&
                                                              editingCourse.field === "credits" ? (
                                                                <EditableSpan
                                                                  value={editingCourse.value}
                                                                  onSave={saveEditedCourse}
                                                                  align="center"
                                                                  numeric
                                                                />
                                                              ) : (
                                                                <Editable
                                                                  align="center"
                                                                  onEdit={() =>
                                                                    startEditingCourse(
                                                                      semester.id,
                                                                      idx,
                                                                      "credits",
                                                                      course.credits.toString()
                                                                    )
                                                                  }
                                                                >
                                                                  {course.credits.toFixed(1)}
                                                                </Editable>
                                                              )}
                                                            </TableCell>
                                                            {/* Grade Points */}
                                                            <TableCell className="text-center">
                                                              {points.toFixed(2)}
                                                            </TableCell>
                                                          </TableRow>
                                                        </ContextMenuTrigger>
                                                        <ContextMenuContent>
                                                          <ContextMenuItem
                                                            className="text-red-500 hover:text-red-600 focus:text-red-600"
                                                            onClick={() =>
                                                              removeCourse(semester.id, idx)
                                                            }
                                                          >
                                                            Delete Course
                                                          </ContextMenuItem>
                                                        </ContextMenuContent>
                                                      </ContextMenu>
                                                    );
                                                  })
                                                )}
                                              </TableBody>
                                            </Table>
                                          </AccordionContent>
                                        </AccordionItem>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </Accordion>
                          </div>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: add course */}
      <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
            <DialogDescription>Enter course information to add to this semester.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="courseData">Course Information</Label>
              <Textarea
                id="courseData"
                placeholder="Enter course information"
                rows={10}
                className="font-mono text-sm"
                value={newCourseData}
                onChange={(e) => setNewCourseData(e.target.value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Format: Course ID, Course Title, Grade, Credits (one per line)
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={addCourseToSemester}>Add Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collapsible: grade scale */}
      <Collapsible
        open={false}
        onOpenChange={() => {}}
        className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg w-72 z-10 mx-auto overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex justify-between items-center p-4"
          >
            <span>Grade Point Scale</span>
            <span>▼</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2 px-6">Grade</TableHead>
                <TableHead className="w-1/2 px-6 text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(gradePointValues).map(([g, p]) => (
                <TableRow key={g}>
                  <TableCell className="px-6">{g}</TableCell>
                  <TableCell className="px-6 text-right">{p.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
