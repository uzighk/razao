export type AccountType = "corrente" | "poupanca" | "caixa" | "cartao_credito";

export interface Account {
  id: string;
  name: string;
  bank: string;
  type: AccountType;
  initialBalance: number;
  color: string;
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  caixa: "Caixa",
  cartao_credito: "Cartão de crédito",
};

export type CategoryType = "receita" | "despesa";

export type CategoryGroup =
  | "operacional_receita"
  | "operacional_despesa"
  | "pessoal"
  | "tributos"
  | "financeiro"
  | "investimento";

export const CATEGORY_GROUP_LABEL: Record<CategoryGroup, string> = {
  operacional_receita: "Receita Operacional",
  operacional_despesa: "Despesa Operacional",
  pessoal: "Pessoal",
  tributos: "Tributos e Taxas",
  financeiro: "Financeiro",
  investimento: "Investimento",
};

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  group: CategoryGroup;
  color: string;
  icon: string;
}

export type TransactionStatus = "pago" | "pendente" | "agendado";

export const STATUS_META: Record<TransactionStatus, { label: string; color: string; bg: string; border: string; text: string }> = {
  pago:      { label: "Pago",      color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" },
  pendente:  { label: "Pendente",  color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  agendado:  { label: "Agendado",  color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" },
};

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positivo sempre
  type: CategoryType;
  categoryId: string;
  accountId: string;
  status: TransactionStatus;
  recurring: "none" | "monthly" | "yearly";
  notes: string;
  createdAt: number;
}
