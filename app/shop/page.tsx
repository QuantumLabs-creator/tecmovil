"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createSaleOrderApi } from "@/src/lib/api/sale-orders";
import { getProductsApi, type Product } from "@/src/lib/api/products";

type CartItem = {
  productId: string;
  name: string;
  code: string;
  price: string;
  quantity: number;
  available: number;
};

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(n);
}

function getAvailableStock(product: Product) {
  return Math.max(0, product.currentStock - product.reservedStock);
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const result = await getProductsApi({
        active: true,
        q: q.trim() || undefined,
        page: 1,
        pageSize: 50,
      });

      setProducts(result.items ?? []);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudieron cargar los productos",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadProducts();
  }

  function addToCart(product: Product) {
    const available = getAvailableStock(product);
    if (available <= 0) {
      toast.error("Sin stock disponible");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((x) => x.productId === product.id);

      if (existing) {
        if (existing.quantity >= available) {
          toast.error("No puedes agregar más de lo disponible");
          return prev;
        }

        return prev.map((x) =>
          x.productId === product.id
            ? { ...x, quantity: x.quantity + 1 }
            : x
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          code: product.code,
          price: product.retailPrice,
          quantity: 1,
          available,
        },
      ];
    });
  }

  function updateCartQuantity(productId: string, nextQty: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;

          const safeQty = Math.max(1, Math.min(nextQty, item.available));
          return { ...item, quantity: safeQty };
        })
        .filter(Boolean)
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
  }

  async function submitOrder() {
    if (cart.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customerType: "RETAIL" as const,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const created = await createSaleOrderApi(payload);

      toast.success("Pedido creado", {
        description: `Se generó ${created.orderNumber}`,
      });

      setCart([]);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo crear el pedido",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  }, [cart]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Shop</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Explora productos disponibles y genera tu pedido.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full md:w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:opacity-90"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          {loading ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-zinc-300">
              Cargando productos...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-zinc-300">
              No se encontraron productos.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const available = getAvailableStock(product);

                return (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4"
                  >
                    <div className="space-y-2">
                      <div className="text-xs text-zinc-500">{product.code}</div>
                      <div className="font-medium">{product.name}</div>

                      {product.description ? (
                        <p className="text-sm text-zinc-400 line-clamp-2">
                          {product.description}
                        </p>
                      ) : null}

                      <div className="text-sm text-zinc-400">
                        Categoría: {product.category.name}
                      </div>

                      <div className="text-lg font-semibold">
                        {formatMoney(product.retailPrice)}
                      </div>

                      {product.wholesalePrice ? (
                        <div className="text-xs text-zinc-400">
                          Mayorista: {formatMoney(product.wholesalePrice)} desde{" "}
                          {product.wholesaleMinQuantity} unidades
                        </div>
                      ) : null}

                      <div className="text-sm">
                        Disponible:{" "}
                        <span className={available > 0 ? "text-emerald-400" : "text-red-400"}>
                          {available}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={available <= 0}
                        className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {available > 0 ? "Agregar" : "Sin stock"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm h-fit">
          <div className="text-base font-semibold">Carrito</div>

          <div className="mt-4 space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-zinc-400">
                Aún no agregaste productos.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-zinc-500">{item.code}</div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {formatMoney(item.price)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-sm"
                    >
                      -
                    </button>

                    <span className="min-w-8 text-center text-sm">{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-sm"
                    >
                      +
                    </button>

                    <span className="ml-auto text-sm text-zinc-400">
                      Máx: {item.available}
                    </span>
                  </div>

                  <div className="mt-3 text-right text-sm font-medium">
                    {formatMoney(String(Number(item.price) * item.quantity))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 border-t border-[var(--color-border)] pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Total estimado</span>
              <span className="text-base font-semibold">
                {new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: "PEN",
                }).format(cartTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting || cart.length === 0}
              className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creando pedido..." : "Crear pedido"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}