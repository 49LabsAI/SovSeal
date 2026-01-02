import { AuthProviders } from "@/components/providers";
import { ToastProvider } from "@/components/ui";

export default function ClaimLayout({
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
