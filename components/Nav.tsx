"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, Receipt, Folder, Bank, FileText, BookOpen, ArrowsClockwise } from "@phosphor-icons/react";
import { useRazao } from "@/hooks/useRazao";
import { useIsMobile } from "@/hooks/useIsMobile";

const nav = [
  { href: "/",            label: "Dashboard",   icon: ChartLine,  match: (p: string) => p === "/" },
  { href: "/lancamentos", label: "Lançamentos", icon: Receipt,    match: (p: string) => p.startsWith("/lancamentos") },
  { href: "/categorias",  label: "Categorias",  icon: Folder,     match: (p: string) => p.startsWith("/categorias") },
  { href: "/contas",      label: "Contas",      icon: Bank,       match: (p: string) => p.startsWith("/contas") },
  { href: "/relatorios",  label: "DRE",         icon: FileText,   match: (p: string) => p.startsWith("/relatorios") },
];

export function Nav() {
  const pathname = usePathname();
  const { resetData } = useRazao();
  const isMobile = useIsMobile();

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 10, padding: isMobile ? "10px 14px" : "14px 22px", flexShrink: 0,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(24px) saturate(160%)",
      WebkitBackdropFilter: "blur(24px) saturate(160%)",
      borderBottom: "1px solid #e2e8f0",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
        <div style={{
          width: isMobile ? 32 : 34, height: isMobile ? 32 : 34, borderRadius: 11,
          background: "linear-gradient(135deg, #6366f1, #4338ca)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 6px 16px rgba(67,56,202,0.28)",
        }}>
          <BookOpen size={17} weight="duotone" color="#ffffff" />
        </div>
        {!isMobile ? (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>Razão</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 1, whiteSpace: "nowrap" }}>Contabilidade inteligente</div>
          </div>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Razão</div>
        )}
      </Link>

      <nav style={{ display: "flex", gap: 3, alignItems: "center", overflowX: "auto" }}>
        {nav.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href} href={href} title={label}
              style={{
                display: "flex", alignItems: "center", gap: isMobile ? 0 : 7,
                padding: isMobile ? "8px 10px" : "8px 13px", borderRadius: 11,
                background: active ? "#eef2ff" : "transparent",
                border: active ? "1px solid #c7d2fe" : "1px solid transparent",
                color: active ? "#4338ca" : "#64748b",
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              <Icon size={14} weight={active ? "duotone" : "regular"} color={active ? "#6366f1" : "#64748b"} />
              {!isMobile && label}
              {isMobile && active && <span style={{ marginLeft: 6 }}>{label}</span>}
            </Link>
          );
        })}
        <button
          onClick={() => { if (confirm("Resetar todos os dados?")) resetData(); }}
          title="Resetar dados"
          style={{
            marginLeft: 6, width: 32, height: 32, borderRadius: 10,
            background: "#ffffff", border: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#64748b", cursor: "pointer", flexShrink: 0,
          }}
        >
          <ArrowsClockwise size={12} />
        </button>
      </nav>
    </header>
  );
}
