import { Info, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 dark:bg-gray-950 text-white py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-lg font-semibold">COURSE CHARTS</h2>
          </div>
          <div className="flex space-x-6">
            <a
              href="#"
              className="text-gray-300 hover:text-white transition duration-200"
              aria-label="Information"
            >
              <Info className="h-6 w-6" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition duration-200"
              aria-label="GitHub"
            >
              <Github className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
