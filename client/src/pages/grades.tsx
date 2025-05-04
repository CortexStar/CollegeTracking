import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Define the grade point values
const gradePointValues: Record<string, number> = {
  "A": 4.0,
  "A-": 3.67,
  "B+": 3.33,
  "B": 3.0,
  "B-": 2.67,
  "C+": 2.33,
  "C": 2.0,
  "C-": 1.67,
  "D+": 1.33,
  "D": 1.0,
  "D-": 0.67,
  "F": 0.0,
  "E": 0.0
};

// Course interface
interface Course {
  id: string;
  title: string;
  grade: string;
  credits: number;
  gradePoints: number;
}

// Define academic years
type AcademicYear = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';

// Semester interface
interface Semester {
  id: string;
  name: string;
  courses: Course[];
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
  academicYear?: AcademicYear;
}

export default function GradesPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [rawCourseData, setRawCourseData] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [currentSemesterId, setCurrentSemesterId] = useState<string | null>(null);
  const [newCourseData, setNewCourseData] = useState("");
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [editedSemesterName, setEditedSemesterName] = useState("");
  const [isGradeScaleOpen, setIsGradeScaleOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<{
    semesterId: string;
    courseIndex: number;
    field: 'id' | 'title' | 'grade' | 'credits';
    value: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Calculate overall GPA and credits
  const overallStats = semesters.reduce((stats, semester) => {
    return {
      totalCredits: stats.totalCredits + semester.totalCredits,
      totalGradePoints: stats.totalGradePoints + semester.totalGradePoints
    };
  }, { totalCredits: 0, totalGradePoints: 0 });
  
  const overallGPA = overallStats.totalCredits > 0 
    ? Math.round((overallStats.totalGradePoints / overallStats.totalCredits) * 100) / 100 
    : 0;

  // Load saved semesters from localStorage
  useEffect(() => {
    const savedSemesters = localStorage.getItem("gradeSemesters");
    if (savedSemesters) {
      setSemesters(JSON.parse(savedSemesters));
    }
  }, []);

  // Determine academic year for each semester based on position
  useEffect(() => {
    if (semesters.length === 0) return;
    
    // Update academic years based on ordering
    setSemesters(prev => {
      const updatedSemesters = [...prev].map((semester, index) => {
        let academicYear: AcademicYear;
        if (index < 2) {
          academicYear = 'Freshman';
        } else if (index < 4) {
          academicYear = 'Sophomore';
        } else if (index < 6) {
          academicYear = 'Junior';
        } else {
          academicYear = 'Senior';
        }
        
        return { ...semester, academicYear };
      });
      
      return updatedSemesters;
    });
  }, [semesters.length]);

  // Save semesters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("gradeSemesters", JSON.stringify(semesters));
  }, [semesters]);

  // Handle drag-end event for semester reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const reorderedSemesters = [...semesters];
    const [removed] = reorderedSemesters.splice(sourceIndex, 1);
    reorderedSemesters.splice(destinationIndex, 0, removed);
    
    setSemesters(reorderedSemesters);
    
    toast({
      title: "Success",
      description: "Semester order updated",
    });
  };

  // Parse course data from raw text
  const parseCourseData = (rawData: string): Course[] => {
    const lines = rawData.trim().split(/\n|\r\n|\r/);
    const courses: Course[] = [];
    
    let currentCourse: Partial<Course> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      // Parse course ID and title (assuming format like "ECO2023 - Prin Microeconomics")
      if (/^[A-Z]{2,4}\d{4}/.test(line)) {
        // Save previous course if exists
        if (currentCourse.id) {
          finalizeCourse();
        }
        
        // Start new course
        const parts = line.split(' - ');
        // Remove numbers in parentheses from course ID
        let courseId = parts[0].trim();
        courseId = courseId.replace(/\(\d+\)/g, '').trim();
        
        currentCourse = {
          id: courseId,
          title: parts.length > 1 ? parts[1].trim() : '',
        };
      } 
      // Parse standalone title if on its own line
      else if (currentCourse.id && !currentCourse.title) {
        currentCourse.title = line;
      }
      // Parse grade
      else if (/^[ABCDEF][+-]?$/.test(line)) {
        currentCourse.grade = line;
        currentCourse.gradePoints = gradePointValues[line] || 0;
      }
      // Parse credit value (assumed to be a number followed possibly by decimal)
      else if (/^\d+(\.\d+)?$/.test(line)) {
        const value = parseFloat(line);
        
        // If we already have credits and this is likely grade points
        if (currentCourse.credits && !currentCourse.gradePoints && value <= 4.0) {
          currentCourse.gradePoints = value;
        } else {
          currentCourse.credits = value;
        }
      }
      
      // If this is the last line, finalize the current course
      if (i === lines.length - 1 && currentCourse.id) {
        finalizeCourse();
      }
    }
    
    function finalizeCourse() {
      // Calculate grade points if not explicitly provided
      if (currentCourse.grade && !currentCourse.gradePoints) {
        currentCourse.gradePoints = gradePointValues[currentCourse.grade] || 0;
      }
      
      // Ensure all required fields are present
      if (currentCourse.id && 
          currentCourse.title && 
          currentCourse.grade && 
          currentCourse.credits !== undefined && 
          currentCourse.gradePoints !== undefined) {
        courses.push(currentCourse as Course);
      }
      
      // Reset for next course
      currentCourse = {};
    }
    
    return courses;
  };

  // Add a new semester
  const addSemester = () => {
    // If no courses data is entered, create empty semester
    if (!rawCourseData.trim()) {
      const newSemesterId = Date.now().toString();
      
      const newSemester: Semester = {
        id: newSemesterId,
        name: newSemesterName || "New Semester",
        courses: [],
        totalCredits: 0,
        totalGradePoints: 0,
        gpa: 0
      };
      
      setSemesters(prev => [...prev, newSemester]);
      setNewSemesterName("");
      setIsDialogOpen(false);
      
      // Start editing the semester name immediately if using default
      if (!newSemesterName) {
        setTimeout(() => {
          startEditingSemesterName(newSemesterId, "New Semester");
        }, 100);
      }
      
      toast({
        title: "Success",
        description: "New empty semester added",
      });
      return;
    }

    // Otherwise proceed with course data
    const courses = parseCourseData(rawCourseData);
    
    if (courses.length === 0) {
      toast({
        title: "Error",
        description: "Could not parse any valid courses from the input",
        variant: "destructive"
      });
      return;
    }
    
    // Calculate semester totals
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const totalGradePoints = courses.reduce((sum, course) => sum + (course.credits * course.gradePoints), 0);
    const gpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
    
    const newSemester: Semester = {
      id: Date.now().toString(),
      name: newSemesterName || "New Semester",
      courses,
      totalCredits,
      totalGradePoints,
      gpa
    };
    
    setSemesters(prev => [...prev, newSemester]);
    setNewSemesterName("");
    setRawCourseData("");
    setIsDialogOpen(false);
    
    toast({
      title: "Success",
      description: `${newSemesterName || "New Semester"} added with ${courses.length} courses`,
    });
  };

  // Add course to existing semester
  const addCourseToSemester = () => {
    if (!currentSemesterId) return;
    
    const courses = parseCourseData(newCourseData);
    
    if (courses.length === 0) {
      toast({
        title: "Error",
        description: "Could not parse any valid courses from the input",
        variant: "destructive"
      });
      return;
    }
    
    setSemesters(prev => {
      return prev.map(semester => {
        if (semester.id === currentSemesterId) {
          const updatedCourses = [...semester.courses, ...courses];
          const totalCredits = updatedCourses.reduce((sum, course) => sum + course.credits, 0);
          const totalGradePoints = updatedCourses.reduce((sum, course) => sum + (course.credits * course.gradePoints), 0);
          const gpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
          
          return {
            ...semester,
            courses: updatedCourses,
            totalCredits,
            totalGradePoints,
            gpa
          };
        }
        return semester;
      });
    });
    
    setNewCourseData("");
    setIsAddCourseDialogOpen(false);
    
    toast({
      title: "Success",
      description: `Added ${courses.length} course(s) to the semester`,
    });
  };

  // Remove a semester
  const removeSemester = (id: string) => {
    setSemesters(prev => prev.filter(semester => semester.id !== id));
    toast({
      title: "Semester removed",
      description: "The semester has been removed successfully",
    });
  };
  
  // Find a semester by id
  const getSemesterById = (id: string) => {
    return semesters.find(sem => sem.id === id);
  };
  
  // Start editing semester name
  const startEditingSemesterName = (id: string, name: string) => {
    setEditingSemesterId(id);
    setEditedSemesterName(name);
    // Focus the input after it renders
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };
  
  // Save edited semester name
  const saveEditedSemesterName = () => {
    if (!editingSemesterId || !editedSemesterName.trim()) return;
    
    setSemesters(prev => 
      prev.map(semester => 
        semester.id === editingSemesterId 
          ? { ...semester, name: editedSemesterName.trim() } 
          : semester
      )
    );
    
    setEditingSemesterId(null);
    setEditedSemesterName("");
    
    toast({
      title: "Success",
      description: "Semester name updated",
    });
  };
  
  // Start editing course field
  const startEditingCourse = (semesterId: string, courseIndex: number, field: 'id' | 'title' | 'grade' | 'credits', value: string) => {
    // Don't trigger accordion when double-clicking
    const event = window.event;
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    setEditingCourse({
      semesterId,
      courseIndex,
      field,
      value: field === 'credits' ? value.toString() : value
    });
    
    // Focus the input after it renders
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };
  
  // Save edited course field
  const saveEditedCourse = () => {
    if (!editingCourse) return;
    
    const { semesterId, courseIndex, field, value } = editingCourse;
    
    if (!value.trim() && field !== 'credits') {
      setEditingCourse(null);
      return;
    }
    
    setSemesters(prev => 
      prev.map(semester => {
        if (semester.id === semesterId) {
          const updatedCourses = [...semester.courses];
          
          // Validate and update the course field
          if (field === 'credits') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              // Update credits and recalculate grade points based on current grade
              updatedCourses[courseIndex] = {
                ...updatedCourses[courseIndex],
                [field]: numValue,
              };
            }
          } else if (field === 'grade') {
            // Only accept valid grades
            if (Object.keys(gradePointValues).includes(value.toUpperCase())) {
              const gradePointValue = gradePointValues[value.toUpperCase()];
              updatedCourses[courseIndex] = {
                ...updatedCourses[courseIndex],
                [field]: value.toUpperCase(),
                gradePoints: gradePointValue
              };
            }
          } else {
            updatedCourses[courseIndex] = {
              ...updatedCourses[courseIndex],
              [field]: value.trim()
            };
          }
          
          // Recalculate semester totals
          const totalCredits = updatedCourses.reduce((sum, course) => sum + course.credits, 0);
          const totalGradePoints = updatedCourses.reduce((sum, course) => 
            sum + (course.credits * course.gradePoints), 0);
          const gpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
          
          return {
            ...semester,
            courses: updatedCourses,
            totalCredits,
            totalGradePoints,
            gpa
          };
        }
        return semester;
      })
    );
    
    setEditingCourse(null);
    
    toast({
      title: "Success",
      description: "Course information updated",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
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
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">Semesters</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Add Semester</Button>
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
                          placeholder="e.g., Fall 2023" 
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
                          value={rawCourseData}
                          onChange={(e) => setRawCourseData(e.target.value)}
                          className="font-mono text-sm"
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
              <CardContent>
                {semesters.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No semesters added yet.</p>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Click "Add Semester" to get started.</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="semesters" type="SEMESTERS">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {['Freshman', 'Sophomore', 'Junior', 'Senior'].map((academicYear) => {
                            // Find semesters for this academic year
                            const yearSemesters = semesters.filter(
                              semester => semester.academicYear === academicYear
                            );
                            
                            // Skip years with no semesters
                            if (yearSemesters.length === 0) return null;
                            
                            return (
                              <div key={academicYear} className="mb-6">
                                <h3 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-300">
                                  {academicYear} Year
                                </h3>
                                <Accordion type="single" collapsible className="w-full mb-4">
                                  {yearSemesters.map((semester) => {
                                    // Find the actual index in the complete list
                                    const semesterIndex = semesters.findIndex(s => s.id === semester.id);
                                    
                                    return (
                                      <Draggable 
                                        key={semester.id} 
                                        draggableId={semester.id} 
                                        index={semesterIndex}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="mb-2"
                                          >
                                            <AccordionItem value={semester.id} className="border rounded-md overflow-hidden">
                                              <ContextMenu>
                                                <ContextMenuTrigger className="w-full block">
                                                  <AccordionTrigger 
                                                    {...provided.dragHandleProps}
                                                    className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                  >
                                                    <div className="flex items-center justify-between w-full pr-4">
                                                      <div className="flex items-center">
                                                        {editingSemesterId === semester.id ? (
                                                          <form 
                                                            onSubmit={(e) => {
                                                              e.preventDefault();
                                                              saveEditedSemesterName();
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex"
                                                          >
                                                            <Input
                                                              ref={inputRef}
                                                              className="h-8 min-w-[200px] text-xl font-medium border-0 shadow-none bg-transparent p-0 focus-visible:ring-0"
                                                              value={editedSemesterName}
                                                              onChange={(e) => setEditedSemesterName(e.target.value)}
                                                              onBlur={saveEditedSemesterName}
                                                              onKeyDown={(e) => {
                                                                if (e.key === "Escape") {
                                                                  setEditingSemesterId(null);
                                                                  setEditedSemesterName("");
                                                                }
                                                              }}
                                                            />
                                                          </form>
                                                        ) : (
                                                          <span 
                                                            className="text-xl font-medium cursor-text"
                                                            onClick={(e) => {
                                                              if (e.detail === 3) { // Triple click
                                                                e.stopPropagation();
                                                                startEditingSemesterName(semester.id, semester.name);
                                                              }
                                                            }}
                                                            title="Triple-click to edit"
                                                          >
                                                            {semester.name}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-5">
                                                        <div className="text-right">
                                                          <span className="text-sm text-gray-500">GPA</span>
                                                          <p className="font-semibold min-w-[3ch] text-right">{semester.gpa.toFixed(2)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                          <span className="text-sm text-gray-500">Credits</span>
                                                          <p className="font-semibold min-w-[3ch] text-right">{semester.totalCredits.toFixed(1)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                          <span className="text-sm text-gray-500">Grade Points</span>
                                                          <p className="font-semibold min-w-[3ch] text-right">{semester.totalGradePoints.toFixed(1)}</p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </AccordionTrigger>
                                                </ContextMenuTrigger>
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
                                                    onClick={() => removeSemester(semester.id)}
                                                    className="text-red-500 hover:text-red-600 focus:text-red-600"
                                                  >
                                                    Delete Semester
                                                  </ContextMenuItem>
                                                </ContextMenuContent>
                                              </ContextMenu>
                                              <AccordionContent className="px-4 pt-2 pb-4">
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow>
                                                      <TableHead className="w-32">Course ID</TableHead>
                                                      <TableHead>Course Title</TableHead>
                                                      <TableHead className="w-20 text-center">Grade</TableHead>
                                                      <TableHead className="w-20 text-center">Credits</TableHead>
                                                      <TableHead className="w-32 text-center">Grade Points</TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {semester.courses.length === 0 ? (
                                                      <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                          No courses added yet. Right-click the semester and select "Add Course" to add courses.
                                                        </TableCell>
                                                      </TableRow>
                                                    ) : (
                                                      <>
                                                        {semester.courses.map((course, i) => (
                                                          <TableRow key={i}>
                                                            <TableCell className="font-medium">
                                                              {editingCourse && 
                                                                editingCourse.semesterId === semester.id && 
                                                                editingCourse.courseIndex === i && 
                                                                editingCourse.field === 'id' ? (
                                                                <form 
                                                                  onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    saveEditedCourse();
                                                                  }}
                                                                  onClick={(e) => e.stopPropagation()}
                                                                  className="flex"
                                                                >
                                                                  <Input
                                                                    ref={inputRef}
                                                                    className="h-8 border-0 shadow-none bg-transparent p-0 focus-visible:ring-0"
                                                                    value={editingCourse.value}
                                                                    onChange={(e) => setEditingCourse({...editingCourse, value: e.target.value})}
                                                                    onBlur={saveEditedCourse}
                                                                    onKeyDown={(e) => {
                                                                      if (e.key === "Escape") {
                                                                        setEditingCourse(null);
                                                                      }
                                                                    }}
                                                                  />
                                                                </form>
                                                              ) : (
                                                                <span 
                                                                  onDoubleClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingCourse(semester.id, i, 'id', course.id);
                                                                  }}
                                                                  className="cursor-text block"
                                                                >
                                                                  {course.id}
                                                                </span>
                                                              )}
                                                            </TableCell>
                                                            <TableCell>
                                                              {editingCourse && 
                                                                editingCourse.semesterId === semester.id && 
                                                                editingCourse.courseIndex === i && 
                                                                editingCourse.field === 'title' ? (
                                                                <form 
                                                                  onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    saveEditedCourse();
                                                                  }}
                                                                  onClick={(e) => e.stopPropagation()}
                                                                  className="flex"
                                                                >
                                                                  <Input
                                                                    ref={inputRef}
                                                                    className="h-8 w-full border-0 shadow-none bg-transparent p-0 focus-visible:ring-0"
                                                                    value={editingCourse.value}
                                                                    onChange={(e) => setEditingCourse({...editingCourse, value: e.target.value})}
                                                                    onBlur={saveEditedCourse}
                                                                    onKeyDown={(e) => {
                                                                      if (e.key === "Escape") {
                                                                        setEditingCourse(null);
                                                                      }
                                                                    }}
                                                                  />
                                                                </form>
                                                              ) : (
                                                                <span 
                                                                  onDoubleClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingCourse(semester.id, i, 'title', course.title);
                                                                  }}
                                                                  className="cursor-text block"
                                                                >
                                                                  {course.title}
                                                                </span>
                                                              )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                              {editingCourse && 
                                                                editingCourse.semesterId === semester.id && 
                                                                editingCourse.courseIndex === i && 
                                                                editingCourse.field === 'grade' ? (
                                                                <form 
                                                                  onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    saveEditedCourse();
                                                                  }}
                                                                  onClick={(e) => e.stopPropagation()}
                                                                  className="flex justify-center"
                                                                >
                                                                  <Input
                                                                    ref={inputRef}
                                                                    className="h-8 w-16 border-0 shadow-none bg-transparent p-0 text-center focus-visible:ring-0"
                                                                    value={editingCourse.value}
                                                                    onChange={(e) => setEditingCourse({...editingCourse, value: e.target.value})}
                                                                    onBlur={saveEditedCourse}
                                                                    onKeyDown={(e) => {
                                                                      if (e.key === "Escape") {
                                                                        setEditingCourse(null);
                                                                      }
                                                                    }}
                                                                  />
                                                                </form>
                                                              ) : (
                                                                <span 
                                                                  onDoubleClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingCourse(semester.id, i, 'grade', course.grade);
                                                                  }}
                                                                  className="cursor-text block"
                                                                >
                                                                  {course.grade}
                                                                </span>
                                                              )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                              {editingCourse && 
                                                                editingCourse.semesterId === semester.id && 
                                                                editingCourse.courseIndex === i && 
                                                                editingCourse.field === 'credits' ? (
                                                                <form 
                                                                  onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    saveEditedCourse();
                                                                  }}
                                                                  onClick={(e) => e.stopPropagation()}
                                                                  className="flex justify-center"
                                                                >
                                                                  <Input
                                                                    ref={inputRef}
                                                                    className="h-8 w-16 border-0 shadow-none bg-transparent p-0 text-center focus-visible:ring-0"
                                                                    value={editingCourse.value}
                                                                    type="number"
                                                                    min="0.5"
                                                                    step="0.5"
                                                                    onChange={(e) => setEditingCourse({...editingCourse, value: e.target.value})}
                                                                    onBlur={saveEditedCourse}
                                                                    onKeyDown={(e) => {
                                                                      if (e.key === "Escape") {
                                                                        setEditingCourse(null);
                                                                      }
                                                                    }}
                                                                  />
                                                                </form>
                                                              ) : (
                                                                <span 
                                                                  onDoubleClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingCourse(semester.id, i, 'credits', course.credits.toString());
                                                                  }}
                                                                  className="cursor-text block"
                                                                >
                                                                  {course.credits.toFixed(1)}
                                                                </span>
                                                              )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                              {(course.credits * course.gradePoints).toFixed(2)}
                                                            </TableCell>
                                                          </TableRow>
                                                        ))}
                                                        <TableRow className="bg-gray-50 dark:bg-gray-800 font-medium">
                                                          <TableCell colSpan={3} className="text-right">Total:</TableCell>
                                                          <TableCell className="text-center">{semester.totalCredits.toFixed(1)}</TableCell>
                                                          <TableCell className="text-center">{semester.totalGradePoints.toFixed(1)}</TableCell>
                                                        </TableRow>
                                                      </>
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
                
                {/* Dialog for adding courses to an existing semester */}
                <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Courses to Semester</DialogTitle>
                      <DialogDescription>
                        Enter course information to add to {getSemesterById(currentSemesterId || '')?.name || 'this semester'}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="newCourseData">Course Information</Label>
                        <Textarea 
                          id="newCourseData" 
                          placeholder="Enter course information"
                          rows={10}
                          value={newCourseData}
                          onChange={(e) => setNewCourseData(e.target.value)}
                          className="font-mono text-sm"
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
              </CardContent>
            </Card>
            
            <Card>
              <Collapsible open={isGradeScaleOpen} onOpenChange={setIsGradeScaleOpen}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <CardTitle className="text-base">Grade Point Scale</CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Grade</TableHead>
                          <TableHead>Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(gradePointValues).map(([grade, points]) => (
                          <TableRow key={grade}>
                            <TableCell className="font-medium">{grade}</TableCell>
                            <TableCell>{points.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}