import { ClientTopBar, ClientBottomNav } from "@/components/layouts/client-nav";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ClientTopBar />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">{children}</main>
      <ClientBottomNav />
    </div>
  );
}
