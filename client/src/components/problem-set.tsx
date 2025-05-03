import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { ProblemSet as ProblemSetType } from "@/data/problem-sets";

interface ProblemSetProps {
  problemSet: ProblemSetType;
  isActive: boolean;
  isCompleted?: boolean;
  onToggleCompletion?: () => void;
}

export default function ProblemSet({ problemSet, isActive, isCompleted = false, onToggleCompletion }: ProblemSetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useMobile();

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card 
      id={problemSet.id}
      className="mb-10 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <CardHeader 
        className="px-10 py-7 border-b border-gray-200 dark:border-gray-700 flex flex-row items-center justify-between cursor-pointer"
      >
        <div
          className="flex-1 flex items-center" 
          onClick={handleToggleExpand}
        >
          {isCompleted && (
            <CheckCircle className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
          )}
          <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {problemSet.title}
          </CardTitle>
        </div>
        
        <div className="flex items-center gap-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {isCompleted ? "Completed" : "Mark complete"}
            </span>
            <Switch 
              checked={isCompleted}
              onCheckedChange={(checked) => {
                if (onToggleCompletion) {
                  onToggleCompletion();
                }
              }}
              aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
            />
          </div>
          
          <button
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand();
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-6 w-6" />
            ) : (
              <ChevronDown className="h-6 w-6" />
            )}
          </button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-10 space-y-10">
          {/* Lectures - Now above Topics & Readings */}
          <div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6 text-center">
              Lectures
            </h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-base">
              {problemSet.lectures.map((lecture, index) => (
                <div key={index} className="text-base">
                  <span className="font-medium">Lecture {lecture.number}:</span> {lecture.title}
                </div>
              ))}
            </div>
          </div>

          {/* Topics & Readings - Moved below Lectures */}
          <div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6 text-center">
              Topics & Readings
            </h3>
            <div className={cn("overflow-x-auto", isMobile && "-mx-10 px-10")}>
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead className="w-16 text-sm uppercase text-center">Ses #</TableHead>
                    <TableHead className="text-sm uppercase">Topic title</TableHead>
                    <TableHead className="w-36 text-sm uppercase text-center">Reading range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problemSet.topics.map((topic, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap text-base text-center">{topic.session}</TableCell>
                      <TableCell className="text-base font-medium">{topic.title}</TableCell>
                      <TableCell className="whitespace-nowrap text-base text-gray-500 dark:text-gray-400 text-center">{topic.reading}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Assigned Problems */}
          <div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6 text-center">
              Assigned Problems
            </h3>
            <div className={cn("overflow-x-auto", isMobile && "-mx-10 px-10")}>
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead className="w-20 text-sm uppercase text-center">Section</TableHead>
                    <TableHead className="text-sm uppercase">Problems</TableHead>
                    <TableHead className="w-16 text-sm uppercase text-center">Page</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problemSet.problems.map((problem, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap text-base text-center">{problem.section}</TableCell>
                      <TableCell className="text-base">{problem.problems}</TableCell>
                      <TableCell className="whitespace-nowrap text-base text-gray-500 dark:text-gray-400 text-center">{problem.page}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <Separator className="mt-6" />
        </CardContent>
      )}
    </Card>
  );
}
