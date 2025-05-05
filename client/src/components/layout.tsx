import Header from "@/components/header";
import Footer from "@/components/footer";
import { useLocation } from "wouter";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isLandingPage = location === "/";
  
  return (
    <div className={`flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 ${isLandingPage ? 'overflow-hidden' : ''}`}>
      <Header />
      {/* leftover space – your pages drop here */}
      <main className={`flex-1 ${isLandingPage ? 'overflow-hidden' : ''}`}>{children}</main>
      <Footer />
    </div>
  );
}