import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCw, Book } from "lucide-react";
import { Slider } from "@/components/ui/slider";

// Set worker path for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function TextbookPage() {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function changePage(offset: number) {
    if (!numPages) return;
    const newPageNumber = pageNumber + offset;
    if (newPageNumber >= 1 && newPageNumber <= numPages) {
      setPageNumber(newPageNumber);
    }
  }

  function changeScale(newScale: number) {
    if (newScale >= 0.5 && newScale <= 2.5) {
      setScale(newScale);
    }
  }

  function rotateDocument() {
    setRotation((rotation + 90) % 360);
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        changePage(1);
      } else if (e.key === 'ArrowLeft') {
        changePage(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Introduction to Linear Algebra
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
                Fourth Edition • Gilbert Strang
              </p>
            </div>
            <div>
              <Button variant="outline" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                Table of Contents
              </Button>
            </div>
          </div>

          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-0">
              {/* PDF Viewer Controls */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changePage(-1)}
                    disabled={pageNumber <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">
                      Page {pageNumber} of {numPages || '...'}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changePage(1)}
                    disabled={numPages === null || pageNumber >= numPages}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeScale(scale - 0.1)}
                    disabled={scale <= 0.5}
                    aria-label="Zoom out"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="w-28">
                    <Slider
                      value={[scale]}
                      min={0.5}
                      max={2.5}
                      step={0.1}
                      onValueChange={(value) => setScale(value[0])}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeScale(scale + 0.1)}
                    disabled={scale >= 2.5}
                    aria-label="Zoom in"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={rotateDocument}
                    aria-label="Rotate document"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* PDF Document */}
              <div className="flex justify-center p-4 bg-white dark:bg-gray-800 min-h-[800px] overflow-auto">
                {isLoading && <div className="flex items-center justify-center h-full">Loading document...</div>}
                <Document
                  file="/linear-algebra-book.pdf"
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => console.error('Error loading PDF:', error)}
                  loading={<div className="flex items-center justify-center h-full">Loading document...</div>}
                  error={<div className="text-red-500">Failed to load document. Please try again later.</div>}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-md"
                  />
                </Document>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
            <p>© Gilbert Strang. Used with permission.</p>
          </div>
        </div>
      </div>
    </div>
  );
}