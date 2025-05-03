import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SolutionsProvider } from "@/components/solutions-provider";
import { LectureLinksProvider } from "@/components/lecture-links-provider";
import { CourseNameProvider } from "@/hooks/use-course-name";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import TextbookPage from "@/pages/textbook";
import GradesPage from "@/pages/grades";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/course" component={Home} />
      <Route path="/course#:problemSet" component={Home} />
      <Route path="/textbook" component={TextbookPage} />
      <Route path="/grades" component={GradesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <CourseNameProvider>
          <SolutionsProvider>
            <LectureLinksProvider>
              <Router />
              <Toaster />
            </LectureLinksProvider>
          </SolutionsProvider>
        </CourseNameProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
