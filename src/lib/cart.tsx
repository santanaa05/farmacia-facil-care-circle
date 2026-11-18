import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { product_id: string; name: string; price: number; quantity: number };
type Ctx = {
  items: CartItem[];
  add: (i: Omit<CartItem, "quantity">) => void;
  setQty: (id: string, q: number) => void;
  clear: () => void;
  total: number;
  count: number;
};
const CartCtx = createContext<Ctx>(null as unknown as Ctx);
const KEY = "farmaquarema-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
  }, []);
  const save = (next: CartItem[]) => { setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const add: Ctx["add"] = (i) => {
    const ex = items.find((x) => x.product_id === i.product_id);
    save(ex ? items.map((x) => x.product_id === i.product_id ? { ...x, quantity: x.quantity + 1 } : x) : [...items, { ...i, quantity: 1 }]);
  };
  const setQty = (id: string, q: number) => save(q <= 0 ? items.filter((x) => x.product_id !== id) : items.map((x) => x.product_id === id ? { ...x, quantity: q } : x));
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return <CartCtx.Provider value={{ items, add, setQty, clear: () => save([]), total, count }}>{children}</CartCtx.Provider>;
}
export const useCart = () => useContext(CartCtx);
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
