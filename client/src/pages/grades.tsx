import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organizeSemesters } from "@/utils/organizeSemesters";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { createToastHelpers } from "@/utils/toast-helpers";
import { parseCourseData, makeBlankCourse, Semester } from "@/utils/parseCourseData";
import { calculateSemesterTotals, calculateGradePoints } from "@/utils/grade-utils";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import SemesterDropdown from "@/components/semester/SemesterDropdown";
import OverviewStats from "@/components/semester/OverviewStats";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * GradesPage component - manages student grades and GPA calculations
 */
export default function GradesPage() {
  // Use localStorage hook for persisting semesters
  const [semesters, setSemesters] = useLocalStorage<Semester[]>("gradeSemesters", []);
  
  // Form state
  const [newSemesterName, setNewSemesterName] = useState("");
  const [rawCourseData, setRawCourseData] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [currentSemesterId, setCurrentSemesterId] = useState<string | null>(null);
  const [newCourseData, setNewCourseData] = useState("");
  
  // Editing state
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [editedSemesterName, setEditedSemesterName] = useState("");
  const [isGradeScaleOpen, setIsGradeScaleOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<{
    semesterId: string;
    courseIndex: number;
    field: "id" | "title" | "grade" | "credits";
    value: string;
  } | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const { toastSuccess, toastError } = createToastHelpers({ toast });

  // Calculate overall stats with useMemo to avoid recalculating on every render
  const overallStats = useMemo(() => {
    return semesters.reduce(
      (stats, semester) => {
        return {
          totalCredits: stats.totalCredits + semester.totalCredits,
          totalGradePoints: stats.totalGradePoints + semester.totalGradePoints,
        };
      },
      { totalCredits: 0, totalGradePoints: 0 }
    );
  }, [semesters]);

  // Calculate overall GPA 
  const overallGPA = useMemo(() => {
    return overallStats.totalCredits > 0
      ? Math.round((overallStats.totalGradePoints / overallStats.totalCredits) * 100) / 100
      : 0;
  }, [overallStats]);

  // Memoize organized sections to prevent recalculation on every render
  const organizedSections = useMemo(() => {
    return organizeSemesters(semesters);
  }, [semesters]);

  // Handle drag-end event for semester reordering with useCallback
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reorderedSemesters = [...semesters];
    const [removed] = reorderedSemesters.splice(sourceIndex, 1);
    reorderedSemesters.splice(destinationIndex, 0, removed);

    setSemesters(reorderedSemesters);
  }, [semesters, setSemesters]);

  // Add a new semester
  const addSemester = useCallback(() => {
    // If no courses data is entered, create empty semester
    if (!rawCourseData.trim()) {
      const newSemesterId = Date.now().toString();

      const newSemester: Semester = {
        id: newSemesterId,
        name: newSemesterName || "New Semester",
        courses: [],
        totalCredits: 0,
        totalGradePoints: 0,
        gpa: 0,
      };

      setSemesters((prev) => [...prev, newSemester]);
      setNewSemesterName("");
      setIsDialogOpen(false);

      // Start editing the semester name immediately if using default
      if (!newSemesterName) {
        setTimeout(() => {
          startEditingSemesterName(newSemesterId, "New Semester");
        }, 100);
      }
      return;
    }

    // Otherwise proceed with course data
    const courses = parseCourseData(rawCourseData);

    if (courses.length === 0) {
      toastError("Could not parse any valid courses from the input");
      return;
    }

    // Calculate semester totals
    const { totalCredits, totalGradePoints, gpa } = calculateSemesterTotals(courses);

    const newSemester: Semester = {
      id: Date.now().toString(),
      name: newSemesterName || "New Semester",
      courses,
      totalCredits,
      totalGradePoints,
      gpa,
    };

    setSemesters((prev) => [...prev, newSemester]);
    setNewSemesterName("");
    setRawCourseData("");
    setIsDialogOpen(false);
  }, [newSemesterName, rawCourseData, setSemesters, toastError]);

  // Add course to existing semester
  const addCourseToSemester = useCallback(() => {
    if (!currentSemesterId) return;

    let coursesToAdd = [];

    if (newCourseData.trim()) {
      coursesToAdd = parseCourseData(newCourseData);
      if (coursesToAdd.length === 0) {
        toastError("Could not parse any valid courses from the input");
        return;
      }
    } else {
      coursesToAdd = [makeBlankCourse()];
    }

    // remember where the new row will be inserted
    const indexMap: Record<string, number> = {};
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== currentSemesterId) return sem;
        indexMap[sem.id] = sem.courses.length; // position of first new row
        const updatedCourses = [...sem.courses, ...coursesToAdd];

        const { totalCredits, totalGradePoints, gpa } = calculateSemesterTotals(updatedCourses);

        return {
          ...sem,
          courses: updatedCourses,
          totalCredits,
          totalGradePoints,
          gpa,
        };
      })
    );

    // if user added a BLANK row, open it in edit-mode immediately
    if (!newCourseData.trim()) {
      setTimeout(() => {
        startEditingCourse(currentSemesterId, indexMap[currentSemesterId], "id", "");
      }, 0);
    }

    setNewCourseData("");
    setIsAddCourseDialogOpen(false);
  }, [currentSemesterId, newCourseData, setSemesters, toastError]);

  // Remove a semester
  const removeSemester = useCallback((id: string) => {
    setSemesters((prev) => prev.filter((semester) => semester.id !== id));
  }, [setSemesters]);

  // Remove one course
  const removeCourse = useCallback((semesterId: string, index: number) => {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== semesterId) return sem;
        const updated = [...sem.courses];
        updated.splice(index, 1);

        const { totalCredits, totalGradePoints, gpa } = calculateSemesterTotals(updated);

        return {
          ...sem,
          courses: updated,
          totalCredits,
          totalGradePoints,
          gpa,
        };
      })
    );
  }, [setSemesters]);

  // Start editing a semester name
  const startEditingSemesterName = useCallback((id: string, currentName: string) => {
    setEditingSemesterId(id);
    setEditedSemesterName(currentName);
  }, []);

  // Save edited semester name
  const saveEditedSemesterName = useCallback((newName?: string) => {
    if (!editingSemesterId) return;

    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === editingSemesterId
          ? { ...semester, name: (newName ?? editedSemesterName) || semester.name }
          : semester
      )
    );

    setEditingSemesterId(null);
    setEditedSemesterName("");
  }, [editingSemesterId, editedSemesterName, setSemesters]);

  // Start editing a course field
  const startEditingCourse = useCallback(
    (semesterId: string, courseIndex: number, field: "id" | "title" | "grade" | "credits", currentValue: string) => {
      setEditingCourse({
        semesterId,
        courseIndex,
        field,
        value: currentValue,
      });
    },
    []
  );

  // Save edited course field
  const saveEditedCourse = useCallback((override?: string) => {
    if (!editingCourse) return;

    const { semesterId, courseIndex, field } = editingCourse;
    const value = override ?? editingCourse.value;

    // Special validation for credits (must be a number)
    if (field === "credits") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        toastError("Credits must be a positive number");
        return;
      }
    }

    setSemesters((prev) => {
      return prev.map((semester) => {
        if (semester.id === semesterId) {
          const updatedCourses = [...semester.courses];
          const course = { ...updatedCourses[courseIndex] };

          if (field === "id") {
            course.id = value;
          } else if (field === "title") {
            course.title = value;
          } else if (field === "grade") {
            course.grade = value.toUpperCase();
            // Recalculate grade points
            course.gradePoints = calculateGradePoints(course.credits, course.grade);
          } else if (field === "credits") {
            const credits = parseFloat(value);
            course.credits = credits;
            // Recalculate grade points
            course.gradePoints = calculateGradePoints(credits, course.grade);
          }

          updatedCourses[courseIndex] = course;

          // Recalculate semester totals
          const { totalCredits, totalGradePoints, gpa } = calculateSemesterTotals(updatedCourses);

          return {
            ...semester,
            courses: updatedCourses,
            totalCredits,
            totalGradePoints,
            gpa,
          };
        }
        return semester;
      });
    });

    setEditingCourse(null);
  }, [editingCourse, setSemesters, toastError]);

  // Open course addition dialog for a specific semester
  const openAddCourseDialog = useCallback((semesterId: string) => {
    setCurrentSemesterId(semesterId);
    setIsAddCourseDialogOpen(true);
  }, []);

  return (
    <div className="container py-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Grades & GPA Calculator</h1>
      
      {/* Overall Stats */}
      <OverviewStats 
        totalCredits={overallStats.totalCredits}
        totalGradePoints={overallStats.totalGradePoints}
        overallGPA={overallGPA}
      />

      {/* Grade Scale Reference */}
      <Collapsible
        open={isGradeScaleOpen}
        onOpenChange={setIsGradeScaleOpen}
        className="mb-6 bg-card rounded-lg p-4 border"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Grade Scale Reference</h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isGradeScaleOpen ? "Hide" : "Show"}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="font-medium">A = 4.0</div>
              <div className="font-medium">A- = 3.67</div>
            </div>
            <div>
              <div className="font-medium">B+ = 3.33</div>
              <div className="font-medium">B = 3.0</div>
              <div className="font-medium">B- = 2.67</div>
            </div>
            <div>
              <div className="font-medium">C+ = 2.33</div>
              <div className="font-medium">C = 2.0</div>
              <div className="font-medium">C- = 1.67</div>
            </div>
            <div>
              <div className="font-medium">D+ = 1.33</div>
              <div className="font-medium">D = 1.0</div>
              <div className="font-medium">D- = 0.67</div>
              <div className="font-medium">F = 0.0</div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Semesters Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Semesters</h2>
          <Button onClick={() => setIsDialogOpen(true)}>Add Semester</Button>
        </div>

        {/* Semesters List with Drag-and-Drop */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="semesters">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {organizedSections.map((section) => (
                  <div key={section.year}>
                    <h3 className="text-xl font-semibold mb-4">{section.year}</h3>
                    {section.semesters.map((semester, index) => (
                      <SemesterDropdown
                        key={semester.id}
                        semester={semester}
                        index={index}
                        editing={editingCourse}
                        editingSemesterId={editingSemesterId}
                        editedSemesterName={editedSemesterName}
                        onStartEditingSemesterName={startEditingSemesterName}
                        onSaveEditedSemesterName={saveEditedSemesterName}
                        onStartEditingCourse={startEditingCourse}
                        onSaveEditedCourse={saveEditedCourse}
                        onRemoveSemester={removeSemester}
                        onAddCourse={openAddCourseDialog}
                        onRemoveCourse={removeCourse}
                      />
                    ))}
                  </div>
                ))}
                {organizedSections.length === 0 && (
                  <div className="bg-card rounded-lg p-6 text-center">
                    <p className="text-muted-foreground mb-3">No semesters added yet.</p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      Add Your First Semester
                    </Button>
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Add Semester Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Semester</DialogTitle>
            <DialogDescription>
              Enter a semester name and paste course information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="semesterName">Semester Name</Label>
              <Input
                id="semesterName"
                value={newSemesterName}
                onChange={(e) => setNewSemesterName(e.target.value)}
                placeholder="Fall 2023"
              />
            </div>
            <div>
              <Label htmlFor="courseData">Course Information (Optional)</Label>
              <Textarea
                id="courseData"
                rows={10}
                value={rawCourseData}
                onChange={(e) => setRawCourseData(e.target.value)}
                placeholder={`MATH1101\nCalculus I\nA\n4\n\nPHYS1101\nIntroductory Physics\nB+\n3`}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
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

      {/* Add Course Dialog */}
      <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
            <DialogDescription>
              Enter course information or leave blank to add an empty course.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="courseData">Course Information</Label>
            <Textarea
              id="courseData"
              rows={6}
              value={newCourseData}
              onChange={(e) => setNewCourseData(e.target.value)}
              placeholder={`MATH1101\nCalculus I\nA\n4`}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: Course ID, Course Title, Grade, Credits (one per line)
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={addCourseToSemester}>Add Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}