import Header from "@/components/header";
import Footer from "@/components/footer";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isLandingPage = location === "/";
  
  // Add landing-page class to the html element when on landing page
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("landing-page", isLandingPage);
    return () => html.classList.remove("landing-page");
  }, [isLandingPage]);
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      {/* leftover space – your pages drop here */}
      <main className={isLandingPage ? "flex-1 overflow-hidden" : "flex-1"}>{children}</main>
      <Footer />
    </div>
  );
}