import { AuthProviders } from "@/components/providers";
import { Navigation, Footer } from "@/components/layout";
import { ToastProvider, SkipToContent } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipToContent />
      <ToastProvider>
        <AuthProviders>
          <Navigation />
          <main id="main-content" className="flex-1 bg-dark-950">
            {children}
          </main>
          <Footer />
        </AuthProviders>
      </ToastProvider>
    </div>
  );
}
