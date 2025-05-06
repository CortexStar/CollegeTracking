import { Suspense, lazy, ComponentType } from "react";
import { Switch, Route, RouteComponentProps } from "wouter";
import { AppProviders } from "@/providers";
import Layout from "@/components/layout";
import { Loader2 } from "lucide-react";

// Create a wrapper component for Route compatibility
const RouteWrapper = <P extends {}>(Component: ComponentType<P>) => {
  // This component ensures it's compatible with Wouter's Route component expectation
  const WrappedComponent = (props: RouteComponentProps) => <Component {...props as any} />;
  return WrappedComponent;
};

// Lazy-loaded components for improved performance with proper typing
const Landing = RouteWrapper(lazy(() => import("@/pages/landing")));
const Home = RouteWrapper(lazy(() => import("@/pages/home")));
const TextbookPage = RouteWrapper(lazy(() => import("@/pages/textbook")));
const GradesPage = RouteWrapper(lazy(() => import("@/pages/grades")));
const BookDefault = RouteWrapper(lazy(() => import("@/pages/book")));
const BookAddPage = RouteWrapper(lazy(() => import("@/pages/books/new")));
const BookDetailPage = RouteWrapper(lazy(() => import("@/pages/books/[id]")));
const NotFound = RouteWrapper(lazy(() => import("@/pages/not-found")));

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
