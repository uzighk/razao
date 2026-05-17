"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MagnifyingGlass, ArrowUpRight, ArrowDownRight, X, CaretDown, ArrowsClockwise } from "@phosphor-icons/react";
import { Nav } from "@/components/Nav";
import { TransactionModal } from "@/components/TransactionModal";
import { useRazao } from "@/hooks/useRazao";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Transaction, TransactionStatus, CategoryType, STATUS_META } from "@/lib/types";

const MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function fmtBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function parseDate(iso: string) { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); }

export default function LancamentosPage() {
  const { transactions, categories, accounts, loaded } = useRazao();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | CategoryType>("");
  const [statusFilter, setStatusFilter] = useState<"" | TransactionStatus>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showNew, setShowNew] = useState<{ type?: CategoryType } | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (categoryFilter && t.categoryId !== categoryFilter) return false;
      if (accountFilter && t.accountId !== accountFilter) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [transactions, typeFilter, statusFilter, categoryFilter, accountFilter, search]);

  const totals = useMemo(() => {
    const receita = filtered.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
    const despesa = filtered.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
    return { receita, despesa, resultado: receita - despesa };
  }, [filtered]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  if (!loaded) return <div className="bg-finance" style={{ height: "100vh" }} />;

  const hasFilters = !!(typeFilter || statusFilter || categoryFilter || accountFilter || search);

  return (
    <div className="bg-finance" style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Nav />

      <div style={{
        padding: isMobile ? "14px 14px 0" : "20px 24px 0",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between",
        gap: isMobile ? 12 : 16,
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Lançamentos
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {filtered.length} lançamento{filtered.length !== 1 ? "s" : ""}
            {hasFilters && ` filtrado${filtered.length !== 1 ? "s" : ""}`}
            {" · "}Receitas {fmtBRL(totals.receita)} · Despesas {fmtBRL(totals.despesa)}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
          <button onClick={() => setShowNew({ type: "receita" })} style={{ ...btnReceita, flex: isMobile ? 1 : "0 0 auto", justifyContent: "center" }}>
            <ArrowDownRight size={13} weight="bold" /> Receita
          </button>
          <button onClick={() => setShowNew({ type: "despesa" })} style={{ ...btnDespesa, flex: isMobile ? 1 : "0 0 auto", justifyContent: "center" }}>
            <ArrowUpRight size={13} weight="bold" /> Despesa
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: isMobile ? "12px 14px 0" : "16px 24px 0",
        flexShrink: 0,
        display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ position: "relative", flex: isMobile ? 1 : "0 0 320px", minWidth: 0 }}>
          <MagnifyingGlass size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lançamento..."
            style={{
              width: "100%", padding: "9px 12px 9px 36px",
              background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10,
              color: "#0f172a", fontSize: 13,
            }} />
        </div>

        <FilterSelect value={typeFilter} onChange={(v) => setTypeFilter(v as CategoryType | "")} options={[
          { value: "", label: "Todos os tipos" },
          { value: "receita", label: "Receitas" },
          { value: "despesa", label: "Despesas" },
        ]} />

        <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v as TransactionStatus | "")} options={[
          { value: "", label: "Todos os status" },
          { value: "pago", label: "Pago" },
          { value: "pendente", label: "Pendente" },
          { value: "agendado", label: "Agendado" },
        ]} />

        <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={[
          { value: "", label: "Todas categorias" },
          ...categories.map((c) => ({ value: c.id, label: c.name })),
        ]} />

        <FilterSelect value={accountFilter} onChange={setAccountFilter} options={[
          { value: "", label: "Todas contas" },
          ...accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.bank})` })),
        ]} />

        {hasFilters && (
          <button onClick={() => { setSearch(""); setTypeFilter(""); setStatusFilter(""); setCategoryFilter(""); setAccountFilter(""); }} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 12px", borderRadius: 10,
            background: "#eef2ff", border: "1px solid #c7d2fe",
            color: "#4338ca", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
          }}>
            <X size={12} /> Limpar filtros
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "14px 14px 24px" : "18px 24px 28px" }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#ffffff", border: "1px dashed #e2e8f0", borderRadius: 14,
            color: "#94a3b8", fontSize: 13,
          }}>
            Nenhum lançamento encontrado
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {grouped.map(([date, items]) => {
              const d = parseDate(date);
              const dayTotal = items.reduce((s, t) => s + (t.type === "receita" ? t.amount : -t.amount), 0);
              return (
                <div key={date}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0 4px 8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#0f172a" }}>
                        {d.getDate()} de {MONTHS[d.getMonth()]} · {d.getFullYear()}
                      </div>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>{items.length} {items.length === 1 ? "item" : "itens"}</span>
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: dayTotal >= 0 ? "#047857" : "#b91c1c" }}>
                      {dayTotal >= 0 ? "+" : ""}{fmtBRL(dayTotal)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <AnimatePresence>
                      {items.map((t) => (
                        <TransactionRow key={t.id} t={t}
                          category={categories.find((c) => c.id === t.categoryId)}
                          account={accounts.find((a) => a.id === t.accountId)}
                          isMobile={isMobile}
                          onClick={() => setEditing(t)} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransactionModal
        open={!!editing || !!showNew}
        transaction={editing}
        defaultType={showNew?.type}
        onClose={() => { setEditing(null); setShowNew(null); }}
      />
    </div>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        padding: "8px 28px 8px 12px", borderRadius: 10,
        background: value ? "#eef2ff" : "#ffffff",
        border: `1px solid ${value ? "#c7d2fe" : "#e2e8f0"}`,
        color: value ? "#4338ca" : "#475569",
        fontSize: 11.5, fontWeight: value ? 600 : 500,
        cursor: "pointer", appearance: "none", outline: "none",
      }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <CaretDown size={10} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: value ? "#4338ca" : "#94a3b8" }} />
    </div>
  );
}

function TransactionRow({ t, category, account, isMobile, onClick }: {
  t: Transaction;
  category?: { name: string; color: string };
  account?: { name: string; color: string };
  isMobile: boolean;
  onClick: () => void;
}) {
  const s = STATUS_META[t.status];
  const isReceita = t.type === "receita";
  const sign = isReceita ? "+" : "−";
  const valueColor = isReceita ? "#047857" : "#b91c1c";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      onClick={onClick}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.12 }}
      style={{
        position: "relative",
        background: "#ffffff", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: isMobile ? "12px 14px" : "12px 16px",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
        textAlign: "left", cursor: "pointer",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1fr auto auto",
        gap: isMobile ? 10 : 14,
        alignItems: "center",
      }}
    >
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: isReceita ? "#10b981" : "#e11d48",
      }} />

      <div style={{
        width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10,
        background: isReceita ? "#ecfdf5" : "#fef2f2",
        border: `1px solid ${isReceita ? "#a7f3d0" : "#fecaca"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isReceita
          ? <ArrowDownRight size={14} weight="bold" color="#10b981" />
          : <ArrowUpRight size={14} weight="bold" color="#e11d48" />
        }
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.description}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10.5, color: "#64748b" }}>
          {category && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: category.color }} />
              {category.name}
            </span>
          )}
          {!isMobile && account && (
            <>
              <span style={{ color: "#cbd5e1" }}>·</span>
              <span>{account.name}</span>
            </>
          )}
          {t.recurring !== "none" && (
            <>
              <span style={{ color: "#cbd5e1" }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#6366f1" }}>
                <ArrowsClockwise size={10} /> {t.recurring === "monthly" ? "Mensal" : "Anual"}
              </span>
            </>
          )}
        </div>
      </div>

      {!isMobile && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 9px", borderRadius: 20,
          background: s.bg, border: `1px solid ${s.border}`,
          color: s.text, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />
          {s.label}
        </span>
      )}

      <div style={{ fontSize: 14, fontWeight: 700, color: valueColor, whiteSpace: "nowrap", textAlign: "right" }}>
        {sign} {fmtBRL(t.amount)}
        {isMobile && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "1px 6px", borderRadius: 8, marginTop: 4,
            background: s.bg, border: `1px solid ${s.border}`,
            color: s.text, fontSize: 9, fontWeight: 600,
          }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: s.color }} />
            {s.label}
          </div>
        )}
      </div>
    </motion.button>
  );
}

const btnReceita: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "9px 16px", borderRadius: 10,
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "#ffffff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  border: "1px solid #059669",
  boxShadow: "0 6px 16px rgba(16,185,129,0.22)",
  whiteSpace: "nowrap", flexShrink: 0,
};

const btnDespesa: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "9px 16px", borderRadius: 10,
  background: "linear-gradient(135deg, #f43f5e, #e11d48)",
  color: "#ffffff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  border: "1px solid #e11d48",
  boxShadow: "0 6px 16px rgba(225,29,72,0.22)",
  whiteSpace: "nowrap", flexShrink: 0,
};
