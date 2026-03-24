"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { createSaleOrderApi } from "@/src/lib/api/sale-orders";
import { getProductsApi, type Product } from "@/src/lib/api/products";
import {
  getProductRecommendationsApi,
  type ProductRecommendation,
} from "@/src/lib/api/recommendations";

// --- Tipos ---

type CartItem = {
  productId: string;
  name: string;
  code: string;
  price: string;
  quantity: number;
  available: number;
};

type RecommendationsMap = Record<string, ProductRecommendation[]>;

// --- Utilidades ---

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(n);
}

function getAvailableStock(product: {
  currentStock: number;
  reservedStock: number;
}) {
  return Math.max(0, Number(product.currentStock ?? 0) - Number(product.reservedStock ?? 0));
}

// --- Hooks Personalizados ---

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function useLazyRecommendations() {
  const [recommendationsMap, setRecommendationsMap] = useState<RecommendationsMap>({});
  const [loadingRecommendations, setLoadingRecommendations] = useState<Set<string>>(new Set());
  const loadedRef = useRef<Set<string>>(new Set());

  const loadRecommendation = useCallback(async (productId: string) => {
    if (loadedRef.current.has(productId) || loadingRecommendations.has(productId)) {
      return;
    }

    setLoadingRecommendations((prev) => new Set(prev).add(productId));

    try {
      const res = await getProductRecommendationsApi(productId);
      const recommendations = Array.isArray(res?.data) ? res.data : [];
      
      setRecommendationsMap((prev) => ({
        ...prev,
        [productId]: recommendations,
      }));
      
      loadedRef.current.add(productId);
    } catch {
      setRecommendationsMap((prev) => ({
        ...prev,
        [productId]: [],
      }));
      loadedRef.current.add(productId);
    } finally {
      setLoadingRecommendations((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }, [loadingRecommendations]);

  const getRecommendations = useCallback((productId: string) => {
    return recommendationsMap[productId] ?? [];
  }, [recommendationsMap]);

  const isLoading = useCallback((productId: string) => {
    return loadingRecommendations.has(productId);
  }, [loadingRecommendations]);

  return { loadRecommendation, getRecommendations, isLoading };
}

// --- Componentes UI Pequeños ---

// ✅ StockBadge ACTUALIZADO con 3 estados de color
const StockBadge = ({ available }: { available: number }) => {
  // Determinar el estado del stock
  const isOutOfStock = available <= 0;
  const isLowStock = available > 0 && available <= 6;
  const isAvailable = available > 6;

  // Clases según el estado
  const badgeClasses = isOutOfStock
    ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
    : isLowStock
    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";

  const dotClasses = isOutOfStock
    ? "bg-red-500"
    : isLowStock
    ? "bg-amber-500"
    : "bg-emerald-500";

  const pingClasses = isOutOfStock
    ? ""
    : isLowStock
    ? "bg-amber-400"
    : "bg-emerald-400";

  // Texto según el estado
  const stockText = isOutOfStock
    ? "Agotado"
    : isLowStock
    ? `${available} un. (casi agotado)`
    : `${available} disp.`;

  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badgeClasses}`}>
      <span className={`relative flex h-2 w-2`}>
        {!isOutOfStock && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingClasses} opacity-75`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClasses}`}></span>
      </span>
      {stockText}
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
    <div className="rounded-full bg-gray-50 p-4 mb-4">
      <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-gray-900">No encontramos productos</h3>
    <p className="text-sm text-gray-500 mt-1">Intenta ajustar tu búsqueda o limpia los filtros.</p>
  </div>
);

const ProductCard = ({ 
  product, 
  onAdd, 
  onLoadRecommendations,
  recommendations = [],
  isLoadingRecs = false,
}: { 
  product: Product; 
  onAdd: (p: any) => void; 
  onLoadRecommendations: (id: string) => void;
  recommendations: ProductRecommendation[];
  isLoadingRecs: boolean;
}) => {
  const available = getAvailableStock(product);
  const isOutOfStock = available <= 0;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecs, setShowRecs] = useState(false);
  const hasLoadedRecs = useRef(false);

  const validRecs = recommendations
    .filter((r) => !!r?.recommendedProduct)
    .sort((a, b) => Number(a.priority ?? 0) - Number(b.priority ?? 0))
    .slice(0, 2);

  const hasDescription = !!product.description;

  const handleMouseEnter = () => {
    if (!hasLoadedRecs.current && recommendations.length === 0 && !isLoadingRecs) {
      hasLoadedRecs.current = true;
      onLoadRecommendations(product.id);
    }
  };

  const toggleRecs = () => {
    if (!showRecs && recommendations.length === 0 && !isLoadingRecs) {
      onLoadRecommendations(product.id);
    }
    setShowRecs(!showRecs);
  };

  return (
    <div 
      className="group flex flex-col h-full rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1"
      onMouseEnter={handleMouseEnter}
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center rounded-md bg-white/90 backdrop-blur px-2 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-900/5">
            {product.category?.name ?? "General"}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex-1">
          <h3 className="text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem]">{product.name}</h3>
          <p className="mt-1 text-xs text-gray-500 font-mono">{product.code}</p>
          
          {hasDescription && (
            <div className="mt-2">
              <div 
                className={`text-sm text-gray-600 transition-all duration-300 overflow-hidden ${
                  isExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {product.description}
              </div>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    Ver menos
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                  </>
                ) : (
                  <>
                    Ver detalles
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Precios y Stock */}
        <div className="space-y-3 border-t border-gray-100 pt-4 mt-auto">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Precio Unitario</p>
              <p className="text-xl font-bold text-gray-900">{formatMoney(product.retailPrice)}</p>
            </div>
            {product.wholesalePrice && (
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Mayorista</p>
                <p className="text-sm font-semibold text-gray-600">{formatMoney(product.wholesalePrice)}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
             <StockBadge available={available} />
          </div>

          <button
            onClick={() => onAdd(product)}
            disabled={isOutOfStock}
            className={`mt-2 w-full rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isOutOfStock 
                ? "cursor-not-allowed bg-gray-100 text-gray-400" 
                : "bg-gray-900 text-white hover:bg-gray-800 shadow-md shadow-gray-200"
            }`}
          >
            {isOutOfStock ? "Sin Stock" : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Agregar
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Recomendaciones (Lazy Loading) */}
      {(showRecs || validRecs.length > 0) && (
        <div className="bg-gray-50 px-5 py-3 text-xs border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-500 uppercase tracking-wide text-[10px] flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Sugerido
                </p>
                <button
                    onClick={toggleRecs}
                    className="text-[10px] text-gray-400 hover:text-gray-600"
                >
                    {showRecs ? "Ocultar" : "Ver"}
                </button>
            </div>
            
            {isLoadingRecs ? (
                <div className="space-y-2 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                </div>
            ) : validRecs.length > 0 ? (
                <div className="space-y-2">
                    {validRecs.map(rec => {
                        const recProd = rec.recommendedProduct;
                        const recStock = getAvailableStock(recProd);
                        return (
                            <div key={rec.id} className="flex justify-between items-center group/rec">
                                <div className="truncate text-gray-600 max-w-[140px]">
                                    <span className="block truncate font-medium text-gray-800">{recProd.name}</span>
                                    <span className="text-[10px] text-gray-400">{formatMoney(recProd.retailPrice)}</span>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAdd(recProd); }}
                                    disabled={recStock <= 0}
                                    className={`text-xs font-bold px-2 py-1 rounded ${
                                        recStock <= 0 
                                        ? "text-gray-400 cursor-not-allowed" 
                                        : "text-gray-900 bg-white border border-gray-200 hover:border-gray-900 hover:text-gray-900"
                                    }`}
                                >
                                    {recStock <= 0 ? "-" : "+"}
                                </button>
                            </div>
                        )
                    })}
                </div>
            ) : showRecs ? (
                <p className="text-gray-400 text-center py-2">No hay sugerencias disponibles</p>
            ) : null}
        </div>
      )}
      
      {!showRecs && validRecs.length === 0 && !isLoadingRecs && (
        <button
            onClick={toggleRecs}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t border-gray-100 transition-colors"
        >
            Ver productos sugeridos
        </button>
      )}
    </div>
  );
};

