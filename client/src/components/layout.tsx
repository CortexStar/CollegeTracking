import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      {/* leftover space – your pages drop here */}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}