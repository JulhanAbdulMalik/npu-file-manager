"use client";
// src/components/layout/Sidebar.tsx
// Compact & Collapsible Mini / Full Sidebar with Plus Jakarta Sans & #a80063 Brand

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Layers,
  FileStack,
  ShieldCheck,
  FolderOpen,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface NavGroup {
  category: string;
  allowedRoles?: ("SUPER_ADMIN" | "ADMIN")[];
  items: {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    allowedRoles?: ("SUPER_ADMIN" | "ADMIN")[];
    children?: { label: string; href: string }[];
    dividerBefore?: boolean;
  }[];
}

const navGroups: NavGroup[] = [
  {
    category: "MAIN",
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    category: "DOKUMEN",
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
    items: [
      {
        label: "Kelola Kategori",
        href: "/kategori",
        icon: Layers,
        allowedRoles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        label: "Kelola Dokumen",
        href: "/dokumen",
        icon: FileStack,
        allowedRoles: ["SUPER_ADMIN", "ADMIN"],
      },
    ],
  },
  {
    category: "PENGATURAN",
    allowedRoles: ["SUPER_ADMIN"],
    items: [
      {
        label: "Kelola Akun",
        href: "/akun",
        icon: ShieldCheck,
        badge: "Super",
        allowedRoles: ["SUPER_ADMIN"],
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const userRole = (session?.user as any)?.role as "SUPER_ADMIN" | "ADMIN" | undefined;

  const filteredNavGroups = navGroups
    .filter((group) => !group.allowedRoles || (userRole && group.allowedRoles.includes(userRole)))
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.allowedRoles || (userRole && item.allowedRoles.includes(userRole))
      ),
    }))
    .filter((group) => group.items.length > 0);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function handleNavClick() {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      toggleSidebar();
    }
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 bottom-0 h-screen flex flex-col z-40 bg-white border-r border-slate-200/70 shadow-[1px_0_8px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out select-none overflow-x-hidden overflow-y-hidden md:sticky md:top-0 md:shrink-0",
        isCollapsed
          ? "w-[68px] -translate-x-full md:translate-x-0"
          : "w-[250px] md:w-[230px] translate-x-0 max-md:shadow-2xl"
      )}
    >
      {/* ── Brand Header & Toggle ────────────────────────────────────────────── */}
      <div
        className={cn(
          "h-14 flex items-center border-b border-slate-100/90 transition-all shrink-0 overflow-hidden",
          isCollapsed ? "px-3 justify-center" : "px-4 justify-between"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0"
          title="NPU File Manager - Nusa Putra University"
        >
          <div className="w-8 h-8 rounded-lg bg-[#a80063] flex items-center justify-center shadow-sm shadow-[#a80063]/20 shrink-0">
            <FolderOpen size={17} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                NPU <span className="text-[#a80063]">FILE</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                Nusa Putra University
              </p>
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button in Full Mode */}
        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-[#a80063] hover:bg-[#fdf2f8] flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Ciutkan Sidebar (Mode Mini)"
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* ── Navigation Groups ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-3.5 scrollbar-thin">
        {filteredNavGroups.map((group) => (
          <div key={group.category} className="space-y-1 overflow-hidden">
            {!isCollapsed ? (
              <p className="px-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 truncate">
                {group.category}
              </p>
            ) : (
              <div className="h-px bg-slate-100 my-1.5 mx-1" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <Fragment key={item.href}>
                    {item.dividerBefore && (
                      <div
                        className={cn(
                          "my-1.5",
                          isCollapsed
                            ? "h-px bg-slate-100 mx-1"
                            : "h-px bg-slate-200/70 mx-2"
                        )}
                      />
                    )}
                    <div className="relative">
                      <Link
                        href={hasChildren ? item.children![0].href : item.href}
                        prefetch={false}
                        onClick={handleNavClick}
                        title={item.label}
                        className={cn(
                          "flex items-center rounded-lg text-xs transition-all duration-150 relative cursor-pointer overflow-hidden",
                          isCollapsed
                            ? "w-10 h-10 mx-auto justify-center p-0 my-0.5"
                            : "gap-2.5 px-2.5 py-2.5 sm:py-2 min-h-[42px] sm:min-h-[36px]",
                          active
                            ? "bg-[#fdf2f8] text-[#a80063] font-semibold shadow-xs"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                        )}
                      >
                        {/* Left active vertical bar */}
                        {active && !isCollapsed && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#a80063] rounded-r-full" />
                        )}

                        <Icon
                          size={17}
                          className={cn(
                            "shrink-0 transition-colors",
                            active
                              ? "text-[#a80063]"
                              : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />

                        {!isCollapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>

                            {item.badge && (
                              <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-[#fce7f3] text-[#a80063] border border-[#fbcfe8]">
                                {item.badge}
                              </span>
                            )}

                            {hasChildren && (
                              <ChevronRight
                                size={13}
                                className={cn(
                                  "text-slate-400 transition-transform",
                                  active && "rotate-90 text-[#a80063]"
                                )}
                              />
                            )}
                          </>
                        )}
                      </Link>

                      {/* Sub-menu if any (Full Mode only) */}
                      {hasChildren && active && !isCollapsed && (
                        <div className="mt-0.5 ml-5 pl-2.5 border-l border-slate-200/80 space-y-0.5">
                          {item.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              prefetch={false}
                              onClick={handleNavClick}
                              className={cn(
                                "block px-2.5 py-1.5 sm:py-1 rounded text-xs sm:text-[11px] transition-colors truncate min-h-[32px] sm:min-h-0",
                                pathname === child.href
                                  ? "text-[#a80063] font-semibold bg-[#fdf2f8]"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom Banner Card in Full Mode */}
        {!isCollapsed && (
          <div className="p-3 rounded-xl bg-[#fdf2f8] border border-[#fbcfe8]/50 mt-3 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a80063]" />
              <span className="text-[10px] font-bold text-[#a80063] uppercase tracking-wider">
                Status Sistem
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-800">
              Dokumen & Berkas
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
              Nusa Putra File Manager
            </p>
            <Link
              href="/dokumen"
              className="mt-2 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-[11px] font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Sparkles size={11} />
              Buka Dokumen
            </Link>
          </div>
        )}
      </div>

      {/* ── Footer / Logout & Expand Button in Mini Mode ─────────────────────── */}
      <div className="p-2.5 border-t border-slate-100 space-y-1 shrink-0 overflow-hidden">
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 mx-auto rounded-lg text-slate-400 hover:text-[#a80063] hover:bg-[#fdf2f8] flex items-center justify-center transition-all cursor-pointer mb-0.5"
            title="Perluas Sidebar (Mode Penuh)"
          >
            <PanelLeft size={16} />
          </button>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex items-center rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer overflow-hidden",
            isCollapsed
              ? "w-10 h-10 mx-auto justify-center"
              : "gap-2.5 w-full px-2.5 py-1.5"
          )}
          title="Keluar Akun"
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Keluar Akun</span>}
        </button>
      </div>
    </aside>
  );
}
