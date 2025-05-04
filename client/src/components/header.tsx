import { Sun, Moon, Book, GraduationCap, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useCourseName } from "@/hooks/use-course-name";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { courseName } = useCourseName();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-slate-800 text-slate-100 dark:bg-gray-950">
      <div className="flex h-full items-center gap-4 px-4">
        <Link href="/" className="text-lg font-bold tracking-wide text-mit-red dark:text-mit-red-dark">
          COURSE CHARTS
        </Link>

        {/* Main nav - visible on md screens and up */}
        <nav className="hidden md:flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                Classes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/course">
                  {courseName}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="flex items-center gap-1">
                <Book className="h-4 w-4" />
                Book
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/textbook">
                  Introduction to Linear Algebra
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button asChild variant="secondary" size="sm" className="flex items-center gap-1">
            <Link href="/grades">
              <BarChart className="h-4 w-4" />
              Grades & Forecasting
            </Link>
          </Button>
        </nav>

        {/* Right-side controls */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
