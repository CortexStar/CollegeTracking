import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { AppProviders } from "@/providers";
import Layout from "@/components/layout";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/lib/protected-route";

// Lazy-loaded components for improved performance
const Landing = lazy(() => import("@/pages/landing"));
const Home = lazy(() => import("@/pages/home"));
const TextbookPage = lazy(() => import("@/pages/textbook"));
const GradesPage = lazy(() => import("@/pages/grades"));
const BookDefault = lazy(() => import("@/pages/book"));
const BookAddPage = lazy(() => import("@/pages/books/new"));
const BookDetailPage = lazy(() => import("@/pages/books/[id]"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/course" component={Home} />
        <ProtectedRoute path="/course#:problemSet" component={Home} />
        <ProtectedRoute path="/textbook" component={TextbookPage} />
        <ProtectedRoute path="/grades" component={GradesPage} />
        <ProtectedRoute path="/book" component={BookDefault} />
        <ProtectedRoute path="/books/new" component={BookAddPage} />
        <ProtectedRoute path="/books/:id" component={BookDetailPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <AppProviders>
      <Layout>
        <Router />
      </Layout>
    </AppProviders>
  );
}

export default App;
