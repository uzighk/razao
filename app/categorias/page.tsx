"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, PencilSimple, Trash, X, Check, Folder, ArrowDownRight, ArrowUpRight } from "@phosphor-icons/react";
import { Nav } from "@/components/Nav";
import { useRazao } from "@/hooks/useRazao";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Category, CategoryType, CategoryGroup, CATEGORY_GROUP_LABEL } from "@/lib/types";

const PALETTE = ["#0d9488", "#10b981", "#22c55e", "#14b8a6", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#dc2626", "#f97316", "#f59e0b", "#d97706", "#84cc16", "#0ea5e9", "#475569", "#64748b"];

const GROUPS_RECEITA: CategoryGroup[] = ["operacional_receita", "financeiro"];
const GROUPS_DESPESA: CategoryGroup[] = ["operacional_despesa", "pessoal", "tributos", "financeiro", "investimento"];

const EMPTY: Omit<Category, "id"> = { name: "", type: "despesa", group: "operacional_despesa", color: PALETTE[0], icon: "Folder" };

function fmtBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function CategoriasPage() {
  const { categories, transactions, addCategory, updateCategory, deleteCategory, loaded } = useRazao();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<CategoryType>("receita");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function openNew(type: CategoryType) {
    const usedColors = new Set(categories.map((c) => c.color));
    const free = PALETTE.find((c) => !usedColors.has(c)) ?? PALETTE[0];
    const defaultGroup: CategoryGroup = type === "receita" ? "operacional_receita" : "operacional_despesa";
    setEditing(null);
    setForm({ name: "", type, group: defaultGroup, color: free, icon: "Folder" });
    setShowForm(true);
  }
  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, type: c.type, group: c.group, color: c.color, icon: c.icon });
    setShowForm(true);
  }
  function handleSave() {
    if (!form.name.trim()) return;
    if (editing) updateCategory(editing.id, form);
    else addCategory(form);
    setShowForm(false);
  }

  const filtered = categories.filter((c) => c.type === tab);
  const groups = tab === "receita" ? GROUPS_RECEITA : GROUPS_DESPESA;

  function totalsForCategory(id: string) {
    return transactions.filter((t) => t.categoryId === id && t.status === "pago").reduce((s, t) => s + t.amount, 0);
  }

  if (!loaded) return <div className="bg-finance" style={{ height: "100vh" }} />;

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
            Plano de contas
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Organize receitas e despesas por categoria e grupo contábil
          </p>
        </div>
        <button onClick={() => openNew(tab)} style={{ ...btnPrimary, flex: isMobile ? 1 : "0 0 auto", justifyContent: "center" }}>
          <Plus size={13} weight="bold" />
          Nova categoria
        </button>
      </div>

      {/* Tab toggle */}
      <div style={{ padding: isMobile ? "12px 14px 0" : "16px 24px 0", flexShrink: 0 }}>
        <div style={{
          display: "inline-flex", padding: 3, borderRadius: 11,
          background: "#ffffff", border: "1px solid #e2e8f0",
        }}>
          <button onClick={() => setTab("receita")} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8,
            background: tab === "receita" ? "#ecfdf5" : "transparent",
            border: tab === "receita" ? "1px solid #a7f3d0" : "1px solid transparent",
            color: tab === "receita" ? "#047857" : "#64748b",
            fontSize: 12.5, fontWeight: tab === "receita" ? 600 : 500,
            cursor: "pointer",
          }}>
            <ArrowDownRight size={13} weight="bold" /> Receitas
          </button>
          <button onClick={() => setTab("despesa")} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8,
            background: tab === "despesa" ? "#fef2f2" : "transparent",
            border: tab === "despesa" ? "1px solid #fecaca" : "1px solid transparent",
            color: tab === "despesa" ? "#b91c1c" : "#64748b",
            fontSize: 12.5, fontWeight: tab === "despesa" ? 600 : 500,
            cursor: "pointer",
          }}>
            <ArrowUpRight size={13} weight="bold" /> Despesas
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "14px 14px 24px" : "18px 24px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {groups.map((group) => {
            const inGroup = filtered.filter((c) => c.group === group);
            if (inGroup.length === 0) return null;
            const groupTotal = inGroup.reduce((s, c) => s + totalsForCategory(c.id), 0);
            return (
              <div key={group}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, padding: "0 4px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {CATEGORY_GROUP_LABEL[group]}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: tab === "receita" ? "#047857" : "#b91c1c" }}>
                    {fmtBRL(groupTotal)}
                  </div>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 10,
                }}>
                  <AnimatePresence>
                    {inGroup.map((c) => (
                      <CategoryCard key={c.id} c={c} total={totalsForCategory(c.id)}
                        confirmDelete={confirmDelete === c.id}
                        onEdit={() => openEdit(c)}
                        onAskDelete={() => setConfirmDelete(c.id)}
                        onCancelDelete={() => setConfirmDelete(null)}
                        onDelete={() => { deleteCategory(c.id); setConfirmDelete(null); }} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(15,23,42,0.5)",
              backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }} onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 18,
                width: "min(460px, calc(100vw - 24px))",
                maxHeight: "calc(100vh - 32px)", overflowY: "auto",
                boxShadow: "0 30px 70px rgba(15,23,42,0.18)",
              }}
            >
              <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${form.color}15`, border: `1px solid ${form.color}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Folder size={16} weight="duotone" color={form.color} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                    {editing ? "Editar categoria" : "Nova categoria"}
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} style={iconBtn}><X size={13} /></button>
              </div>

              <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={lbl}>Nome</label>
                  <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Vendas de produtos" style={inp} />
                </div>

                <div>
                  <label style={lbl}>Tipo</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 3, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 11 }}>
                    <button onClick={() => setForm({ ...form, type: "receita", group: "operacional_receita" })} style={{
                      padding: "8px 12px", borderRadius: 8,
                      background: form.type === "receita" ? "#ecfdf5" : "transparent",
                      border: form.type === "receita" ? "1px solid #a7f3d0" : "1px solid transparent",
                      color: form.type === "receita" ? "#047857" : "#64748b",
                      fontSize: 12, fontWeight: form.type === "receita" ? 600 : 500, cursor: "pointer",
                    }}>Receita</button>
                    <button onClick={() => setForm({ ...form, type: "despesa", group: "operacional_despesa" })} style={{
                      padding: "8px 12px", borderRadius: 8,
                      background: form.type === "despesa" ? "#fef2f2" : "transparent",
                      border: form.type === "despesa" ? "1px solid #fecaca" : "1px solid transparent",
                      color: form.type === "despesa" ? "#b91c1c" : "#64748b",
                      fontSize: 12, fontWeight: form.type === "despesa" ? 600 : 500, cursor: "pointer",
                    }}>Despesa</button>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Grupo contábil</label>
                  <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value as CategoryGroup })} style={inp}>
                    {(form.type === "receita" ? GROUPS_RECEITA : GROUPS_DESPESA).map((g) => (
                      <option key={g} value={g}>{CATEGORY_GROUP_LABEL[g]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Cor</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {PALETTE.map((c) => {
                      const active = form.color === c;
                      return (
                        <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{
                          width: 28, height: 28, borderRadius: 9,
                          background: c,
                          border: active ? "3px solid #ffffff" : "2px solid transparent",
                          outline: active ? `2px solid ${c}` : "1px solid #e2e8f0",
                          cursor: "pointer", flexShrink: 0,
                          boxShadow: active ? `0 4px 10px ${c}55` : "none",
                        }} />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ padding: "0 22px 20px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancelar</button>
                <button onClick={handleSave} style={btnPrimary}>
                  <Check size={13} weight="bold" /> {editing ? "Salvar" : "Criar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryCard({ c, total, confirmDelete, onEdit, onAskDelete, onCancelDelete, onDelete }: {
  c: Category; total: number; confirmDelete: boolean;
  onEdit: () => void; onAskDelete: () => void; onCancelDelete: () => void; onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{
        position: "relative", overflow: "hidden",
        background: "#ffffff", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: "12px 14px 12px 18px",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: c.color }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: `${c.color}15`, border: `1px solid ${c.color}33`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Folder size={14} weight="duotone" color={c.color} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
          <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>
            Total: {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {confirmDelete ? (
          <>
            <button onClick={onDelete} style={btnIconDanger}><Check size={11} weight="bold" /></button>
            <button onClick={onCancelDelete} style={btnIconNeutral}><X size={11} /></button>
          </>
        ) : (
          <>
            <button onClick={onEdit} style={btnIconNeutral}><PencilSimple size={11} /></button>
            <button onClick={onAskDelete} style={btnIconNeutral}><Trash size={11} /></button>
          </>
        )}
      </div>
    </motion.div>
  );
}

const lbl: React.CSSProperties = {
  fontSize: 10, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
  marginBottom: 6, display: "block",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9,
  color: "#0f172a", fontSize: 13,
};
const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "9px 18px", borderRadius: 10,
  background: "linear-gradient(135deg, #6366f1, #4338ca)",
  color: "#ffffff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  border: "1px solid #4338ca",
  boxShadow: "0 6px 16px rgba(67,56,202,0.22)",
  whiteSpace: "nowrap", flexShrink: 0,
};
const btnSecondary: React.CSSProperties = {
  background: "#ffffff", color: "#64748b", border: "1px solid #e2e8f0",
  borderRadius: 9, padding: "9px 14px", fontSize: 12.5, cursor: "pointer",
};
const btnIconNeutral: React.CSSProperties = {
  width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
  background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 7,
  cursor: "pointer", color: "#64748b",
};
const btnIconDanger: React.CSSProperties = {
  width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
  background: "#dc2626", border: "none", borderRadius: 7,
  cursor: "pointer", color: "#ffffff",
};
const iconBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 9,
  background: "#f8fafc", border: "1px solid #e2e8f0",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#64748b", cursor: "pointer",
};
