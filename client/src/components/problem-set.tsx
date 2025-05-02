import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { ProblemSet as ProblemSetType } from "@/data/problem-sets";

interface ProblemSetProps {
  problemSet: ProblemSetType;
  isActive: boolean;
}

export default function ProblemSet({ problemSet, isActive }: ProblemSetProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const isMobile = useMobile();

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card 
      id={problemSet.id}
      className="mb-8 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <CardHeader 
        className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex flex-row items-center justify-between cursor-pointer"
        onClick={handleToggleExpand}
      >
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {problemSet.title}
        </CardTitle>
        <button
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-6 space-y-6">
          {/* Lectures - Now above Topics & Readings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Lectures
            </h3>
            <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300 ml-2">
              {problemSet.lectures.map((lecture, index) => (
                <li key={index}>
                  <span className="font-medium">Lecture {lecture.number}:</span> {lecture.title}
                </li>
              ))}
            </ul>
          </div>

          {/* Topics & Readings - Moved below Lectures */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Topics & Readings (4th ed.)
            </h3>
            <div className={cn("overflow-x-auto", isMobile && "-mx-6 px-6")}>
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead className="w-16 text-xs uppercase">Ses #</TableHead>
                    <TableHead className="text-xs uppercase">Topic title</TableHead>
                    <TableHead className="w-36 text-xs uppercase">Reading range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problemSet.topics.map((topic, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap text-sm">{topic.session}</TableCell>
                      <TableCell className="text-sm font-medium">{topic.title}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{topic.reading}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Assigned Problems */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Assigned Problems (printed pages)
            </h3>
            <div className={cn("overflow-x-auto", isMobile && "-mx-6 px-6")}>
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead className="w-20 text-xs uppercase">Section</TableHead>
                    <TableHead className="text-xs uppercase">Problems</TableHead>
                    <TableHead className="w-16 text-xs uppercase">Page</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problemSet.problems.map((problem, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap text-sm">{problem.section}</TableCell>
                      <TableCell className="text-sm">{problem.problems}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{problem.page}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <Separator className="mt-4" />
        </CardContent>
      )}
    </Card>
  );
}
