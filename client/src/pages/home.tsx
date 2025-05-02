import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronUp } from "lucide-react";
import ProblemSet from "@/components/problem-set";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { problemSets } from "@/data/problem-sets";

export default function Home() {
  const [location] = useLocation();
  const hash = location.includes("#") ? location.split("#")[1] : null;
  const [activeProblemSet, setActiveProblemSet] = useState<string | null>(
    hash || "problem-set-1"
  );
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Update active problem set when URL hash changes
  useEffect(() => {
    if (hash) {
      setActiveProblemSet(hash);
      // Scroll to the element
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  // Show scroll to top button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="mb-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Linear Algebra — Problem‑Set Guide (4th Edition)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            A comprehensive guide for MIT's 18.06 Linear Algebra course
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {problemSets.map((problemSet) => (
            <ProblemSet 
              key={problemSet.id}
              problemSet={problemSet}
              isActive={activeProblemSet === problemSet.id}
            />
          ))}

          <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>Guide finalized through Problem Set 10.</p>
          </div>
        </div>
      </div>

      <Footer />

      {showScrollToTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-all duration-300"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
