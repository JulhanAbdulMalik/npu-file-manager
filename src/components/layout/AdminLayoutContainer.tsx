"use client";
// src/components/layout/AdminLayoutContainer.tsx
// Responsive Admin Shell with Mobile Drawer, Backdrop & Desktop Spacer

import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

export default function AdminLayoutContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      {/* ── MOBILE BACKDROP WHEN ADMIN SIDEBAR OPEN ON MOBILE ───────────── */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden animate-fade-in"
          onClick={toggleSidebar}
        />
      )}

      {/* ── ADMIN SIDEBAR (DRAWER ON MOBILE, IN-FLOW STICKY ON DESKTOP) ─ */}
      <Sidebar />

      {/* ── RIGHT MAIN WORKSPACE COLUMN ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
        <Header />
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-7 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
