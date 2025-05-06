import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { AUTH_ENABLED, GOOGLE_CLIENT_ID } from "@/lib/config";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, googleLoginMutation } = useAuth();

  // If auth is disabled, redirect to home
  if (!AUTH_ENABLED) {
    navigate("/");
    return null;
  }

  // Redirect to home if already logged in
  if (user) {
    navigate("/");
    return null;
  }
  
  // Handle Google OAuth success
  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      // Use the googleLoginMutation to authenticate with Google
      googleLoginMutation.mutate(credentialResponse.credential);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md px-4 py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome to Course Charts
          </h1>
          <p className="text-muted-foreground mb-6">
            Your comprehensive platform for learning linear algebra
          </p>
          
          {/* Google OAuth Login */}
          {GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <div className="flex justify-center mt-6">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.error("Login Failed");
                  }}
                  useOneTap
                  theme="outline"
                  text="continue_with"
                  shape="rectangular"
                  width="280"
                />
              </div>
            </GoogleOAuthProvider>
          ) : (
            <div className="p-4 border border-yellow-400 bg-yellow-50 rounded text-yellow-800 text-sm">
              <p>Google OAuth Client ID not configured.</p>
              <p className="text-xs mt-1">Set VITE_GOOGLE_CLIENT_ID in your environment variables.</p>
            </div>
          )}
        </div>
        
        {/* Features section */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-medium">📚 Course Materials</h3>
              <p className="text-sm text-muted-foreground">Access lecture notes and problem sets</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-medium">📊 Grade Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor and forecast your academic progress</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-medium">📖 Digital Library</h3>
              <p className="text-sm text-muted-foreground">Upload and read textbooks online</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-medium">✓ Progress Tracking</h3>
              <p className="text-sm text-muted-foreground">Mark completed lessons and assignments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}