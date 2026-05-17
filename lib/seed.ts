import { Account, Category, Transaction } from "./types";

export const SEED_ACCOUNTS: Account[] = [
  { id: "ac1", name: "Conta Corrente", bank: "Itaú",     type: "corrente",        initialBalance: 18420.50, color: "#f97316" },
  { id: "ac2", name: "Reserva",        bank: "Nubank",   type: "poupanca",        initialBalance: 35000.00, color: "#8b5cf6" },
  { id: "ac3", name: "Caixa",          bank: "Físico",   type: "caixa",           initialBalance: 850.00,   color: "#10b981" },
  { id: "ac4", name: "Cartão Nubank",  bank: "Nubank",   type: "cartao_credito",  initialBalance: 0,        color: "#a855f7" },
];

export const SEED_CATEGORIES: Category[] = [
  // Receita Operacional
  { id: "ca1",  name: "Vendas de Produtos",       type: "receita", group: "operacional_receita", color: "#10b981", icon: "ShoppingBag" },
  { id: "ca2",  name: "Prestação de Serviços",    type: "receita", group: "operacional_receita", color: "#14b8a6", icon: "Briefcase" },
  { id: "ca3",  name: "Assinaturas/Recorrência",  type: "receita", group: "operacional_receita", color: "#22c55e", icon: "ArrowsClockwise" },
  // Financeiro receita
  { id: "ca4",  name: "Rendimentos",              type: "receita", group: "financeiro",          color: "#0d9488", icon: "TrendUp" },
  // Despesa Operacional
  { id: "ca5",  name: "Marketing e Publicidade",  type: "despesa", group: "operacional_despesa", color: "#f97316", icon: "Megaphone" },
  { id: "ca6",  name: "Software e Ferramentas",   type: "despesa", group: "operacional_despesa", color: "#8b5cf6", icon: "Code" },
  { id: "ca7",  name: "Aluguel",                  type: "despesa", group: "operacional_despesa", color: "#dc2626", icon: "House" },
  { id: "ca8",  name: "Energia e Internet",       type: "despesa", group: "operacional_despesa", color: "#ea580c", icon: "Lightning" },
  { id: "ca9",  name: "Material de Escritório",   type: "despesa", group: "operacional_despesa", color: "#d97706", icon: "PencilSimple" },
  // Pessoal
  { id: "ca10", name: "Salários",                 type: "despesa", group: "pessoal",             color: "#0ea5e9", icon: "Users" },
  { id: "ca11", name: "Pró-labore",               type: "despesa", group: "pessoal",             color: "#3b82f6", icon: "UserCircle" },
  { id: "ca12", name: "Benefícios",               type: "despesa", group: "pessoal",             color: "#6366f1", icon: "Heart" },
  // Tributos
  { id: "ca13", name: "DAS Simples Nacional",     type: "despesa", group: "tributos",            color: "#7c3aed", icon: "Receipt" },
  { id: "ca14", name: "INSS",                     type: "despesa", group: "tributos",            color: "#9333ea", icon: "ShieldCheck" },
  // Financeiro
  { id: "ca15", name: "Tarifas Bancárias",        type: "despesa", group: "financeiro",          color: "#db2777", icon: "Bank" },
  { id: "ca16", name: "Juros e Multas",           type: "despesa", group: "financeiro",          color: "#e11d48", icon: "WarningCircle" },
  // Investimento
  { id: "ca17", name: "Equipamentos",             type: "despesa", group: "investimento",        color: "#475569", icon: "Desktop" },
];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateBack(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return isoDate(d);
}

function dateForward(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return isoDate(d);
}

function uid() { return Math.random().toString(36).slice(2, 9); }

