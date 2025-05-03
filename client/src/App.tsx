import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SolutionsProvider } from "@/components/solutions-provider";
import { LectureLinksProvider } from "@/components/lecture-links-provider";
import Home from "@/pages/home";
import TextbookPage from "@/pages/textbook";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/#:problemSet" component={Home} />
      <Route path="/textbook" component={TextbookPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <SolutionsProvider>
          <LectureLinksProvider>
            <Router />
            <Toaster />
          </LectureLinksProvider>
        </SolutionsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
