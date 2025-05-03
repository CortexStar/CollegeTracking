import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Welcome to Course Charts
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your interactive platform for academic progress tracking and course management
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}