"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Bell,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/programs", label: "Programs", icon: ClipboardList },
  { href: "/sessions", label: "Sessions", icon: Calendar },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface TrainerSidebarProps {
  profile: {
    full_name: string;
    email: string;
    avatar_url?: string | null;
    role: string;
  };
  unreadNotes?: number;
  unreadNotifications?: number;
}

export function TrainerSidebar({ profile, unreadNotes = 0, unreadNotifications = 0 }: TrainerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  // Close mobile on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  const roleLabel =
    profile.role === "trainer_owner" || profile.role === "admin"
      ? "Head Trainer"
      : profile.role === "associate_trainer"
      ? "Associate Trainer"
      : "Trainer";

  const sidebarContent = (
    <div className="flex h-full flex-col" style={{ background: "hsl(222, 47%, 6%)" }}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b" style={{ borderColor: "hsl(222, 47%, 12%)" }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white">GetFitWithJ</span>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/")) ||
              (item.href !== "/dashboard" && pathname === item.href);
            const noteBadge = item.href === "/notes" && unreadNotes > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-500 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {noteBadge && (
                  <Badge className="h-5 min-w-5 bg-blue-500 text-white text-xs px-1.5">
                    {unreadNotes > 99 ? "99+" : unreadNotes}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Profile */}
      <div className="border-t p-4" style={{ borderColor: "hsl(222, 47%, 12%)" }}>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{profile.full_name}</p>
            <p className="truncate text-xs text-slate-400">{roleLabel}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-white shadow-md"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
