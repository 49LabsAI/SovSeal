import { AuthProviders } from "@/components/providers";
import { ToastProvider } from "@/components/ui";

export default function UnlockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AuthProviders>{children}</AuthProviders>
    </ToastProvider>
  );
}
