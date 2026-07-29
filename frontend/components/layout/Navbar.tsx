"use client";

import { useState } from "react";
import { Link } from "@/components/ui/Link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Button from "@/components/ui/Button";
import { Eye, Target, Briefcase, FileText, Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import { useActiveSection } from "@/hooks/useActiveSection";
import { UserCircle, LogOut } from "lucide-react";
import { logoutUser } from "@/app/actions/auth";
import { useTransition } from "react";

export default function Navbar({ user, isAdmin }: { user: any; isAdmin?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const activeSection = useActiveSection(["vision", "strategy", "work", "insights", "contact"]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // We don't have window during SSR
    if (typeof window !== "undefined") {
      if (latest > window.innerHeight * 0.8) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }
  });

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const isActive = (path: string, hash: string) => {
    // If it's a hash link on the homepage
    if (path === "/") {
      return pathname === "/" && activeSection === hash;
    }
    // If it's a separate page like /contact
    return pathname === path;
  };

  return (
    <>
      {/* Top Navbar (Desktop + Logo on Mobile) */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-8 xl:px-20 py-6 transition-colors duration-[350ms] ease-out-expo ${
          isScrolled 
            ? "bg-warm-50/96 border-b border-navy-100 backdrop-blur-sm" 
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 z-50 min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-bronze-500 rounded-lg outline-none" data-interactive>
            <img src="/logo-svg/Primary%20ICON.svg" alt="Vision Wings Logo" className="h-14 w-auto" />
            <span className="font-display font-bold text-xl text-navy-950 mt-1">
              Vision Wings
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2">
            <Link 
              href="/#vision" 
              className={`text-body font-medium transition-all px-4 py-2 min-h-[44px] inline-flex items-center rounded-full focus-visible:ring-2 focus-visible:ring-bronze-500 outline-none ${isActive("/", "vision") ? "bg-navy-950 text-warm-50" : "hover:text-bronze-500 hover:bg-warm-100"}`} 
              data-interactive
            >
              Vision
            </Link>
            <Link 
              href="/#strategy" 
              className={`text-body font-medium transition-all px-4 py-2 min-h-[44px] inline-flex items-center rounded-full focus-visible:ring-2 focus-visible:ring-bronze-500 outline-none ${isActive("/", "strategy") ? "bg-navy-950 text-warm-50" : "hover:text-bronze-500 hover:bg-warm-100"}`} 
              data-interactive
            >
              Strategy
            </Link>
            <Link 
              href="/#work" 
              className={`text-body font-medium transition-all px-4 py-2 min-h-[44px] inline-flex items-center rounded-full focus-visible:ring-2 focus-visible:ring-bronze-500 outline-none ${isActive("/", "work") ? "bg-navy-950 text-warm-50" : "hover:text-bronze-500 hover:bg-warm-100"}`} 
              data-interactive
            >
              Work
            </Link>
            <Link 
              href="/#insights" 
              className={`text-body font-medium transition-all px-4 py-2 min-h-[44px] inline-flex items-center rounded-full focus-visible:ring-2 focus-visible:ring-bronze-500 outline-none ${isActive("/", "insights") ? "bg-navy-950 text-warm-50" : "hover:text-bronze-500 hover:bg-warm-100"}`} 
              data-interactive
            >
              Insights
            </Link>
            <div className="ml-6 flex items-center gap-4">
              {user ? (
                <div className="relative group flex items-center h-full">
                  <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center border border-navy-200 cursor-pointer hover:border-bronze-500 transition-colors focus-visible:ring-2 focus-visible:ring-bronze-500 outline-none" tabIndex={0}>
                    <UserCircle className="w-5 h-5 text-navy-600" />
                  </div>
                  
                  {/* Teardrop Dropdown */}
                  <div className="absolute right-0 top-12 w-48 bg-navy-950 text-warm-50 rounded-2xl rounded-tr-sm p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-navy-800">
                    <div className="px-3 py-2 border-b border-navy-800 mb-1">
                      <p className="text-xs text-navy-400">Signed in as</p>
                      <p className="text-sm font-semibold text-warm-50 truncate">{user?.email || "Admin"}</p>
                    </div>

                    <button 
                      onClick={() => startTransition(() => logoutUser())}
                      disabled={isPending}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-navy-900 rounded-lg transition-colors flex items-center gap-2 mt-1 min-h-[40px]"
                      data-interactive
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isPending ? "Logging out..." : "Logout"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="text-sm font-medium text-navy-600 hover:text-navy-950 transition-colors min-h-[44px] inline-flex items-center px-2 focus-visible:ring-2 focus-visible:ring-bronze-500 rounded outline-none" data-interactive>
                  Login
                </Link>
              )}
              <Link href="/contact" className="inline-block min-h-[44px] rounded-full focus-visible:ring-2 focus-visible:ring-bronze-500 outline-none">
                <Button variant="primary" className="bg-navy-950 text-warm-50 hover:bg-navy-900 transition-colors whitespace-nowrap min-h-[44px] px-6 shadow-sm" data-interactive>
                  Start Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Bottom Floating App Bar (Mobile Only - Reference 2 Tactile Dock) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 lg:hidden pointer-events-none flex justify-center">
        <div className="bg-warm-50/98 border border-navy-200/80 shadow-2xl rounded-2xl px-2 py-1.5 flex items-center justify-around w-full max-w-sm pointer-events-auto backdrop-blur-md">
          <Link href="/#vision" className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 gap-1 group focus-visible:ring-2 focus-visible:ring-bronze-500 rounded-lg outline-none" data-interactive>
            <Eye className={`w-6 h-6 transition-colors ${isActive("/", "vision") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`} />
            <span className={`text-[10px] font-medium tracking-wide uppercase transition-colors ${isActive("/", "vision") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`}>Vision</span>
          </Link>
          
          <Link href="/#strategy" className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 gap-1 group focus-visible:ring-2 focus-visible:ring-bronze-500 rounded-lg outline-none" data-interactive>
            <Target className={`w-6 h-6 transition-colors ${isActive("/", "strategy") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`} />
            <span className={`text-[10px] font-medium tracking-wide uppercase transition-colors ${isActive("/", "strategy") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`}>Strategy</span>
          </Link>

          <Link href="/#work" className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 gap-1 group focus-visible:ring-2 focus-visible:ring-bronze-500 rounded-lg outline-none" data-interactive>
            <Briefcase className={`w-6 h-6 transition-colors ${isActive("/", "work") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`} />
            <span className={`text-[10px] font-medium tracking-wide uppercase transition-colors ${isActive("/", "work") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`}>Work</span>
          </Link>

          <Link href="/#insights" className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 gap-1 group focus-visible:ring-2 focus-visible:ring-bronze-500 rounded-lg outline-none" data-interactive>
            <FileText className={`w-6 h-6 transition-colors ${isActive("/", "insights") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`} />
            <span className={`text-[10px] font-medium tracking-wide uppercase transition-colors ${isActive("/", "insights") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`}>Insights</span>
          </Link>

          <Link href="/contact" className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 gap-1 group focus-visible:ring-2 focus-visible:ring-bronze-500 rounded-lg outline-none" data-interactive>
            <Mail className={`w-6 h-6 transition-colors ${isActive("/contact", "contact") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`} />
            <span className={`text-[10px] font-medium tracking-wide uppercase transition-colors ${isActive("/contact", "contact") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`}>Contact</span>
          </Link>

          {user ? (
            <button onClick={() => startTransition(() => logoutUser())} disabled={isPending} className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 gap-1 group focus-visible:ring-2 focus-visible:ring-bronze-500 rounded-lg outline-none" data-interactive>
              <LogOut className="w-6 h-6 text-navy-500 group-hover:text-red-500 transition-colors" />
              <span className="text-[10px] font-medium tracking-wide uppercase text-navy-500 group-hover:text-red-500 transition-colors">Logout</span>
            </button>
          ) : (
            <Link href="/login" className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 gap-1 group focus-visible:ring-2 focus-visible:ring-bronze-500 rounded-lg outline-none" data-interactive>
              <UserCircle className={`w-6 h-6 transition-colors ${isActive("/login", "login") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`} />
              <span className={`text-[10px] font-medium tracking-wide uppercase transition-colors ${isActive("/login", "login") ? "text-bronze-900" : "text-navy-500 group-hover:text-bronze-900"}`}>Login</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
