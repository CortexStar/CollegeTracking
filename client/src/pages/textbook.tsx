import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import TextbookToc from "@/components/textbook-toc";

export default function TextbookPage() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 575; // Approximate from the PDF

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // For iframe we can't directly control the page
      // This would be used with the TOC
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="max-w-6xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                Introduction to Linear Algebra
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mt-3">
                Fourth Edition • Gilbert Strang
              </p>
            </div>
            <div>
              <TextbookToc onSelectPage={goToPage} />
            </div>
          </div>

          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-0">
              {/* PDF Viewer Controls - Simplified */}
              <div className="flex items-center justify-end p-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('/linear-algebra-book.pdf', '_blank')}
                    aria-label="Full PDF"
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Full PDF
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.print()}
                    aria-label="Print"
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Print
                  </Button>
                </div>
              </div>

              {/* PDF Document */}
              <div className="flex flex-col items-center justify-center p-1 bg-white dark:bg-gray-800 min-h-[800px] overflow-auto">
                <div className="w-full">
                  <embed 
                    src="/linear-algebra-book.pdf" 
                    type="application/pdf"
                    width="100%" 
                    height="850px" 
                    className="shadow-md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-2 text-gray-500 dark:text-gray-400 text-xs">
            <p>© Gilbert Strang. Used with permission.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}