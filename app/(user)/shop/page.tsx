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
      setProducts(result.data.items ?? []);
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
          x.productId === product.id ? { ...x, quantity: x.quantity + 1 } : x
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
    toast.success("Producto agregado", { description: product.name });
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
        description: `Se generó ${created.data.orderNumber}`,
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Catálogo</h1>
          <p className="text-sm text-gray-600">
            Busca productos y arma tu pedido al instante.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
          />
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 rounded-lg bg-gray-900 px-3 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Product Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
                  <div className="h-4 w-1/3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded mb-6"></div>
                  <div className="mt-auto h-10 w-full bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
              <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No se encontraron productos</h3>
              <p className="text-sm text-gray-600">Intenta con otro término de búsqueda.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const available = getAvailableStock(product);
                const isOutOfStock = available <= 0;

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-400 hover:shadow-lg hover:shadow-gray-200/50"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <span className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">
                        {product.name}
                      </span>

                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                        {product.category.name}
                      </span>
                    </div>

                    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center text-sm text-gray-400">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <div className="mb-2 flex-1">
                      {product.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      )}
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs text-gray-500">Precio Unitario</div>
                          <div className="text-lg font-bold text-gray-900">{formatMoney(product.retailPrice)}</div>
                        </div>
                        {product.wholesalePrice && (
                          <div className="text-right">
                            <div className="text-[10px] text-gray-500">Mayorista</div>
                            <div className="text-xs font-medium text-gray-600">{formatMoney(product.wholesalePrice)}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <span className="text-xs text-gray-600">Stock disponible</span>
                        <span className={`text-xs font-bold ${isOutOfStock ? "text-red-600" : "text-emerald-600"}`}>
                          {available} un.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all ${isOutOfStock
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]"
                          }`}
                      >
                        {isOutOfStock ? "Agotado" : "Agregar al carrito"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <aside className="relative">
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
            <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tu Pedido</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {cart.length} items
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                  <svg className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-sm">El carrito está vacío</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="group relative rounded-xl border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-gray-300">
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-600 hover:text-white"
                      title="Eliminar"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="mb-2 pr-6">
                      <div className="font-medium text-gray-900 line-clamp-1">{item.name}</div>

                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-medium text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.available}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Subtotal</div>
                        <div className="font-semibold text-gray-900">
                          {formatMoney(String(Number(item.price) * item.quantity))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 space-y-4 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Estimado</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatMoney(String(cartTotal))}
                </span>
              </div>

              <button
                type="button"
                onClick={submitOrder}
                disabled={submitting || cart.length === 0}
                className="group relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-gray-300/50 transition-all hover:scale-[1.02] hover:bg-gray-800 hover:shadow-gray-400/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      Confirmar Pedido
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}