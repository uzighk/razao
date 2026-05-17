"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Trash, Calendar, Wallet, Folder, ChatText, ArrowsClockwise } from "@phosphor-icons/react";
import { useRazao } from "@/hooks/useRazao";
import { Transaction, TransactionStatus, CategoryType, STATUS_META } from "@/lib/types";

interface Props {
  open: boolean;
  transaction: Transaction | null;
  defaultType?: CategoryType;
  onClose: () => void;
}

const STATUSES: TransactionStatus[] = ["pago", "pendente", "agendado"];
const RECURRENCES: { id: "none" | "monthly" | "yearly"; label: string }[] = [
  { id: "none", label: "Não recorrente" },
  { id: "monthly", label: "Mensal" },
  { id: "yearly", label: "Anual" },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TransactionModal({ open, transaction, defaultType, onClose }: Props) {
  const { categories, accounts, addTransaction, updateTransaction, deleteTransaction } = useRazao();
  const editing = !!transaction;

  const [type, setType] = useState<CategoryType>("receita");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState<TransactionStatus>("pago");
  const [recurring, setRecurring] = useState<"none" | "monthly" | "yearly">("none");
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setType(transaction.type);
      setDate(transaction.date);
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      setAccountId(transaction.accountId);
      setStatus(transaction.status);
      setRecurring(transaction.recurring);
      setNotes(transaction.notes);
    } else {
      setType(defaultType ?? "receita");
      setDate(todayISO());
      setDescription("");
      setAmount("");
      setCategoryId("");
      setAccountId(accounts[0]?.id ?? "");
      setStatus("pago");
      setRecurring("none");
      setNotes("");
    }
    setConfirmDelete(false);
  }, [open, transaction, defaultType, accounts]);

  const filteredCategories = categories.filter((c) => c.type === type);

  function handleSave() {
    const amt = parseFloat(amount.replace(",", "."));
    if (!description.trim() || !amt || amt <= 0 || !categoryId || !accountId) return;
    const data = { type, date, description: description.trim(), amount: amt, categoryId, accountId, status, recurring, notes };
    if (editing && transaction) updateTransaction(transaction.id, data);
    else addTransaction(data);
    onClose();
  }

  function handleDelete() {
    if (!transaction) return;
    deleteTransaction(transaction.id);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 18,
              width: "min(500px, calc(100vw - 24px))",
              maxHeight: "calc(100vh - 32px)", overflowY: "auto",
              boxShadow: "0 30px 70px rgba(15,23,42,0.18)",
            }}
          >
            <div style={{ padding: "18px 22px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                {editing ? "Editar lançamento" : "Novo lançamento"}
              </div>
              <button onClick={onClose} style={iconBtn}><X size={14} /></button>
            </div>

            <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Tipo toggle */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
                padding: 3, background: "#f8fafc",
                border: "1px solid #e2e8f0", borderRadius: 11,
              }}>
                <button onClick={() => setType("receita")} style={{
                  padding: "8px 12px", borderRadius: 8,
                  background: type === "receita" ? "#ecfdf5" : "transparent",
                  border: type === "receita" ? "1px solid #a7f3d0" : "1px solid transparent",
                  color: type === "receita" ? "#047857" : "#64748b",
                  fontSize: 12.5, fontWeight: type === "receita" ? 600 : 500,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  Receita
                </button>
                <button onClick={() => setType("despesa")} style={{
                  padding: "8px 12px", borderRadius: 8,
                  background: type === "despesa" ? "#fef2f2" : "transparent",
                  border: type === "despesa" ? "1px solid #fecaca" : "1px solid transparent",
                  color: type === "despesa" ? "#b91c1c" : "#64748b",
                  fontSize: 12.5, fontWeight: type === "despesa" ? 600 : 500,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  Despesa
                </button>
              </div>

              {/* Descrição */}
              <div>
                <label style={lbl}>Descrição</label>
                <input autoFocus value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Cliente Acme — projeto" style={inp} />
              </div>

              {/* Valor + data */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>Valor</label>
                  <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00" inputMode="decimal" style={inp} />
                </div>
                <div>
                  <label style={lbl}><Calendar size={11} /> Data</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} />
                </div>
              </div>

              {/* Categoria + conta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}><Folder size={11} /> Categoria</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inp}>
                    <option value="">Selecione</option>
                    {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}><Wallet size={11} /> Conta</label>
                  <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={inp}>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>)}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={lbl}>Status</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {STATUSES.map((st) => {
                    const meta = STATUS_META[st];
                    const active = status === st;
                    return (
                      <button key={st} onClick={() => setStatus(st)} style={{
                        padding: "6px 12px", borderRadius: 20,
                        background: active ? meta.bg : "#ffffff",
                        border: `1px solid ${active ? meta.color : "#e2e8f0"}`,
                        color: active ? meta.text : "#64748b",
                        fontSize: 11.5, fontWeight: active ? 600 : 500, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color }} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recurring */}
              <div>
                <label style={lbl}><ArrowsClockwise size={11} /> Recorrência</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {RECURRENCES.map((r) => {
                    const active = recurring === r.id;
                    return (
                      <button key={r.id} onClick={() => setRecurring(r.id)} style={{
                        padding: "6px 12px", borderRadius: 20,
                        background: active ? "#eef2ff" : "#ffffff",
                        border: `1px solid ${active ? "#6366f1" : "#e2e8f0"}`,
                        color: active ? "#4338ca" : "#64748b",
                        fontSize: 11.5, fontWeight: active ? 600 : 500, cursor: "pointer",
                      }}>
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={lbl}><ChatText size={11} /> Observações</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Opcional" style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
              </div>
            </div>

            <div style={{
              padding: "12px 22px 18px", borderTop: "1px solid #f1f5f9",
              display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center",
            }}>
              {editing ? (
                confirmDelete ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: "#b91c1c" }}>
                    Confirma?
                    <button onClick={handleDelete} style={btnDangerSmall}><Check size={12} weight="bold" /></button>
                    <button onClick={() => setConfirmDelete(false)} style={iconBtnSmall}><X size={12} /></button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} style={btnDanger}>
                    <Trash size={12} /> Excluir
                  </button>
                )
              ) : <div />}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={onClose} style={btnSecondary}>Cancelar</button>
                <button onClick={handleSave} style={btnPrimary}>
                  <Check size={13} weight="bold" /> {editing ? "Salvar" : "Lançar"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const lbl: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  fontSize: 10, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6,
};

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  background: "#f8fafc", border: "1px solid #e2e8f0",
  borderRadius: 9, color: "#0f172a", fontSize: 13,
};

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "9px 18px", borderRadius: 10,
  background: "linear-gradient(135deg, #6366f1, #4338ca)",
  color: "#ffffff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  border: "1px solid #4338ca",
  boxShadow: "0 6px 16px rgba(67,56,202,0.22)",
};

const btnSecondary: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "9px 14px", borderRadius: 10,
  background: "#ffffff", color: "#64748b",
  fontSize: 12.5, fontWeight: 500, cursor: "pointer",
  border: "1px solid #e2e8f0",
};

const btnDanger: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "8px 12px", borderRadius: 9,
  background: "#fef2f2", color: "#b91c1c",
  fontSize: 11.5, fontWeight: 500, cursor: "pointer",
  border: "1px solid #fecaca",
};

const btnDangerSmall: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 7,
  background: "#dc2626", color: "#ffffff", cursor: "pointer",
  border: "none", display: "flex", alignItems: "center", justifyContent: "center",
};

const iconBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 9,
  background: "#f8fafc", border: "1px solid #e2e8f0",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#64748b", cursor: "pointer",
};

const iconBtnSmall: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 7,
  background: "#ffffff", border: "1px solid #e2e8f0",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#64748b", cursor: "pointer",
};
