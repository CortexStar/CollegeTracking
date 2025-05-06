import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteComponentProps } from "wouter";
import { ComponentType, FC } from "react";

/**
 * ProtectedRoute Component
 * 
 * A wrapper for Route components that requires authentication.
 * - If user is loading: shows loading spinner
 * - If user is not authenticated: redirects to auth page
 * - If user is authenticated: renders the component
 */
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();

  // Create a component to handle the protected content
  const ProtectedComponent: FC<RouteComponentProps> = (props) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return <Redirect to="/auth" />;
    }

    // Pass all props to the component, including route params
    return <Component {...props} />;
  };

  // Use the Route component with our wrapper
  return <Route path={path} component={ProtectedComponent} />;
}