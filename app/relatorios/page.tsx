"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CaretLeft, CaretRight, FileText, ArrowDownRight, ArrowUpRight, Scales, Printer } from "@phosphor-icons/react";
import { Nav } from "@/components/Nav";
import { useRazao } from "@/hooks/useRazao";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CategoryGroup, CATEGORY_GROUP_LABEL } from "@/lib/types";

const MONTHS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function fmtBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function ymKey(y: number, m: number) { return `${y}-${String(m + 1).padStart(2, "0")}`; }

const RECEITA_GROUPS: CategoryGroup[] = ["operacional_receita", "financeiro"];
const DESPESA_GROUPS: CategoryGroup[] = ["operacional_despesa", "pessoal", "tributos", "financeiro", "investimento"];

export default function RelatoriosPage() {
  const { categories, transactions, loaded } = useRazao();
  const isMobile = useIsMobile();
  const [ref, setRef] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  function prev() {
    setRef((r) => {
      const m = r.m - 1; if (m < 0) return { y: r.y - 1, m: 11 };
      return { y: r.y, m };
    });
  }
  function next() {
    setRef((r) => {
      const m = r.m + 1; if (m > 11) return { y: r.y + 1, m: 0 };
      return { y: r.y, m };
    });
  }

  const refKey = ymKey(ref.y, ref.m);

  const dre = useMemo(() => {
    const monthTx = transactions.filter((t) => t.date.slice(0, 7) === refKey);
    // For DRE we use 'pago' OR include 'pendente'/'agendado' too? Real DRE = competência. We'll use all (regime de competência).
    const byCategory = new Map<string, number>();
    monthTx.forEach((t) => {
      byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amount);
    });

    function totalForGroup(type: "receita" | "despesa", group: CategoryGroup) {
      return categories
        .filter((c) => c.type === type && c.group === group)
        .map((c) => ({ category: c, total: byCategory.get(c.id) ?? 0 }))
        .filter((x) => x.total > 0);
    }

    const receitaGroups = RECEITA_GROUPS.map((g) => {
      const items = totalForGroup("receita", g);
      const total = items.reduce((s, x) => s + x.total, 0);
      return { group: g, items, total };
    }).filter((g) => g.items.length > 0);

    const despesaGroups = DESPESA_GROUPS.map((g) => {
      const items = totalForGroup("despesa", g);
      const total = items.reduce((s, x) => s + x.total, 0);
      return { group: g, items, total };
    }).filter((g) => g.items.length > 0);

    const totalReceitas = receitaGroups.reduce((s, g) => s + g.total, 0);
    const totalDespesas = despesaGroups.reduce((s, g) => s + g.total, 0);
    const resultado = totalReceitas - totalDespesas;
    const margem = totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0;

    return { receitaGroups, despesaGroups, totalReceitas, totalDespesas, resultado, margem };
  }, [transactions, categories, refKey]);

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
            DRE — Demonstrativo de Resultado
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Regime de competência · Todos os lançamentos do período
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 11, padding: 3 }}>
            <button onClick={prev} style={periodBtn} title="Mês anterior"><CaretLeft size={12} weight="bold" /></button>
            <div style={{ padding: "5px 14px", fontSize: 12.5, fontWeight: 600, color: "#0f172a", minWidth: 130, textAlign: "center" }}>
              {MONTHS_FULL[ref.m]} {ref.y}
            </div>
            <button onClick={next} style={periodBtn} title="Próximo mês"><CaretRight size={12} weight="bold" /></button>
          </div>
          <button onClick={() => window.print()} title="Imprimir DRE" style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "9px 14px", borderRadius: 10,
            background: "#ffffff", color: "#475569",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            border: "1px solid #e2e8f0",
          }}>
            <Printer size={13} /> Imprimir
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "14px 14px 24px" : "20px 24px 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Summary cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 12, marginBottom: 18,
          }}>
            <SummaryCard label="Receita bruta"   value={dre.totalReceitas} icon={ArrowDownRight} color="#10b981" bg="#ecfdf5" border="#a7f3d0" />
            <SummaryCard label="Despesa total"   value={dre.totalDespesas} icon={ArrowUpRight}   color="#e11d48" bg="#fef2f2" border="#fecaca" />
            <SummaryCard label="Resultado líquido" value={dre.resultado} icon={Scales} color={dre.resultado >= 0 ? "#10b981" : "#e11d48"} bg={dre.resultado >= 0 ? "#ecfdf5" : "#fef2f2"} border={dre.resultado >= 0 ? "#a7f3d0" : "#fecaca"} sub={`Margem ${dre.margem.toFixed(1)}%`} />
          </div>

          {/* DRE table */}
          <div style={{
            background: "#ffffff", border: "1px solid #e2e8f0",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
          }}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #eef2ff, #ffffff)",
            }}>
              <FileText size={16} weight="duotone" color="#6366f1" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>DRE Detalhado</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{MONTHS_FULL[ref.m]} de {ref.y}</div>
              </div>
            </div>

            <div style={{ padding: "14px 0" }}>
              {/* Receitas section */}
              <SectionHeader label="(+) Receitas" color="#10b981" />
              {dre.receitaGroups.length === 0 ? (
                <EmptyRow label="Sem receitas no período" />
              ) : (
                <>
                  {dre.receitaGroups.map((g) => (
                    <GroupSection key={g.group} label={CATEGORY_GROUP_LABEL[g.group]} total={g.total}
                      totalColor="#047857" totalPct={dre.totalReceitas > 0 ? (g.total / dre.totalReceitas) * 100 : 0}>
                      {g.items.map((x) => (
                        <DreRow key={x.category.id} label={x.category.name} color={x.category.color}
                          value={x.total} pct={dre.totalReceitas > 0 ? (x.total / dre.totalReceitas) * 100 : 0} valueColor="#047857" />
                      ))}
                    </GroupSection>
                  ))}
                  <TotalRow label="Total de receitas" value={dre.totalReceitas} color="#047857" bg="#ecfdf5" />
                </>
              )}

              <div style={{ height: 14 }} />

              {/* Despesas section */}
              <SectionHeader label="(−) Despesas" color="#e11d48" />
              {dre.despesaGroups.length === 0 ? (
                <EmptyRow label="Sem despesas no período" />
              ) : (
                <>
                  {dre.despesaGroups.map((g) => (
                    <GroupSection key={g.group} label={CATEGORY_GROUP_LABEL[g.group]} total={g.total}
                      totalColor="#b91c1c" totalPct={dre.totalReceitas > 0 ? (g.total / dre.totalReceitas) * 100 : 0}>
                      {g.items.map((x) => (
                        <DreRow key={x.category.id} label={x.category.name} color={x.category.color}
                          value={x.total} pct={dre.totalReceitas > 0 ? (x.total / dre.totalReceitas) * 100 : 0} valueColor="#b91c1c" />
                      ))}
                    </GroupSection>
                  ))}
                  <TotalRow label="Total de despesas" value={dre.totalDespesas} color="#b91c1c" bg="#fef2f2" />
                </>
              )}

              <div style={{ height: 18 }} />

              {/* Resultado final */}
              <div style={{
                margin: "0 14px 14px",
                padding: "16px 20px", borderRadius: 12,
                background: dre.resultado >= 0
                  ? "linear-gradient(135deg, #ecfdf5, #d1fae5)"
                  : "linear-gradient(135deg, #fef2f2, #fee2e2)",
                border: `1px solid ${dre.resultado >= 0 ? "#86efac" : "#fca5a5"}`,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: dre.resultado >= 0 ? "#047857" : "#b91c1c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Resultado do exercício
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    Margem líquida {dre.margem.toFixed(2)}%
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: dre.resultado >= 0 ? "#047857" : "#b91c1c", letterSpacing: "-0.01em" }}>
                  {dre.resultado >= 0 ? "+" : ""}{fmtBRL(dre.resultado)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{
      padding: "8px 20px", display: "flex", alignItems: "center", gap: 8,
      background: "#fafbfc", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9",
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
    </div>
  );
}

