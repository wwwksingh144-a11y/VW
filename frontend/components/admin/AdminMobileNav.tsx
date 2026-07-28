"use client";

import { useState } from "react";
import { Menu, X, Briefcase, FileText, Video, Image as ImageIcon, User, LogOut } from "lucide-react";
import { Link } from "@/components/ui/Link";

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 -ml-2 text-navy-950 rounded-lg hover:bg-navy-100 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer content */}
          <div className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-navy-950 text-warm-50 pb-12 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-navy-800/80">
              <div className="flex items-center gap-3">
                <img src="/logo-svg/Dark%20BG%20ICON.svg" alt="VW Icon" className="h-6 w-auto" />
                <span className="font-display font-bold text-lg leading-none tracking-tight">Vision Wings</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-navy-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-6">
              <div className="space-y-2">
                <div className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-navy-500">
                  Archive & Content
                </div>
                <Link href="/admin/projects" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-900 text-navy-200 hover:text-warm-50 transition-colors">
                  <Briefcase className="w-4 h-4 text-bronze-400" />
                  <span className="text-sm font-medium">Projects Archive</span>
                </Link>
                <Link href="/admin/insights" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-900 text-navy-200 hover:text-warm-50 transition-colors">
                  <FileText className="w-4 h-4 text-bronze-400" />
                  <span className="text-sm font-medium">Editorial Insights</span>
                </Link>
              </div>

              <div className="space-y-2">
                <div className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-navy-500">
                  Cloud & Telemetry
                </div>
                <Link href="/admin/videos" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-900 text-navy-200 hover:text-warm-50 transition-colors">
                  <Video className="w-4 h-4 text-bronze-400" />
                  <span className="text-sm font-medium">Video Pipeline</span>
                </Link>
                <Link href="/admin/photos" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-900 text-navy-200 hover:text-warm-50 transition-colors">
                  <ImageIcon className="w-4 h-4 text-bronze-400" />
                  <span className="text-sm font-medium">Image Pipeline</span>
                </Link>
                <Link href="/admin/leads" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-900 text-navy-200 hover:text-warm-50 transition-colors">
                  <User className="w-4 h-4 text-bronze-400" />
                  <span className="text-sm font-medium">Client Leads</span>
                </Link>
              </div>
            </nav>

            <div className="p-4 border-t border-navy-800/80">
              <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-900 transition-colors w-full text-left text-navy-400 hover:text-warm-50 text-sm font-medium">
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Terminate Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
