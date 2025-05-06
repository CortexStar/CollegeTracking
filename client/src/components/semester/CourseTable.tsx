import React, { useCallback, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Editable, EditableSpan } from "@/components/ui/inline-edit";
import { Course } from "@/utils/parseCourseData";
import { Button } from "@/components/ui/button";
import { calculateGradePoints } from "@/utils/grade-utils";

export interface CourseTableProps {
  semesterId: string;
  courses: Course[];
  editing: {
    semesterId: string;
    courseIndex: number;
    field: "id" | "title" | "grade" | "credits";
    value: string;
  } | null;
  onStartEditing: (
    semesterId: string,
    courseIndex: number,
    field: "id" | "title" | "grade" | "credits",
    currentValue: string
  ) => void;
  onSaveEditing: (newValue?: string) => void;
  onAddCourse: (semesterId: string) => void;
  onRemoveCourse: (semesterId: string, courseIndex: number) => void;
}

/**
 * CourseTable component for displaying courses in a semester
 */
const CourseTable: React.FC<CourseTableProps> = ({
  semesterId,
  courses,
  editing,
  onStartEditing,
  onSaveEditing,
  onAddCourse,
  onRemoveCourse,
}) => {
  // Use callbacks for performance optimization
  const handleAddCourse = useCallback(() => {
    onAddCourse(semesterId);
  }, [onAddCourse, semesterId]);

  const handleRemoveCourse = useCallback(
    (courseIndex: number) => {
      onRemoveCourse(semesterId, courseIndex);
    },
    [onRemoveCourse, semesterId]
  );

  const handleStartEditing = useCallback(
    (courseIndex: number, field: "id" | "title" | "grade" | "credits", value: string) => {
      onStartEditing(semesterId, courseIndex, field, value);
    },
    [onStartEditing, semesterId]
  );

  if (courses.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">
          No courses added yet. Right-click on the semester to add courses.
        </p>
      </div>
    );
  }

  return (
    <Table className="overflow-hidden rounded-md border shadow-sm">
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="font-medium">Course Code</TableHead>
          <TableHead className="font-medium">Course Title</TableHead>
          <TableHead className="text-center font-medium">Grade</TableHead>
          <TableHead className="text-center font-medium">Credits</TableHead>
          <TableHead className="text-right font-medium">Grade Points</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course, i) => (
          <ContextMenu key={course._uid || course.id || i}>
            <ContextMenuTrigger asChild>
              <TableRow className="group">
                <TableCell>
                  {editing &&
                  editing.semesterId === semesterId &&
                  editing.courseIndex === i &&
                  editing.field === "id" ? (
                    <EditableSpan
                      value={editing.value}
                      onSave={onSaveEditing}
                      aria-label="Course code"
                    />
                  ) : (
                    <Editable
                      onEdit={() =>
                        handleStartEditing(i, "id", course.id)
                      }
                      aria-label="Edit course code"
                    >
                      {course.id}
                    </Editable>
                  )}
                </TableCell>
                <TableCell>
                  {editing &&
                  editing.semesterId === semesterId &&
                  editing.courseIndex === i &&
                  editing.field === "title" ? (
                    <EditableSpan
                      value={editing.value}
                      onSave={onSaveEditing}
                      aria-label="Course title"
                    />
                  ) : (
                    <Editable
                      onEdit={() =>
                        handleStartEditing(i, "title", course.title)
                      }
                      aria-label="Edit course title"
                    >
                      {course.title}
                    </Editable>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editing &&
                  editing.semesterId === semesterId &&
                  editing.courseIndex === i &&
                  editing.field === "grade" ? (
                    <EditableSpan
                      value={editing.value}
                      onSave={onSaveEditing}
                      align="center"
                      aria-label="Course grade"
                    />
                  ) : (
                    <Editable
                      onEdit={() =>
                        handleStartEditing(i, "grade", course.grade)
                      }
                      align="center"
                      aria-label="Edit course grade"
                    >
                      {course.grade}
                    </Editable>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editing &&
                  editing.semesterId === semesterId &&
                  editing.courseIndex === i &&
                  editing.field === "credits" ? (
                    <EditableSpan
                      value={editing.value}
                      onSave={onSaveEditing}
                      align="center"
                      numeric
                      aria-label="Course credits"
                    />
                  ) : (
                    <Editable
                      onEdit={() =>
                        handleStartEditing(
                          i,
                          "credits",
                          course.credits.toString()
                        )
                      }
                      align="center"
                      aria-label="Edit course credits"
                    >
                      {course.credits}
                    </Editable>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {course.gradePoints.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveCourse(i)}
                    aria-label="Delete course"
                  >
                    <span className="sr-only">Delete</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-destructive"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </Button>
                </TableCell>
              </TableRow>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => handleStartEditing(i, "id", course.id)}
              >
                Edit Course Code
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleStartEditing(i, "title", course.title)}
              >
                Edit Title
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleStartEditing(i, "grade", course.grade)}
              >
                Edit Grade
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  handleStartEditing(i, "credits", course.credits.toString())
                }
              >
                Edit Credits
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => handleRemoveCourse(i)}
                className="text-destructive"
              >
                Delete Course
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </TableBody>
    </Table>
  );
};

export default memo(CourseTable);