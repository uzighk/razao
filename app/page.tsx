"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendUp, TrendDown, Wallet, Scales, ArrowRight, Clock, Receipt, ArrowUpRight, ArrowDownRight, CheckCircle, Warning } from "@phosphor-icons/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Nav } from "@/components/Nav";
import { useRazao } from "@/hooks/useRazao";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Transaction, STATUS_META } from "@/lib/types";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtBRLShort(v: number) {
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v}`;
}
function isoToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthStart(daysBack = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}
function inCurrentMonth(iso: string) {
  const t = isoToday();
  return iso.slice(0, 7) === t.slice(0, 7);
}
function inLastMonth(iso: string) {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0");
  return iso.slice(0, 7) === `${y}-${m}`;
}

export default function DashboardPage() {
  const { accounts, categories, transactions, accountBalance, loaded } = useRazao();
  const isMobile = useIsMobile();

  const today = isoToday();
  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + accountBalance(a.id), 0), [accounts, transactions]);

  const monthData = useMemo(() => {
    const monthTx = transactions.filter((t) => inCurrentMonth(t.date));
    const lastTx = transactions.filter((t) => inLastMonth(t.date));
    const receita = monthTx.filter((t) => t.type === "receita" && t.status === "pago").reduce((s, t) => s + t.amount, 0);
    const despesa = monthTx.filter((t) => t.type === "despesa" && t.status === "pago").reduce((s, t) => s + t.amount, 0);
    const lastReceita = lastTx.filter((t) => t.type === "receita" && t.status === "pago").reduce((s, t) => s + t.amount, 0);
    const lastDespesa = lastTx.filter((t) => t.type === "despesa" && t.status === "pago").reduce((s, t) => s + t.amount, 0);
    const resultado = receita - despesa;
    const lastResultado = lastReceita - lastDespesa;
    const pendenteReceber = monthTx.filter((t) => t.type === "receita" && t.status !== "pago").reduce((s, t) => s + t.amount, 0);
    const pendentePagar = monthTx.filter((t) => t.type === "despesa" && t.status !== "pago").reduce((s, t) => s + t.amount, 0);
    return { receita, despesa, resultado, lastReceita, lastDespesa, lastResultado, pendenteReceber, pendentePagar };
  }, [transactions]);

  // Chart data — last 30 days
  const chartData = useMemo(() => {
    const days: { date: string; label: string; receitas: number; despesas: number; saldo: number }[] = [];
    const map = new Map<string, { r: number; d: number }>();
    transactions.forEach((t) => {
      if (t.status !== "pago") return;
      const cur = map.get(t.date) ?? { r: 0, d: 0 };
      if (t.type === "receita") cur.r += t.amount;
      else cur.d += t.amount;
      map.set(t.date, cur);
    });

    const cumStart = accounts.reduce((s, a) => s + a.initialBalance, 0);
    let running = cumStart;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const v = map.get(iso) ?? { r: 0, d: 0 };
      running += v.r - v.d;
      days.push({ date: iso, label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, receitas: v.r, despesas: v.d, saldo: running });
    }
    return days;
  }, [transactions, accounts]);

  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t) => t.type === "despesa" && t.status === "pago" && inCurrentMonth(t.date)).forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });
    const arr = Array.from(map.entries())
      .map(([id, amount]) => ({ id, amount, category: categories.find((c) => c.id === id) }))
      .filter((x) => x.category)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    return arr;
  }, [transactions, categories]);

  const upcoming = useMemo(() => {
    return transactions
      .filter((t) => t.status !== "pago" && t.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [transactions, today]);

  if (!loaded) {
    return (
      <div className="bg-finance" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 26, height: 26, border: "2px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const resPct = monthData.lastResultado !== 0 ? ((monthData.resultado - monthData.lastResultado) / Math.abs(monthData.lastResultado)) * 100 : 0;
  const recPct = monthData.lastReceita !== 0 ? ((monthData.receita - monthData.lastReceita) / Math.abs(monthData.lastReceita)) * 100 : 0;
  const desPct = monthData.lastDespesa !== 0 ? ((monthData.despesa - monthData.lastDespesa) / Math.abs(monthData.lastDespesa)) * 100 : 0;

  return (
    <div className="bg-finance" style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Nav />

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 14px 24px" : "22px 24px 28px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Header */}
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
              Visão geral do mês — receitas, despesas, fluxo de caixa
            </p>
          </div>

          {/* KPIs */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 12,
          }}>
            <KpiCard
              label="Saldo total"
              value={fmtBRL(totalBalance)}
              hint={`${accounts.length} conta${accounts.length !== 1 ? "s" : ""}`}
              icon={Wallet}
              color="#6366f1"
            />
            <KpiCard
              label="Receitas do mês"
              value={fmtBRL(monthData.receita)}
              hint={recPct !== 0 ? `${recPct > 0 ? "+" : ""}${recPct.toFixed(1)}% vs mês anterior` : undefined}
              hintColor={recPct >= 0 ? "#10b981" : "#e11d48"}
              icon={TrendUp}
              color="#10b981"
            />
            <KpiCard
              label="Despesas do mês"
              value={fmtBRL(monthData.despesa)}
              hint={desPct !== 0 ? `${desPct > 0 ? "+" : ""}${desPct.toFixed(1)}% vs mês anterior` : undefined}
              hintColor={desPct <= 0 ? "#10b981" : "#e11d48"}
              icon={TrendDown}
              color="#e11d48"
            />
            <KpiCard
              label="Resultado líquido"
              value={fmtBRL(monthData.resultado)}
              hint={resPct !== 0 ? `${resPct > 0 ? "+" : ""}${resPct.toFixed(1)}% vs mês anterior` : undefined}
              hintColor={resPct >= 0 ? "#10b981" : "#e11d48"}
              icon={Scales}
              color={monthData.resultado >= 0 ? "#10b981" : "#e11d48"}
              accent
            />
          </div>

          {/* Chart + side info */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 2fr) minmax(0, 1fr)",
            gap: 14,
          }}>
            {/* Chart */}
            <div style={{
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: 16, padding: isMobile ? 14 : 18,
              boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Fluxo de caixa</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Últimos 30 dias</div>
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "#10b981" }} /> Receitas
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "#e11d48" }} /> Despesas
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "#6366f1" }} /> Saldo
                  </span>
                </div>
              </div>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e11d48" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#e2e8f0" />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#e2e8f0" tickFormatter={fmtBRLShort} width={60} />
                    <Tooltip
                      contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, boxShadow: "0 8px 24px rgba(15,23,42,0.10)" }}
                      labelStyle={{ color: "#0f172a", fontWeight: 600, marginBottom: 4 }}
                      formatter={(value: number, name: string) => [fmtBRL(value), name]}
                    />
                    <Area type="monotone" dataKey="saldo"    stroke="#6366f1" strokeWidth={2} fill="url(#gradSaldo)"    name="Saldo acumulado" />
                    <Area type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={1.5} fill="url(#gradReceitas)" name="Receitas" />
                    <Area type="monotone" dataKey="despesas" stroke="#e11d48" strokeWidth={1.5} fill="url(#gradDespesas)" name="Despesas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* A receber / A pagar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <PendingCard
                title="A receber"
                value={monthData.pendenteReceber}
                color="#10b981"
                bg="#ecfdf5"
                border="#a7f3d0"
                icon={ArrowDownRight}
              />
              <PendingCard
                title="A pagar"
                value={monthData.pendentePagar}
                color="#e11d48"
                bg="#fef2f2"
                border="#fecaca"
                icon={ArrowUpRight}
              />
              <div style={{
                background: "#ffffff", border: "1px solid #e2e8f0",
                borderRadius: 14, padding: 14, flex: 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Próximos vencimentos</div>
                  <Link href="/lancamentos" style={{ fontSize: 10, color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
                    Ver todos →
                  </Link>
                </div>
                {upcoming.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 11 }}>
                    Nada pendente
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {upcoming.map((t) => (
                      <UpcomingRow key={t.id} t={t} categoryColor={categories.find((c) => c.id === t.categoryId)?.color ?? "#94a3b8"} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top categorias + Contas */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 14,
          }}>
            {/* Top despesas */}
            <div style={{
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: 16, padding: isMobile ? 14 : 18,
              boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Top 5 despesas do mês</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Categorias com maior gasto</div>
                </div>
              </div>
              {topCategories.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 12 }}>
                  Sem despesas no mês
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {topCategories.map(({ id, amount, category }) => {
                    const pct = monthData.despesa > 0 ? (amount / monthData.despesa) * 100 : 0;
                    return (
                      <div key={id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 3, background: category!.color }} />
                            <span style={{ color: "#0f172a", fontWeight: 500 }}>{category!.name}</span>
                          </span>
                          <span style={{ color: "#0f172a", fontWeight: 600 }}>
                            {fmtBRL(amount)} <span style={{ color: "#94a3b8", fontWeight: 500 }}>· {pct.toFixed(0)}%</span>
                          </span>
                        </div>
                        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{ height: "100%", background: `linear-gradient(90deg, ${category!.color}, ${category!.color}cc)`, borderRadius: 4 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contas */}
            <div style={{
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: 16, padding: isMobile ? 14 : 18,
              boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Contas</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Saldos atualizados</div>
                </div>
                <Link href="/contas" style={{ fontSize: 11, color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
                  Gerenciar →
                </Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {accounts.map((a) => {
                  const bal = accountBalance(a.id);
                  return (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: 11,
                      background: "#f8fafc", border: "1px solid #f1f5f9",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${a.color}15`, border: `1px solid ${a.color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Wallet size={14} weight="duotone" color={a.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{a.name}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{a.bank}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: bal >= 0 ? "#0f172a" : "#e11d48" }}>
                        {fmtBRL(bal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, hint, hintColor, icon: Icon, color, accent }: {
  label: string; value: string; hint?: string; hintColor?: string;
  icon: typeof TrendUp; color: string; accent?: boolean;
}) {
  return (
    <div style={{
      background: accent ? `linear-gradient(135deg, ${color}10, ${color}05)` : "#ffffff",
      border: `1px solid ${accent ? `${color}30` : "#e2e8f0"}`,
      borderRadius: 14, padding: 16,
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} weight="duotone" color={color} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 19, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{value}</div>
        {hint && (
          <div style={{ fontSize: 10.5, color: hintColor ?? "#94a3b8", marginTop: 4, fontWeight: 500 }}>
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingCard({ title, value, color, bg, border, icon: Icon }: {
  title: string; value: number; color: string; bg: string; border: string;
  icon: typeof ArrowUpRight;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 14, padding: 14,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
          {value > 0 ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
        </div>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} weight="duotone" color={color} />
      </div>
    </div>
  );
}

function UpcomingRow({ t, categoryColor }: { t: Transaction; categoryColor: string }) {
  const s = STATUS_META[t.status];
  const isReceita = t.type === "receita";
  const date = new Date(t.date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"][date.getMonth()];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px", borderRadius: 10,
      background: "#f8fafc",
      border: "1px solid #f1f5f9",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: "#ffffff", border: "1px solid #e2e8f0",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: 8, color: "#94a3b8", textTransform: "uppercase", marginTop: 1 }}>{month}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.description}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 6px", borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`, color: s.text, fontSize: 9, fontWeight: 600, marginTop: 3 }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: s.color }} /> {s.label}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: isReceita ? "#10b981" : "#e11d48", whiteSpace: "nowrap" }}>
        {isReceita ? "+" : "−"} {t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </div>
    </div>
  );
}
