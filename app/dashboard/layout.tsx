import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { FloatingAdvisor } from "@/components/ai/FloatingAdvisor";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        <main className="flex-1 p-6 pb-20 md:pb-6 w-full max-w-none">
          {children}
        </main>
      </div>
      <MobileNav />
      <FloatingAdvisor />
    </div>
  );
}
