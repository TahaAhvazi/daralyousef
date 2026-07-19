import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { catalogApi, customersApi, salesApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney } from "@/lib/format";
import { useT } from "@/i18n/useT";

type CartLine = { key: string; name: string; quantity: number; unit_price: number; product_id?: number };

export default function PosPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [method, setMethod] = useState("cash");
  const [cart, setCart] = useState<CartLine[]>([]);

  const { data: sessions } = useQuery({
    queryKey: ["pos-sessions"],
    queryFn: () => salesApi.posSessions({ page: 1, page_size: 10 }),
  });
  const openSession = (sessions?.items ?? []).find((s: any) => s.status === "open");

  const { data: products } = useQuery({
    queryKey: ["products", "pos", q],
    queryFn: () => catalogApi.products({ page: 1, page_size: 40, q: q || undefined, active_only: true }),
  });
  const { data: customers } = useQuery({
    queryKey: ["customers", "pick"],
    queryFn: () => customersApi.list({ page: 1, page_size: 100 }),
  });

  const total = useMemo(
    () => cart.reduce((s, l) => s + l.quantity * l.unit_price, 0),
    [cart],
  );

  const open = useMutation({
    mutationFn: () => salesApi.openPosSession({ opening_float: 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-sessions"] });
      toast.success("Session opened");
    },
  });

  const checkout = useMutation({
    mutationFn: () =>
      salesApi.posCheckout({
        session_id: openSession.id,
        customer_id: customerId ? Number(customerId) : null,
        method,
        currency: "IQD",
        items: cart.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          unit_price: l.unit_price,
          product_id: l.product_id,
        })),
      }),
    onSuccess: () => {
      setCart([]);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Sale completed");
    },
  });

  const addProduct = (p: any) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === p.id);
      if (existing) {
        return prev.map((l) =>
          l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, {
        key: `p-${p.id}`,
        name: p.name,
        quantity: 1,
        unit_price: p.base_price ?? p.price ?? 0,
        product_id: p.id,
      }];
    });
  };

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        title={t.staffUi.nav.posTerminal}
        description={t.staffUi.nav.modPos}
        actions={
          <Link to="/app/pos/sessions" className="btn btn-secondary min-h-10">
            {t.staffUi.nav.posSessions}
          </Link>
        }
      />

      {!openSession ? (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3 py-8">
            <p className="text-sm text-text-2">Open a cash session to start selling.</p>
            <Button loading={open.isPending} onClick={() => open.mutate()}>Open session</Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader title="Products" />
            <CardBody className="space-y-3">
              <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="grid gap-2 sm:grid-cols-2">
                {(products?.items ?? []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="rounded-xl border border-border/70 bg-surface-2/20 px-3 py-3 text-start hover:border-brand/40"
                  >
                    <div className="text-[13px] font-medium">{p.name}</div>
                    <div className="text-[12px] text-text-3">{formatMoney(p.base_price ?? 0, "IQD")}</div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Cart" subtitle={openSession.code} />
            <CardBody className="space-y-3">
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-3">
                  <ShoppingCart className="mx-auto mb-2 size-6 opacity-50" />
                  Empty cart
                </p>
              ) : (
                cart.map((l) => (
                  <div key={l.key} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{l.name}</div>
                      <div className="text-[12px] text-text-3">{formatMoney(l.unit_price, "IQD")}</div>
                    </div>
                    <Button size="sm" variant="ghost" icon={<Minus className="size-3.5" />} onClick={() =>
                      setCart((prev) => prev.map((x) => x.key === l.key ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))
                    } />
                    <span className="w-6 text-center text-[13px]">{l.quantity}</span>
                    <Button size="sm" variant="ghost" icon={<Plus className="size-3.5" />} onClick={() =>
                      setCart((prev) => prev.map((x) => x.key === l.key ? { ...x, quantity: x.quantity + 1 } : x))
                    } />
                    <Button size="sm" variant="ghost" icon={<Trash2 className="size-3.5" />} onClick={() =>
                      setCart((prev) => prev.filter((x) => x.key !== l.key))
                    } />
                  </div>
                ))
              )}
              <select className="input w-full" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in customer</option>
                {(customers?.items ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
              <select className="input w-full" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
              </select>
              <div className="flex items-center justify-between text-[15px] font-semibold">
                <span>Total</span>
                <span>{formatMoney(total, "IQD")}</span>
              </div>
              <Button
                className="w-full"
                loading={checkout.isPending}
                disabled={!cart.length}
                onClick={() => checkout.mutate()}
              >
                Checkout
              </Button>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
