// Legacy client layout — redirects handled by middleware
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}
