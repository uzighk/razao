"use client";

import { useState, useEffect, useCallback } from "react";
import { Account, Category, Transaction } from "@/lib/types";
import { SEED_ACCOUNTS, SEED_CATEGORIES, SEED_TRANSACTIONS } from "@/lib/seed";

const K_ACCOUNTS = "razao_accounts";
const K_CATEGORIES = "razao_categories";
const K_TRANSACTIONS = "razao_transactions";

function load<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; }
}

function save(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("razao:change", { detail: k }));
}

function uid() { return Math.random().toString(36).slice(2, 10); }

export function useRazao() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    setAccounts(load(K_ACCOUNTS, []));
    setCategories(load(K_CATEGORIES, []));
    setTransactions(load(K_TRANSACTIONS, []));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(K_ACCOUNTS)) save(K_ACCOUNTS, SEED_ACCOUNTS);
    if (!localStorage.getItem(K_CATEGORIES)) save(K_CATEGORIES, SEED_CATEGORIES);
    if (!localStorage.getItem(K_TRANSACTIONS)) save(K_TRANSACTIONS, SEED_TRANSACTIONS);
    refresh();
    setLoaded(true);

    const onChange = () => refresh();
    window.addEventListener("razao:change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("razao:change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  function commitAccounts(next: Account[]) { save(K_ACCOUNTS, next); setAccounts(next); }
  function commitCategories(next: Category[]) { save(K_CATEGORIES, next); setCategories(next); }
  function commitTransactions(next: Transaction[]) { save(K_TRANSACTIONS, next); setTransactions(next); }

  function addAccount(data: Omit<Account, "id">) {
    const a: Account = { ...data, id: uid() };
    commitAccounts([...accounts, a]);
    return a;
  }
  function updateAccount(id: string, data: Partial<Account>) {
    commitAccounts(accounts.map((a) => a.id === id ? { ...a, ...data } : a));
  }
  function deleteAccount(id: string) {
    commitAccounts(accounts.filter((a) => a.id !== id));
  }

  function addCategory(data: Omit<Category, "id">) {
    const c: Category = { ...data, id: uid() };
    commitCategories([...categories, c]);
    return c;
  }
  function updateCategory(id: string, data: Partial<Category>) {
    commitCategories(categories.map((c) => c.id === id ? { ...c, ...data } : c));
  }
  function deleteCategory(id: string) {
    commitCategories(categories.filter((c) => c.id !== id));
  }

  function addTransaction(data: Omit<Transaction, "id" | "createdAt">) {
    const t: Transaction = { ...data, id: uid(), createdAt: Date.now() };
    commitTransactions([t, ...transactions]);
    return t;
  }
  function updateTransaction(id: string, data: Partial<Transaction>) {
    commitTransactions(transactions.map((t) => t.id === id ? { ...t, ...data } : t));
  }
  function deleteTransaction(id: string) {
    commitTransactions(transactions.filter((t) => t.id !== id));
  }

  function accountBalance(id: string) {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return 0;
    const delta = transactions
      .filter((t) => t.accountId === id && t.status === "pago")
      .reduce((s, t) => s + (t.type === "receita" ? t.amount : -t.amount), 0);
    return acc.initialBalance + delta;
  }

  function resetData() {
    commitAccounts(SEED_ACCOUNTS);
    commitCategories(SEED_CATEGORIES);
    commitTransactions(SEED_TRANSACTIONS);
  }

  return {
    accounts, categories, transactions, loaded,
    addAccount, updateAccount, deleteAccount,
    addCategory, updateCategory, deleteCategory,
    addTransaction, updateTransaction, deleteTransaction,
    accountBalance,
    resetData,
  };
}
