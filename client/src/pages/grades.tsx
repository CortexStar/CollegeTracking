import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { CheckCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

// Semester interface
interface Semester {
  id: string;
  name: string;
  courses: Course[];
  totalCredits: number;
  totalGradePoints: number;
  gpa: number;
}

export default function GradesPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [rawCourseData, setRawCourseData] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [currentSemesterId, setCurrentSemesterId] = useState<string | null>(null);
  const [newCourseData, setNewCourseData] = useState("");
  const { toast } = useToast();
  
  // Calculate overall GPA and credits
  const overallStats = semesters.reduce((stats, semester) => {
    return {
      totalCredits: stats.totalCredits + semester.totalCredits,
      totalGradePoints: stats.totalGradePoints + semester.totalGradePoints
    };
  }, { totalCredits: 0, totalGradePoints: 0 });
  
  const overallGPA = overallStats.totalCredits > 0 
    ? parseFloat((overallStats.totalGradePoints / overallStats.totalCredits).toFixed(2)) 
    : 0;

  // Load saved semesters from localStorage
  useEffect(() => {
    const savedSemesters = localStorage.getItem("gradeSemesters");
    if (savedSemesters) {
      setSemesters(JSON.parse(savedSemesters));
    }
  }, []);

  // Save semesters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("gradeSemesters", JSON.stringify(semesters));
  }, [semesters]);

  // Parse course data from raw text
  const parseCourseData = (rawData: string): Course[] => {
    const lines = rawData.trim().split(/\\n|\\r\\n|\\r|\n/);
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
        currentCourse = {
          id: parts[0].trim(),
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
    if (!newSemesterName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a semester name",
        variant: "destructive"
      });
      return;
    }

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
      name: newSemesterName,
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
      description: `${newSemesterName} added with ${courses.length} courses`,
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

  return (
    <div className="container mx-auto py-16 max-w-5xl">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Grades & Forecasting</h1>
          <div className="flex mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg justify-between items-center">
            <div>
              <h3 className="text-xl font-medium">Overall GPA</h3>
              <p className="text-4xl font-bold mt-2">{overallGPA.toFixed(2)}</p>
            </div>
            <div>
              <h3 className="text-xl font-medium">Total Credits</h3>
              <p className="text-4xl font-bold mt-2">{overallStats.totalCredits.toFixed(1)}</p>
            </div>
            <div>
              <h3 className="text-xl font-medium">Semesters</h3>
              <p className="text-4xl font-bold mt-2">{semesters.length}</p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">Semesters</CardTitle>
                <CardDescription>Your academic terms and courses</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add Semester</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Add New Semester</DialogTitle>
                    <DialogDescription>
                      Enter semester name and course information to calculate your GPA.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="semester-name">Semester Name</Label>
                      <Input
                        id="semester-name"
                        placeholder="Fall 2023"
                        value={newSemesterName}
                        onChange={(e) => setNewSemesterName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="course-data">
                        Course Information
                        <span className="block text-sm text-gray-500 font-normal mt-1">
                          Paste your course information with each detail on a new line. 
                          Format: Course ID, Title, Grade, Credit Value
                        </span>
                      </Label>
                      <Textarea
                        id="course-data"
                        placeholder="ECO2023 - Prin Microeconomics&#10;B+&#10;3.0"
                        rows={10}
                        value={rawCourseData}
                        onChange={(e) => setRawCourseData(e.target.value)}
                      />
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
            </div>
          </CardHeader>
          <CardContent>
            {semesters.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No semesters added yet. Click "Add Semester" to get started.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {semesters.map((semester) => (
                  <AccordionItem key={semester.id} value={semester.id}>
                    <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
                          <span className="text-xl font-medium">{semester.name}</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <span className="text-sm text-gray-500">GPA</span>
                            <p className="font-semibold">{semester.gpa.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">Credits</span>
                            <p className="font-semibold">{semester.totalCredits.toFixed(1)}</p>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4">
                      <ContextMenu>
                        <ContextMenuTrigger className="block w-full">
                          <div>
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
                                {semester.courses.map((course, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-medium">{course.id}</TableCell>
                                    <TableCell>{course.title}</TableCell>
                                    <TableCell className="text-center">{course.grade}</TableCell>
                                    <TableCell className="text-center">{course.credits.toFixed(1)}</TableCell>
                                    <TableCell className="text-center">
                                      {(course.credits * course.gradePoints).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold">
                                  <TableCell colSpan={3} className="text-right">Semester Totals:</TableCell>
                                  <TableCell className="text-center">{semester.totalCredits.toFixed(1)}</TableCell>
                                  <TableCell className="text-center">{semester.totalGradePoints.toFixed(2)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
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
                          <ContextMenuItem 
                            onClick={() => removeSemester(semester.id)}
                            className="text-red-500 hover:text-red-600 focus:text-red-600"
                          >
                            Remove Semester
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <Collapsible className="w-full">
          <Card>
            <CardHeader className="cursor-pointer">
              <CollapsibleTrigger className="flex justify-between items-center w-full">
                <div>
                  <CardTitle>Grade Values Reference</CardTitle>
                  <CardDescription>Standard grade point values used in calculations</CardDescription>
                </div>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
            </CardHeader>
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
                    <TableRow>
                      <TableCell className="font-medium">A</TableCell>
                      <TableCell>4.0</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">A-</TableCell>
                      <TableCell>3.67</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">B+</TableCell>
                      <TableCell>3.33</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">B</TableCell>
                      <TableCell>3.0</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">B-</TableCell>
                      <TableCell>2.67</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">C+</TableCell>
                      <TableCell>2.33</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">C</TableCell>
                      <TableCell>2.0</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">C-</TableCell>
                      <TableCell>1.67</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">D+</TableCell>
                      <TableCell>1.33</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">D</TableCell>
                      <TableCell>1.0</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">D-</TableCell>
                      <TableCell>0.67</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">E/F</TableCell>
                      <TableCell>0.0</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Dialog for adding a course to an existing semester */}
      <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add Course to {getSemesterById(currentSemesterId || "")?.name}</DialogTitle>
            <DialogDescription>
              Enter course information to add to this semester.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="course-data">
                Course Information
                <span className="block text-sm text-gray-500 font-normal mt-1">
                  Paste your course information with each detail on a new line. 
                  Format: Course ID, Title, Grade, Credit Value
                </span>
              </Label>
              <Textarea
                id="course-data"
                placeholder="ECO2023 - Prin Microeconomics&#10;B+&#10;3.0"
                rows={10}
                value={newCourseData}
                onChange={(e) => setNewCourseData(e.target.value)}
              />
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
    </div>
  );
}