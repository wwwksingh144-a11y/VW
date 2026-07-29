// Reading this as: Executive mission control dashboard chrome for an elite digital branding agency, using dark-mode navigational chrome, live system telemetry indicators, and high-contrast typography.
// DESIGN_VARIANCE: 8
// MOTION_INTENSITY: 6
// VISUAL_DENSITY: 5

import { Link } from "@/components/ui/Link";
import { Eye, Briefcase, FileText, LogOut, User, Video, ShieldCheck, Activity, Terminal, Image as ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/rbac";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-warm-100/60 flex text-navy-950 font-sans">
      {/* Executive Sidebar Chrome */}
      <aside className="w-64 bg-navy-950 text-warm-50 flex flex-col hidden md:flex border-r border-navy-800 shadow-2xl relative z-20">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-navy-800/80 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3.5 group" data-interactive>
            <div className="px-2.5 py-2 rounded-xl bg-navy-900 border border-navy-700 flex flex-col items-center justify-center group-hover:border-bronze-500 transition-all shadow-inner">
              <img src="/logo-svg/Dark%20BG%20ICON.svg" alt="VW Icon" className="h-6 w-auto group-hover:scale-105 transition-transform" />
              <span className="text-[8px] font-mono font-black tracking-widest text-bronze-400 mt-1 leading-none uppercase">
                ADMIN
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg leading-none tracking-tight text-warm-50">Vision Wings</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-bronze-500 mt-1">Mission Control</span>
            </div>
          </Link>
        </div>
        
        {/* Monospace Navigation Chrome */}
        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-navy-500">
            Archive &amp; Content
          </div>

          <Link 
            href="/admin/projects" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-navy-900/90 text-navy-200 hover:text-warm-50 transition-all group border border-transparent hover:border-navy-800"
            data-interactive
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-bronze-400 group-hover:text-bronze-300 transition-colors" />
              <span className="text-sm font-medium">Projects Archive</span>
            </div>
            <span className="text-[10px] font-mono text-navy-500 group-hover:text-bronze-400">01</span>
          </Link>

          <Link 
            href="/admin/insights" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-navy-900/90 text-navy-200 hover:text-warm-50 transition-all group border border-transparent hover:border-navy-800"
            data-interactive
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-bronze-400 group-hover:text-bronze-300 transition-colors" />
              <span className="text-sm font-medium">Editorial Insights</span>
            </div>
            <span className="text-[10px] font-mono text-navy-500 group-hover:text-bronze-400">02</span>
          </Link>

          <Link 
            href="/admin/content" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-navy-900/90 text-navy-200 hover:text-warm-50 transition-all group border border-transparent hover:border-navy-800"
            data-interactive
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-bronze-400 group-hover:text-bronze-300 transition-colors" />
              <span className="text-sm font-medium">Site Content</span>
            </div>
            <span className="text-[10px] font-mono text-navy-500 group-hover:text-bronze-400">03</span>
          </Link>

          <div className="px-3 pt-6 pb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-navy-500">
            Cloud &amp; Telemetry
          </div>

          <Link 
            href="/admin/videos" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-navy-900/90 text-navy-200 hover:text-warm-50 transition-all group border border-transparent hover:border-navy-800"
            data-interactive
          >
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4 text-bronze-400 group-hover:text-bronze-300 transition-colors" />
              <span className="text-sm font-medium">Video Pipeline</span>
            </div>
            <span className="text-[10px] font-mono text-navy-500 group-hover:text-bronze-400">04</span>
          </Link>

          <Link 
            href="/admin/photos" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-navy-900/90 text-navy-200 hover:text-warm-50 transition-all group border border-transparent hover:border-navy-800"
            data-interactive
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-4 h-4 text-bronze-400 group-hover:text-bronze-300 transition-colors" />
              <span className="text-sm font-medium">Image Pipeline</span>
            </div>
            <span className="text-[10px] font-mono text-navy-500 group-hover:text-bronze-400">05</span>
          </Link>

          <Link 
            href="/admin/leads" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-navy-900/90 text-navy-200 hover:text-warm-50 transition-all group border border-transparent hover:border-navy-800"
            data-interactive
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-bronze-400 group-hover:text-bronze-300 transition-colors" />
              <span className="text-sm font-medium">Client Leads</span>
            </div>
            <span className="text-[10px] font-mono text-navy-500 group-hover:text-bronze-400">06</span>
          </Link>
        </nav>

        {/* System Health Footer Strip */}
        <div className="p-4 border-t border-navy-800/80 bg-navy-950/50 space-y-3">
          <div className="px-3 py-2 rounded bg-navy-900/60 border border-navy-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-navy-200">VERCEL BLOB CDN</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">ONLINE</span>
          </div>
          
          <button 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-900 transition-colors w-full text-left text-navy-400 hover:text-warm-50 text-sm group font-medium"
            data-interactive
          >
            <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        
        {/* Top Telemetry Header Bar */}
        <header className="bg-warm-50/90 backdrop-blur-md border-b border-navy-200/60 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <AdminMobileNav />
            <h1 className="text-base font-bold text-navy-950 md:hidden">Vision Wings</h1>
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-navy-500">
              <Terminal className="w-3.5 h-3.5 text-bronze-600" />
              <span>ENV: PRODUCTION</span>
              <span className="text-navy-300">/</span>
              <span className="text-navy-800 font-semibold">NEON POSTGRESQL + BULLMQ</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-mono font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>RBAC AUTH SECURED</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-navy-950 text-warm-50 flex items-center justify-center font-mono font-bold text-xs border border-navy-800 shadow-inner select-none">
              VW
            </div>
          </div>
        </header>

        {/* Page Content Surface */}
        <div className="p-6 md:p-10 flex-1 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