// --- Componente Principal ---

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // ✅ NUEVOS ESTADOS PARA DATOS DEL CLIENTE
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  
  const { loadRecommendation, getRecommendations, isLoading } = useLazyRecommendations();
  const debouncedSearch = useDebounce(q, 300);

  async function loadProducts() {
    setLoading(true);
    try {
      const result = await getProductsApi({
        active: true,
        q: debouncedSearch.trim() || undefined,
        page: 1,
        pageSize: 50,
      });

      const items = result?.data?.items ?? [];
      setProducts(items);
    } catch (e: any) {
      toast.error("Error al cargar", {
        description: e?.error || e?.message || "No se pudieron cargar los productos",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadProducts();
  }

  function addToCart(product: {
    id: string;
    name: string;
    code: string;
    retailPrice: string;
    currentStock: number;
    reservedStock: number;
  }) {
    const available = getAvailableStock(product);

    if (available <= 0) {
      toast.error("Sin stock disponible");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((x) => x.productId === product.id);

      if (existing) {
        if (existing.quantity >= available) {
          toast.error("Stock máximo alcanzado");
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
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const safeQty = Math.max(1, Math.min(nextQty, item.available));
        return { ...item, quantity: safeQty };
      })
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
  }

  // ✅ FUNCIÓN submitOrder ACTUALIZADA
  async function submitOrder(customerData?: { phone: string; document: string }) {
    if (cart.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    try {
      setSubmitting(true);

      // ✅ Re-validar stock antes de crear la orden
      const validatedItems = cart.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const currentAvailable = getAvailableStock(product);
          if (currentAvailable < item.quantity) {
            throw new Error(`El producto "${item.name}" solo tiene ${currentAvailable} unidades disponibles`);
          }
        }
        return {
          productId: item.productId,
          quantity: item.quantity,
        };
      });

      const payload = {
        customerType: "RETAIL" as const,
        ...(customerData
          ? {
              customerData: {
                phone: customerData.phone.trim(),
                document: customerData.document.trim(),
              },
            }
          : {}),
        items: validatedItems,
      };

      const created = await createSaleOrderApi(payload);

      toast.success("Pedido creado", {
        description: `Se generó ${created.data.orderNumber}`,
      });

      setCart([]);
      setCustomerModalOpen(false);
      setCustomerPhone("");
      setCustomerDocument("");
    } catch (e: any) {
      const message =
        e?.error || e?.message || "No se pudo crear el pedido";

      // ✅ Si el backend pide datos del cliente, abrir modal
      if (message.includes("Completa tus datos de cliente antes de realizar el pedido")) {
        setCustomerModalOpen(true);
        return;
      }

      toast.error("Error", {
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ✅ FUNCIÓN PARA CONFIRMAR DATOS DESDE EL MODAL
  async function handleConfirmCustomerData() {
    const phone = customerPhone.trim();
    const document = customerDocument.trim();

    if (!phone) {
      toast.error("Ingresa tu teléfono");
      return;
    }

    if (!document) {
      toast.error("Ingresa tu documento");
      return;
    }

    await submitOrder({ phone, document });
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Catálogo</h1>
            <p className="mt-2 text-gray-600">Gestiona tu pedido en tiempo real.</p>
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6 shadow-sm transition-all"
            />
            <button
              type="submit"
              className="absolute inset-y-1.5 right-1.5 rounded-lg bg-gray-900 px-3 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Buscar
            </button>
          </form>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
          
          {/* Grid de Productos */}
          <main className="space-y-6">
            {loading ? (
               <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                 {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="h-96 rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
                      <div className="h-48 w-full bg-gray-200 rounded-xl mb-4"></div>
                      <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-1/2 bg-gray-200 rounded mb-6"></div>
                      <div className="mt-auto h-10 w-full bg-gray-200 rounded"></div>
                   </div>
                 ))}
               </div>
            ) : products.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAdd={addToCart}
                    onLoadRecommendations={loadRecommendation}
                    recommendations={getRecommendations(product.id)}
                    isLoadingRecs={isLoading(product.id)}
                  />
                ))}
              </div>
            )}
            
            {!loading && products.length > 0 && (
                <div className="text-xs text-gray-400 text-center pt-4">
                    Mostrando {products.length} productos
                </div>
            )}
          </main>

          {/* Sidebar Carrito (Sticky) */}
          <aside className="lg:sticky lg:top-8 z-10">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/40">
              <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900">Tu Pedido</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                  {totalItems} un.
                </span>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                    <div className="mb-3 rounded-full bg-gray-50 p-4">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium">Tu carrito está vacío</p>
                    <p className="text-xs mt-1">Agrega productos para comenzar</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="group relative flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-white hover:shadow-md hover:border-gray-200">
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-red-500 shadow-sm border border-gray-100 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 lg:opacity-100 lg:static lg:h-auto lg:w-auto lg:bg-transparent lg:shadow-none lg:border-none"
                        title="Eliminar"
                      >
                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>

                      <div className="flex-1 min-w-0">
                        <h4 className="truncate text-sm font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-xs text-gray-500 font-mono">{item.code}</p>
                        <div className="mt-2 text-xs font-bold text-gray-900">{formatMoney(String(Number(item.price) * item.quantity))}</div>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between gap-2">
                         <div className="flex items-center rounded-lg border border-gray-200 bg-white shadow-sm">
                            <button 
                                onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} 
                                className="px-2 py-1 text-gray-600 hover:bg-gray-50 rounded-l-md"
                            >-</button>
                            <span className="w-8 text-center text-xs font-bold border-x border-gray-100 py-1">{item.quantity}</span>
                            <button 
                                onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} 
                                disabled={item.quantity >= item.available} 
                                className="px-2 py-1 text-gray-600 hover:bg-gray-50 rounded-r-md disabled:opacity-30"
                            >+</button>
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Estimado</span>
                  <span className="text-2xl font-extrabold text-gray-900">{formatMoney(String(cartTotal))}</span>
                </div>

                <p className="text-[10px] text-gray-400 text-center">
                    El stock y datos se verifican al confirmar
                </p>

                <button
                  onClick={() => submitOrder()}
                  disabled={submitting || cart.length === 0}
                  className="group relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-gray-900/20 transition-all hover:scale-[1.02] hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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

      {/* ✅ MODAL DE DATOS DEL CLIENTE */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar"
            onClick={() => {
              if (submitting) return;
              setCustomerModalOpen(false);
            }}
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Completa tus datos
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Antes de generar el pedido necesitamos tu teléfono y documento.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej. 987654321"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Documento
                </label>
                <input
                  type="text"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value)}
                  placeholder="Ej. DNI / RUC"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomerModalOpen(false)}
                disabled={submitting}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmCustomerData}
                disabled={submitting}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "Guardando..." : "Guardar y generar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}