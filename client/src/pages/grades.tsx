import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organizeSemesters } from "@/utils/organizeSemesters";
import Layout from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';

interface Course {
  id: string;
  title: string;
  grade: string;
  credits: number;
  gradePoints: number;
}

type AcademicYear = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Summer';

interface Semester {
  id: string;
  name: string;
  courses: Course[];
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
  academicYear?: AcademicYear;
}

const gradePointMap: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'D-': 0.7,
  'F': 0.0,
};

export default function GradesPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isAddSemesterDialogOpen, setIsAddSemesterDialogOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseGrade, setNewCourseGrade] = useState("");
  const [newCourseCredits, setNewCourseCredits] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const importTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Organize semesters into sections (Freshman Year, Sophomore Year, etc.)
  const semesterSections = useMemo(() => {
    return organizeSemesters(semesters);
  }, [semesters]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    semesters.forEach((semester) => {
      totalCredits += semester.totalCredits;
      totalGradePoints += semester.totalGradePoints;
    });

    return { totalCredits, totalGradePoints };
  }, [semesters]);

  const overallGPA = useMemo(() => {
    if (overallStats.totalCredits === 0) return 0;
    return overallStats.totalGradePoints / overallStats.totalCredits;
  }, [overallStats]);

  useEffect(() => {
    const savedSemesters = localStorage.getItem("semesters");
    if (savedSemesters) {
      try {
        setSemesters(JSON.parse(savedSemesters));
      } catch (error) {
        console.error("Error parsing saved semesters:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("semesters", JSON.stringify(semesters));
  }, [semesters]);

  const handleAddSemester = () => {
    if (!newSemesterName.trim()) return;

    const newSemester: Semester = {
      id: uuidv4(),
      name: newSemesterName.trim(),
      courses: [],
      totalCredits: 0,
      totalGradePoints: 0,
      gpa: 0,
    };

    setSemesters([...semesters, newSemester]);
    setNewSemesterName("");
    setIsAddSemesterDialogOpen(false);
  };

  const handleAddCourse = () => {
    if (!selectedSemesterId) return;

    // Allow adding even if fields are empty
    const title = newCourseTitle.trim() || "New Course";
    const grade = newCourseGrade.trim() || "A";
    const credits = parseFloat(newCourseCredits) || 3;

    const gradePoints = credits * (grade in gradePointMap ? gradePointMap[grade] : 4.0);

    const newCourse: Course = {
      id: uuidv4(),
      title,
      grade,
      credits,
      gradePoints,
    };

    const updatedSemesters = semesters.map((semester) => {
      if (semester.id === selectedSemesterId) {
        const updatedCourses = [...semester.courses, newCourse];
        const totalCredits = updatedCourses.reduce(
          (sum, course) => sum + course.credits,
          0
        );
        const totalGradePoints = updatedCourses.reduce(
          (sum, course) => sum + course.gradePoints,
          0
        );
        
        return {
          ...semester,
          courses: updatedCourses,
          totalCredits,
          totalGradePoints,
          gpa: totalCredits > 0 ? totalGradePoints / totalCredits : 0,
        };
      }
      return semester;
    });

    setSemesters(updatedSemesters);
    setNewCourseTitle("");
    setNewCourseGrade("");
    setNewCourseCredits("");
    setIsAddCourseDialogOpen(false);
  };

  const handleDeleteSemester = (semesterId: string) => {
    setSemesters(semesters.filter((semester) => semester.id !== semesterId));
  };

  const handleDeleteCourse = (semesterId: string, courseId: string) => {
    const updatedSemesters = semesters.map((semester) => {
      if (semester.id === semesterId) {
        const updatedCourses = semester.courses.filter(
          (course) => course.id !== courseId
        );
        const totalCredits = updatedCourses.reduce(
          (sum, course) => sum + course.credits,
          0
        );
        const totalGradePoints = updatedCourses.reduce(
          (sum, course) => sum + course.gradePoints,
          0
        );
        
        return {
          ...semester,
          courses: updatedCourses,
          totalCredits,
          totalGradePoints,
          gpa: totalCredits > 0 ? totalGradePoints / totalCredits : 0,
        };
      }
      return semester;
    });

    setSemesters(updatedSemesters);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Moving semesters within the same section
    if (
      source.droppableId.startsWith('semester-section-') &&
      destination.droppableId.startsWith('semester-section-')
    ) {
      const sourceSectionId = source.droppableId.replace('semester-section-', '');
      const destSectionId = destination.droppableId.replace('semester-section-', '');
      
      const sourceSection = semesterSections.find(section => section.label === sourceSectionId);
      const destSection = semesterSections.find(section => section.label === destSectionId);
      
      if (!sourceSection || !destSection) return;
      
      const sourceIndex = source.index;
      const destIndex = destination.index;
      
      // If within same section
      if (sourceSectionId === destSectionId) {
        const updatedSemesters = [...semesters];
        const movedSemesterIndex = semesters.findIndex(sem => sem.id === sourceSection.semesters[sourceIndex].id);
        const movingAfterIndex = semesters.findIndex(sem => sem.id === sourceSection.semesters[destIndex].id);
        
        if (movedSemesterIndex === -1 || movingAfterIndex === -1) return;
        
        const [removed] = updatedSemesters.splice(movedSemesterIndex, 1);
        updatedSemesters.splice(movedSemesterIndex < movingAfterIndex ? movingAfterIndex : movingAfterIndex, 0, removed);
        
        setSemesters(updatedSemesters);
      }
      // Between different sections
      else {
        // This is more complex and would require changing academicYear property
        // For simplicity, we'll just update the UI without changing the category
        const updatedSemesters = [...semesters];
        const movedSemesterIndex = semesters.findIndex(sem => sem.id === sourceSection.semesters[sourceIndex].id);
        
        if (movedSemesterIndex === -1) return;
        
        const [removed] = updatedSemesters.splice(movedSemesterIndex, 1);
        
        // Find position in destination section
        const destSemesterIds = destSection.semesters.map(sem => sem.id);
        let insertAt = destIndex;
        
        // Find the absolute position in the full semesters array
        if (destIndex < destSemesterIds.length) {
          const afterId = destSemesterIds[destIndex];
          insertAt = semesters.findIndex(sem => sem.id === afterId);
        } else {
          // If dropping at the end of the section, find the last semester in the section
          const lastInSection = destSemesterIds[destSemesterIds.length - 1];
          insertAt = semesters.findIndex(sem => sem.id === lastInSection) + 1;
        }
        
        updatedSemesters.splice(insertAt, 0, removed);
        setSemesters(updatedSemesters);
      }
    }
    // Moving courses within a semester
    else if (source.droppableId.startsWith('courses-') && destination.droppableId.startsWith('courses-')) {
      const sourceSemesterId = source.droppableId.replace('courses-', '');
      const destSemesterId = destination.droppableId.replace('courses-', '');
      
      const updatedSemesters = semesters.map(semester => {
        // Handle moving within the same semester
        if (semester.id === sourceSemesterId && sourceSemesterId === destSemesterId) {
          const updatedCourses = [...semester.courses];
          const [removed] = updatedCourses.splice(source.index, 1);
          updatedCourses.splice(destination.index, 0, removed);
          return { ...semester, courses: updatedCourses };
        }
        
        // Handle moving to a different semester
        if (semester.id === sourceSemesterId) {
          const updatedCourses = [...semester.courses];
          const [removed] = updatedCourses.splice(source.index, 1);
          
          const totalCredits = updatedCourses.reduce(
            (sum, course) => sum + course.credits, 0
          );
          const totalGradePoints = updatedCourses.reduce(
            (sum, course) => sum + course.gradePoints, 0
          );
          
          return {
            ...semester,
            courses: updatedCourses,
            totalCredits,
            totalGradePoints,
            gpa: totalCredits > 0 ? totalGradePoints / totalCredits : 0,
          };
        }
        
        if (semester.id === destSemesterId) {
          const sourceSemester = semesters.find(sem => sem.id === sourceSemesterId);
          if (!sourceSemester) return semester;
          
          const courseToMove = sourceSemester.courses[source.index];
          const updatedCourses = [...semester.courses];
          updatedCourses.splice(destination.index, 0, courseToMove);
          
          const totalCredits = updatedCourses.reduce(
            (sum, course) => sum + course.credits, 0
          );
          const totalGradePoints = updatedCourses.reduce(
            (sum, course) => sum + course.gradePoints, 0
          );
          
          return {
            ...semester,
            courses: updatedCourses,
            totalCredits,
            totalGradePoints,
            gpa: totalCredits > 0 ? totalGradePoints / totalCredits : 0,
          };
        }
        
        return semester;
      });
      
      setSemesters(updatedSemesters);
    }
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) {
      setIsImportDialogOpen(false);
      return;
    }

    try {
      // Parse the import text and create courses
      const lines = importText.trim().split('\n');
      const parsedCourses: Course[] = [];

      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          // Last part is grade, second to last is credits, rest is title
          const grade = parts[parts.length - 1];
          const creditsStr = parts[parts.length - 2];
          const title = parts.slice(0, parts.length - 2).join(' ');

          const credits = parseFloat(creditsStr) || 3;
          const gradePoints = credits * (grade in gradePointMap ? gradePointMap[grade] : 4.0);

          parsedCourses.push({
            id: uuidv4(),
            title: title || "Imported Course",
            grade: grade || "A",
            credits,
            gradePoints
          });
        }
      });

      if (parsedCourses.length > 0) {
        const newSemester: Semester = {
          id: uuidv4(),
          name: "Imported Semester",
          courses: parsedCourses,
          totalCredits: parsedCourses.reduce((sum, course) => sum + course.credits, 0),
          totalGradePoints: parsedCourses.reduce((sum, course) => sum + course.gradePoints, 0),
          gpa: 0
        };

        // Calculate GPA
        newSemester.gpa = newSemester.totalCredits > 0 
          ? newSemester.totalGradePoints / newSemester.totalCredits 
          : 0;

        setSemesters([...semesters, newSemester]);
      }
    } catch (error) {
      console.error("Error parsing import text:", error);
    }

    setImportText("");
    setIsImportDialogOpen(false);
  };

  return (
    <Layout>
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-bold mb-4">Grades & Forecasting</h1>
              <div className="flex mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg justify-between items-center">
                <div>
                  <h3 className="text-xl font-medium">Overall GPA</h3>
                  <p className="text-4xl font-bold mt-2 min-w-[3.5ch] text-left">{overallGPA.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-xl font-medium">Total Credits</h3>
                  <p className="text-4xl font-bold mt-2 min-w-[3.5ch] text-left">{overallStats.totalCredits.toFixed(1)}</p>
                </div>
                <div>
                  <h3 className="text-xl font-medium">Total Grade Points</h3>
                  <p className="text-4xl font-bold mt-2 min-w-[3.5ch] text-left">{overallStats.totalGradePoints.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Semesters</h2>
              <div className="flex gap-2">
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Import Courses</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Courses</DialogTitle>
                      <DialogDescription>
                        Enter each course on a new line with format: "Course Title Credits Grade"
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      ref={importTextareaRef}
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="h-40"
                      placeholder="Example:
Calculus I 4 A-
Data Structures 3 B+
Physics 101 4 A"
                    />
                    <DialogFooter>
                      <Button onClick={handleImportSubmit}>Import</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddSemesterDialogOpen} onOpenChange={setIsAddSemesterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Add Semester</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Semester</DialogTitle>
                      <DialogDescription>
                        Enter a name for the new semester.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="semester-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="semester-name"
                          value={newSemesterName}
                          onChange={(e) => setNewSemesterName(e.target.value)}
                          className="col-span-3"
                          placeholder="Fall 2023"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddSemester}>Add Semester</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              {semesterSections.map((section) => (
                <div key={section.label} className="mb-8">
                  <h3 className="text-xl font-bold mb-4">{section.label}</h3>
                  <Droppable droppableId={`semester-section-${section.label}`} type="SEMESTER">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="grid grid-cols-1 gap-6"
                      >
                        {section.semesters.map((semester, index) => (
                          <Draggable key={semester.id} draggableId={semester.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Card>
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div>
                                      <CardTitle>{semester.name}</CardTitle>
                                      <CardDescription>
                                        {semester.courses.length} courses, {semester.totalCredits} credits
                                      </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <div className="text-sm text-muted-foreground">GPA</div>
                                        <div className="text-2xl font-bold">{semester.gpa.toFixed(2)}</div>
                                      </div>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedSemesterId(semester.id);
                                              setIsAddCourseDialogOpen(true);
                                            }}
                                          >
                                            Add Course
                                          </Button>
                                        </DialogTrigger>
                                      </Dialog>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteSemester(semester.id)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <Droppable droppableId={`courses-${semester.id}`} type="COURSE">
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className="space-y-2"
                                        >
                                          {semester.courses.map((course, courseIndex) => (
                                            <Draggable
                                              key={course.id}
                                              draggableId={course.id}
                                              index={courseIndex}
                                            >
                                              {(provided) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                                                >
                                                  <div className="flex-1">
                                                    <div className="font-medium">{course.title}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                      {course.credits} credits
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-4">
                                                    <div className="w-10 text-center">
                                                      <div className="font-bold">{course.grade}</div>
                                                    </div>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleDeleteCourse(semester.id, course.id)}
                                                    >
                                                      Delete
                                                    </Button>
                                                  </div>
                                                </div>
                                              )}
                                            </Draggable>
                                          ))}
                                          {provided.placeholder}
                                          {semester.courses.length === 0 && (
                                            <div className="text-center p-4 text-muted-foreground">
                                              No courses added yet
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </Droppable>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </DragDropContext>

            {semesters.length === 0 && (
              <div className="text-center p-12 border border-dashed rounded-lg">
                <h3 className="text-xl font-medium mb-2">No semesters added yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first semester to start tracking your grades
                </p>
                <Button onClick={() => setIsAddSemesterDialogOpen(true)}>
                  Add Semester
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Enter the details for your new course.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-title" className="text-right">
                Title
              </Label>
              <Input
                id="course-title"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                className="col-span-3"
                placeholder="Calculus I"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-grade" className="text-right">
                Grade
              </Label>
              <Input
                id="course-grade"
                value={newCourseGrade}
                onChange={(e) => setNewCourseGrade(e.target.value)}
                className="col-span-3"
                placeholder="A"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-credits" className="text-right">
                Credits
              </Label>
              <Input
                id="course-credits"
                type="number"
                value={newCourseCredits}
                onChange={(e) => setNewCourseCredits(e.target.value)}
                className="col-span-3"
                placeholder="3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCourse}>Add Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}