function GroupSection({ label, total, totalColor, totalPct, children }: { label: string; total: number; totalColor: string; totalPct: number; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: "10px 20px 4px", fontSize: 10.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <span style={{ color: totalColor, fontWeight: 700 }}>{fmtBRL(total)} <span style={{ color: "#94a3b8", fontWeight: 500 }}>({totalPct.toFixed(1)}%)</span></span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function DreRow({ label, color, value, pct, valueColor }: { label: string; color: string; value: number; pct: number; valueColor: string }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto",
      gap: 12, alignItems: "center",
      padding: "7px 20px 7px 32px",
      fontSize: 12.5,
      borderBottom: "1px dashed #f1f5f9",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#475569" }}>
        <span style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0 }} />
        {label}
      </div>
      <div style={{ textAlign: "right", color: valueColor, fontWeight: 600 }}>
        {fmtBRL(value)} <span style={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 500 }}>{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function TotalRow({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{
      margin: "8px 14px 0",
      padding: "10px 16px", borderRadius: 9,
      background: bg, border: `1px solid ${color}44`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{fmtBRL(value)}</span>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <div style={{ padding: "16px 20px", fontSize: 11.5, color: "#94a3b8", textAlign: "center", fontStyle: "italic" }}>{label}</div>;
}

function SummaryCard({ label, value, sub, icon: Icon, color, bg, border }: {
  label: string; value: number; sub?: string;
  icon: typeof Scales; color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 14, padding: 16,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
    }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 4, letterSpacing: "-0.01em" }}>{fmtBRL(value)}</div>
        {sub && <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} weight="duotone" color={color} />
      </div>
    </div>
  );
}

const periodBtn: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 7,
  background: "transparent", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#64748b", cursor: "pointer",
};
