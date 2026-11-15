"use client";
// src/components/public/PublicPortalContainer.tsx
// Fixed Left Sidebar & Antigravity 3-Pane Integrated Layout with CDU Portal Design System

import { useState, useMemo, useEffect } from "react";
import PublicHeader from "./PublicHeader";
import PublicSidebar from "./PublicSidebar";
import PublicBanner from "./PublicBanner";
import PublicPortalView from "./PublicPortalView";
import IntegratedPreviewPane from "./IntegratedPreviewPane";
import { cn } from "@/lib/utils";
import { stripLeadingNumber } from "@/lib/hierarchy";

interface PublicPortalContainerProps {
  initialKategoris: any[];
  initialStats: any;
  isLoggedIn: boolean;
}

export default function PublicPortalContainer({
  initialKategoris,
  initialStats,
  isLoggedIn,
}: PublicPortalContainerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategoriId, setSelectedKategoriId] = useState<string>("ALL");
  const [selectedSubId, setSelectedSubId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // State for Collapsible Fixed Left Sidebar (ala CDU Portal)
  // Default: tertutup di mobile (< 768px) agar tidak menutupi layar saat pertama buka, terbuka di desktop
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const saved = localStorage.getItem("npu_public_sidebar_collapsed");
    if (saved !== null) {
      setIsSidebarCollapsed(saved === "true");
    } else if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  function handleToggleSidebar() {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("npu_public_sidebar_collapsed", String(next));
      return next;
    });
  }

  // State for Integrated Right Preview Pane (Antigravity IDE 3-Pane Style)
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isClosingPreview, setIsClosingPreview] = useState(false);

  // Active category name for the compact banner with numbering 1., 2.
  const activeCategoryName = useMemo(() => {
    if (selectedKategoriId === "ALL") return "Semua Dokumen";
    const foundIdx = initialKategoris.findIndex((k) => k.id === selectedKategoriId);
    if (foundIdx !== -1) {
      const num = `${foundIdx + 1}.`;
      const clean = stripLeadingNumber(initialKategoris[foundIdx].nama);
      return `${num} ${clean}`;
    }
    return "Kategori Dokumen";
  }, [initialKategoris, selectedKategoriId]);

  // Accordion state per Kategori di Halaman Utama (Default terbuka semua diawal)
  const [expandedKats, setExpandedKats] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    initialKategoris.forEach((k) => {
      initial[k.id] = true;
    });
    return initial;
  });

  const isAllCollapsed = useMemo(() => {
    return (
      initialKategoris.length > 0 &&
      initialKategoris.every((k) => expandedKats[k.id] === false)
    );
  }, [initialKategoris, expandedKats]);

  function handleToggleCollapseAll() {
    if (isAllCollapsed) {
      // Jika saat ini tertutup, klik untuk Buka Semua
      const next: Record<string, boolean> = {};
      initialKategoris.forEach((k) => {
        next[k.id] = true;
      });
      setExpandedKats(next);
    } else {
      // Jika saat ini terbuka, klik untuk Tutup Semua
      const next: Record<string, boolean> = {};
      initialKategoris.forEach((k) => {
        next[k.id] = false;
      });
      setExpandedKats(next);
    }
  }

  function handleToggleExpandKat(id: string) {
    setExpandedKats((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  }

  function handleSelectKategori(id: string) {
    setSelectedKategoriId(id);
    if (id !== "ALL") {
      // Otomatis buka kategori yang dipilih dari sidebar
      setExpandedKats((prev) => ({
        ...prev,
        [id]: true,
      }));
    }
    // Auto-tutup sidebar drawer di mobile agar langsung fokus ke daftar berkas
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  }

  function handleSelectSub(subId: string) {
    setSelectedSubId(subId);
    // Auto-tutup sidebar drawer di mobile
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  }

  // Document selection handler dengan toggle halus & animasi keluar
  function handleSelectDocument(doc: any) {
    if (previewDoc?.id === doc.id && isPreviewOpen && !isClosingPreview) {
      handleClosePreview();
      return;
    }
    setIsClosingPreview(false);
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  }

  function handleClosePreview() {
    if (isClosingPreview) return;
    setIsClosingPreview(true);
    setTimeout(() => {
      setIsPreviewOpen(false);
      setIsClosingPreview(false);
      setPreviewDoc(null);
    }, 450); // Selaras dengan durasi animasi keluar tab preview (450ms)
  }

  // Kunci scroll halaman latar belakang saat modal preview aktif di mobile (< lg)
  useEffect(() => {
    if (isPreviewOpen && !isClosingPreview) {
      const origOverflow = document.body.style.overflow;
      const origOverscroll = document.body.style.overscrollBehavior;
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
      return () => {
        document.body.style.overflow = origOverflow;
        document.body.style.overscrollBehavior = origOverscroll;
      };
    }
  }, [isPreviewOpen, isClosingPreview]);

  function handleResetFilters() {
    setSelectedKategoriId("ALL");
    setSelectedSubId("ALL");
    setSelectedStatus("ALL");
    setSearchQuery("");
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] font-sans antialiased flex flex-row">
      {/* ── MOBILE BACKDROP WHEN SIDEBAR OPEN ON MOBILE ─────────────────── */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-slate-900/30 z-30 md:hidden animate-backdrop"
          onClick={handleToggleSidebar}
        />
      )}

      {/* ── TAB 1: LEFT FIXED SIDEBAR (IDENTIK CDU PORTAL - POSISI FIXED) ── */}
      <PublicSidebar
        kategoris={initialKategoris}
        selectedKategoriId={selectedKategoriId}
        onSelectKategori={handleSelectKategori}
        selectedSubId={selectedSubId}
        onSelectSub={handleSelectSub}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        stats={initialStats}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* ── SPACER PLACEHOLDER TO PRESERVE LAYOUT WIDTH FOR FIXED SIDEBAR ─ */}
      <div
        className={cn(
          "hidden md:block shrink-0 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-[68px]" : "w-[250px]"
        )}
        aria-hidden="true"
      />

      {/* ── RIGHT MAIN WORKSPACE COLUMN ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
        {/* TOPBAR (IDENTIK CDU PORTAL - STICKY TOP) */}
        <PublicHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoggedIn={isLoggedIn}
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* ── MULTI-PANE CONTENT AREA (ANTIGRAVITY IDE 3-PANE STYLE) ───────── */}
        <div className="flex-1 p-3 sm:p-4 md:p-5 flex flex-col lg:flex-row items-start gap-4 lg:gap-5 w-full">
          {/* TAB 2: CENTER DOCUMENT GRID (ALA CONTOH UPI - 5 KOLOM PER BARIS) */}
          <main
            className={cn(
              "min-w-0 transition-all duration-450 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isPreviewOpen && !isClosingPreview
                ? "flex-1 w-full lg:max-w-[calc(100%-48%-1.25rem)] xl:max-w-[calc(100%-50%-1.25rem)]"
                : "w-full flex-1"
            )}
          >
            {/* Slim Greeting Banner ala CDU Portal dengan Dropdown Filter Status Sebaris & Tombol Toggle Buka/Tutup Kategori */}
            <PublicBanner
              activeCategoryName={activeCategoryName}
              totalDocs={initialStats.totalDokumen}
              stats={initialStats}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              isAllCollapsed={isAllCollapsed}
              onToggleCollapseAll={handleToggleCollapseAll}
            />

            {/* Document Grid with 5 columns per row */}
            <PublicPortalView
              kategoris={initialKategoris}
              selectedKategoriId={selectedKategoriId}
              selectedSubId={selectedSubId}
              selectedStatus={selectedStatus}
              searchQuery={searchQuery}
              activeDocumentId={isPreviewOpen && !isClosingPreview ? previewDoc?.id : null}
              isSplitView={isPreviewOpen && !isClosingPreview}
              onSelectDocument={handleSelectDocument}
              onResetFilters={handleResetFilters}
              expandedKats={expandedKats}
              onToggleExpandKat={handleToggleExpandKat}
            />
          </main>

          {/* TAB 3: RIGHT INTEGRATED PREVIEW PANE (DESKTOP SPLIT VIEW: >= lg) */}
          <div
            className={cn(
              "hidden lg:block sticky top-16 lg:top-[72px] h-[calc(100vh-5.5rem)] shrink-0 transition-all duration-450 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isPreviewOpen && !isClosingPreview
                ? "w-[48%] xl:w-[50%] opacity-100"
                : "w-0 opacity-0 pointer-events-none overflow-hidden"
            )}
          >
            {previewDoc && (
              <div
                className={cn(
                  "w-full h-full transition-transform duration-450 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
                  isPreviewOpen && !isClosingPreview
                    ? "translate-x-0"
                    : "translate-x-full"
                )}
              >
                <IntegratedPreviewPane
                  dokumen={previewDoc}
                  onClose={handleClosePreview}
                  isClosing={isClosingPreview}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE PREVIEW FULL-SCREEN / BOTTOM-SHEET MODAL (< lg) ──────── */}
        {previewDoc && (
          <div
            className={cn(
              "fixed inset-0 z-50 lg:hidden flex flex-col justify-end sm:justify-center bg-slate-900/60 backdrop-blur-xs overscroll-contain transition-opacity duration-300",
              isPreviewOpen && !isClosingPreview
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            )}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClosePreview();
            }}
          >
            <div
              className={cn(
                "h-[92vh] sm:h-[88vh] w-full sm:max-w-xl sm:mx-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden overscroll-contain transition-transform duration-350 ease-out will-change-transform",
                isPreviewOpen && !isClosingPreview
                  ? "translate-y-0 scale-100"
                  : "translate-y-full sm:scale-95"
              )}
            >
              <IntegratedPreviewPane
                dokumen={previewDoc}
                onClose={handleClosePreview}
                isClosing={isClosingPreview}
                isMobileModal={true}
              />
            </div>
          </div>
        )}

        {/* ── FOOTER FULL WIDTH ────────────────────────────────────────── */}
        <footer className="mt-auto border-t border-slate-200/70 bg-white py-3.5 px-4 sm:px-6 text-xs text-slate-500 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              &copy; {new Date().getFullYear()} Universitas Nusa Putra. File Manager System.
            </p>
            <p className="font-medium text-slate-400">
              NPU File Manager &bull; Sistem Manajemen Dokumen Terpadu
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
