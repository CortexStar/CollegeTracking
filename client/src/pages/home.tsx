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
      
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              Linear Algebra — MIT
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              A comprehensive guide for MIT's 18.06 Linear Algebra course
            </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
        <div className="max-w-6xl mx-auto">
          
          {problemSets.map((problemSet) => (
            <ProblemSet 
              key={problemSet.id}
              problemSet={problemSet}
              isActive={activeProblemSet === problemSet.id}
            />
          ))}

          <div className="mt-10 text-center text-gray-500 dark:text-gray-400 text-sm">
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