export const SEED_TRANSACTIONS: Transaction[] = [
  // ===== Mês atual =====
  // Receitas pagas
  { id: uid(), date: dateBack(2),  description: "Cliente Acme — projeto landing page",      amount: 12500, type: "receita", categoryId: "ca2",  accountId: "ac1", status: "pago",      recurring: "none",    notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(5),  description: "Assinaturas SaaS — fevereiro",             amount: 4280,  type: "receita", categoryId: "ca3",  accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(8),  description: "Cliente Beta — desenvolvimento",           amount: 8400,  type: "receita", categoryId: "ca2",  accountId: "ac1", status: "pago",      recurring: "none",    notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(11), description: "Venda de templates",                       amount: 1820,  type: "receita", categoryId: "ca1",  accountId: "ac1", status: "pago",      recurring: "none",    notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(15), description: "Rendimento CDB",                           amount: 312,   type: "receita", categoryId: "ca4",  accountId: "ac2", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  // Receitas a receber
  { id: uid(), date: dateForward(3),  description: "Cliente Gamma — segunda parcela",       amount: 7500,  type: "receita", categoryId: "ca2",  accountId: "ac1", status: "pendente",  recurring: "none",    notes: "Aguardando aprovação", createdAt: Date.now() },
  { id: uid(), date: dateForward(7),  description: "Mensalidade plano premium",             amount: 2400,  type: "receita", categoryId: "ca3",  accountId: "ac1", status: "agendado",  recurring: "monthly", notes: "", createdAt: Date.now() },
  // Despesas pagas
  { id: uid(), date: dateBack(1),  description: "Aluguel do escritório",                    amount: 3200,  type: "despesa", categoryId: "ca7",  accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(3),  description: "Anúncios Meta Ads",                        amount: 1450,  type: "despesa", categoryId: "ca5",  accountId: "ac4", status: "pago",      recurring: "monthly", notes: "Campanha lead-gen", createdAt: Date.now() },
  { id: uid(), date: dateBack(4),  description: "GitHub + Vercel + Figma",                  amount: 380,   type: "despesa", categoryId: "ca6",  accountId: "ac4", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(6),  description: "Energia elétrica + Internet",              amount: 540,   type: "despesa", categoryId: "ca8",  accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(7),  description: "Salário equipe (fev)",                     amount: 14200, type: "despesa", categoryId: "ca10", accountId: "ac1", status: "pago",      recurring: "monthly", notes: "3 colaboradores", createdAt: Date.now() },
  { id: uid(), date: dateBack(7),  description: "Pró-labore sócios",                        amount: 8000,  type: "despesa", categoryId: "ca11", accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(10), description: "Vale-refeição equipe",                     amount: 1820,  type: "despesa", categoryId: "ca12", accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(12), description: "Material gráfico — papelaria",             amount: 290,   type: "despesa", categoryId: "ca9",  accountId: "ac4", status: "pago",      recurring: "none",    notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(14), description: "Tarifa de manutenção bancária",            amount: 32,    type: "despesa", categoryId: "ca15", accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  // Despesas pendentes/agendadas
  { id: uid(), date: dateForward(2),  description: "DAS Simples Nacional",                  amount: 1240,  type: "despesa", categoryId: "ca13", accountId: "ac1", status: "agendado",  recurring: "monthly", notes: "Vencimento dia 20", createdAt: Date.now() },
  { id: uid(), date: dateForward(5),  description: "INSS pró-labore",                       amount: 660,   type: "despesa", categoryId: "ca14", accountId: "ac1", status: "agendado",  recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateForward(8),  description: "Fatura cartão Nubank",                  amount: 2120,  type: "despesa", categoryId: "ca15", accountId: "ac1", status: "agendado",  recurring: "monthly", notes: "Fechamento dia 20", createdAt: Date.now() },
  { id: uid(), date: dateForward(10), description: "Curso de gestão financeira",            amount: 890,   type: "despesa", categoryId: "ca17", accountId: "ac4", status: "pendente",  recurring: "none",    notes: "", createdAt: Date.now() },

  // ===== Mês passado (~30 dias atrás) =====
  { id: uid(), date: dateBack(28), description: "Cliente Delta — sprint mensal",            amount: 9800,  type: "receita", categoryId: "ca2",  accountId: "ac1", status: "pago",      recurring: "none",    notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(30), description: "Vendas templates janeiro",                 amount: 2640,  type: "receita", categoryId: "ca1",  accountId: "ac1", status: "pago",      recurring: "none",    notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(35), description: "Assinaturas SaaS — janeiro",               amount: 4180,  type: "receita", categoryId: "ca3",  accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(45), description: "Rendimento CDB",                           amount: 298,   type: "receita", categoryId: "ca4",  accountId: "ac2", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(31), description: "Aluguel do escritório",                    amount: 3200,  type: "despesa", categoryId: "ca7",  accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(33), description: "Google Ads",                               amount: 1080,  type: "despesa", categoryId: "ca5",  accountId: "ac4", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(37), description: "Salário equipe (jan)",                     amount: 14200, type: "despesa", categoryId: "ca10", accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(37), description: "Pró-labore sócios",                        amount: 8000,  type: "despesa", categoryId: "ca11", accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(40), description: "Energia + Internet",                       amount: 510,   type: "despesa", categoryId: "ca8",  accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(42), description: "DAS Simples Nacional",                     amount: 1180,  type: "despesa", categoryId: "ca13", accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },

  // ===== Dois meses atrás (~60 dias) =====
  { id: uid(), date: dateBack(58), description: "Cliente Epsilon — site institucional",     amount: 14600, type: "receita", categoryId: "ca2",  accountId: "ac1", status: "pago",      recurring: "none",    notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(63), description: "Assinaturas SaaS — dezembro",              amount: 3950,  type: "receita", categoryId: "ca3",  accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(60), description: "Aluguel do escritório",                    amount: 3200,  type: "despesa", categoryId: "ca7",  accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(65), description: "Equipamento — monitor 27\"",               amount: 2800,  type: "despesa", categoryId: "ca17", accountId: "ac4", status: "pago",      recurring: "none",    notes: "", createdAt: Date.now() },
  { id: uid(), date: dateBack(68), description: "Salário equipe (dez)",                     amount: 13800, type: "despesa", categoryId: "ca10", accountId: "ac1", status: "pago",      recurring: "monthly", notes: "", createdAt: Date.now() },
];
