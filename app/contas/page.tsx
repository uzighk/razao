"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, PencilSimple, Trash, X, Check, Wallet, Bank, Money, CreditCard, ArrowUpRight, ArrowDownRight } from "@phosphor-icons/react";
import { Nav } from "@/components/Nav";
import { useRazao } from "@/hooks/useRazao";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Account, AccountType, ACCOUNT_TYPE_LABEL } from "@/lib/types";

const PALETTE = ["#6366f1", "#0d9488", "#f97316", "#a855f7", "#0ea5e9", "#10b981", "#f59e0b", "#dc2626", "#ec4899", "#84cc16"];
const TYPES: AccountType[] = ["corrente", "poupanca", "caixa", "cartao_credito"];

function fmtBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function iconForType(t: AccountType): typeof Wallet {
  if (t === "corrente") return Bank;
  if (t === "poupanca") return Wallet;
  if (t === "caixa") return Money;
  return CreditCard;
}

const EMPTY: Omit<Account, "id"> = { name: "", bank: "", type: "corrente", initialBalance: 0, color: PALETTE[0] };

export default function ContasPage() {
  const { accounts, transactions, accountBalance, addAccount, updateAccount, deleteAccount, loaded } = useRazao();
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [initialBalanceStr, setInitialBalanceStr] = useState("0");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function openNew() {
    const usedColors = new Set(accounts.map((a) => a.color));
    const free = PALETTE.find((c) => !usedColors.has(c)) ?? PALETTE[0];
    setEditing(null);
    setForm({ ...EMPTY, color: free });
    setInitialBalanceStr("0");
    setShowForm(true);
  }
  function openEdit(a: Account) {
    setEditing(a);
    setForm({ name: a.name, bank: a.bank, type: a.type, initialBalance: a.initialBalance, color: a.color });
    setInitialBalanceStr(String(a.initialBalance));
    setShowForm(true);
  }
  function handleSave() {
    if (!form.name.trim()) return;
    const ib = parseFloat(initialBalanceStr.replace(",", ".")) || 0;
    const data = { ...form, initialBalance: ib };
    if (editing) updateAccount(editing.id, data);
    else addAccount(data);
    setShowForm(false);
  }

  function accountFlow(id: string) {
    const txs = transactions.filter((t) => t.accountId === id && t.status === "pago");
    const receitas = txs.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
    const despesas = txs.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
    return { receitas, despesas, count: txs.length };
  }

  if (!loaded) return <div className="bg-finance" style={{ height: "100vh" }} />;

  const totalBalance = accounts.reduce((s, a) => s + accountBalance(a.id), 0);

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
            Contas
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {accounts.length} conta{accounts.length !== 1 ? "s" : ""} · Saldo total {fmtBRL(totalBalance)}
          </p>
        </div>
        <button onClick={openNew} style={{ ...btnPrimary, flex: isMobile ? 1 : "0 0 auto", justifyContent: "center" }}>
          <Plus size={13} weight="bold" /> Nova conta
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "14px 14px 24px" : "20px 24px 28px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 12,
        }}>
          <AnimatePresence>
            {accounts.map((a) => {
              const bal = accountBalance(a.id);
              const flow = accountFlow(a.id);
              const Icon = iconForType(a.type);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    position: "relative", overflow: "hidden",
                    background: "#ffffff", border: "1px solid #e2e8f0",
                    borderRadius: 16, padding: 18,
                    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                  }}
                >
                  {/* Color stripe */}
                  <div style={{
                    position: "absolute", left: 0, top: 0, right: 0, height: 4,
                    background: `linear-gradient(90deg, ${a.color}, ${a.color}88)`,
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 11,
                        background: `${a.color}15`, border: `1px solid ${a.color}33`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={18} weight="duotone" color={a.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{a.bank} · {ACCOUNT_TYPE_LABEL[a.type]}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {confirmDelete === a.id ? (
                        <>
                          <button onClick={() => { deleteAccount(a.id); setConfirmDelete(null); }} style={btnIconDanger}><Check size={11} weight="bold" /></button>
                          <button onClick={() => setConfirmDelete(null)} style={btnIconNeutral}><X size={11} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openEdit(a)} style={btnIconNeutral}><PencilSimple size={11} /></button>
                          <button onClick={() => setConfirmDelete(a.id)} style={btnIconNeutral}><Trash size={11} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                      Saldo atual
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: bal >= 0 ? "#0f172a" : "#e11d48", marginTop: 4, letterSpacing: "-0.01em" }}>
                      {fmtBRL(bal)}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>
                      Inicial: {fmtBRL(a.initialBalance)}
                    </div>
                  </div>

                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 8, paddingTop: 12, borderTop: "1px solid #f1f5f9",
                  }}>
                    <FlowMini icon={ArrowDownRight} label="Receitas" value={flow.receitas} color="#10b981" />
                    <FlowMini icon={ArrowUpRight} label="Despesas" value={flow.despesas} color="#e11d48" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
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
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18,
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
                    <Wallet size={15} weight="duotone" color={form.color} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                    {editing ? "Editar conta" : "Nova conta"}
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} style={iconBtn}><X size={13} /></button>
              </div>

              <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lbl}>Nome da conta</label>
                    <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Conta Corrente" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Banco</label>
                    <input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })}
                      placeholder="Itaú, Nubank..." style={inp} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })} style={inp}>
                    {TYPES.map((t) => <option key={t} value={t}>{ACCOUNT_TYPE_LABEL[t]}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Saldo inicial</label>
                  <input type="text" inputMode="decimal" value={initialBalanceStr} onChange={(e) => setInitialBalanceStr(e.target.value)} style={inp} />
                </div>

                <div>
                  <label style={lbl}>Cor</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {PALETTE.map((c) => {
                      const active = form.color === c;
                      return (
                        <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{
                          width: 30, height: 30, borderRadius: 9,
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

function FlowMini({ icon: Icon, label, value, color }: { icon: typeof Wallet; label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        <Icon size={9} color={color} weight="bold" />
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>
        {value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6, display: "block" };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, color: "#0f172a", fontSize: 13 };
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
