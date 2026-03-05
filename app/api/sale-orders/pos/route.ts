// app/api/sale-orders/pos/route.ts
import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaSaleOrderRepository } from "@/src/modules/saleOrders/infrastructure/saleOrder.repo";
import { CreateSaleOrderUseCase } from "@/src/modules/saleOrders/application/createSaleOrder.usecase";

import { PrismaCustomerRepository } from "@/src/modules/customers/infrastructure/customer.repo";
import { CreateCustomerUseCase } from "@/src/modules/customers/application/createCustomer.usecase";

function hasAnyRole(session: any, roles: string[]) {
  const role = String(session?.role ?? "").toUpperCase();
  return roles.includes(role);
}

/**
 * POS / MOSTRADOR
 * - Solo SELLER/ADMIN
 * - Cliente externo: customerId (o customerCreate)
 * - userId siempre null
 */
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (!hasAnyRole(session, ["ADMIN", "SELLER"])) return fail("No autorizado", 401);

    const body = await req.json();
    if (!body || typeof body !== "object") return fail("Body inválido", 400);

    // ============ Resolver customer ============
    // Opción A: mandas customerId
    let customerId = String((body as any).customerId ?? "").trim() || null;

    // Opción B: mandas customerCreate { name, phone?, email?, document?, customerType? }
    const customerCreate = (body as any).customerCreate;

    if (!customerId) {
      if (!customerCreate || typeof customerCreate !== "object") {
        return fail("customerId requerido (o customerCreate)", 400);
      }

      // crea customer externo
      const customerRepo = new PrismaCustomerRepository();
      const createCustomerUC = new CreateCustomerUseCase(customerRepo);
      const createdCustomer = await createCustomerUC.execute({
        ...customerCreate,
        // si no mandas customerType, que sea RETAIL por defecto (según tu modelo)
        customerType: customerCreate.customerType ?? "RETAIL",
      });

      customerId = createdCustomer.id;
    }

    // ============ Forzar modo POS ============
    // - NO aceptamos userId por seguridad
    // - sellerId será el usuario logueado (vendedor)
    (body as any).userId = null;
    (body as any).customerId = customerId;
    (body as any).sellerId = session.userId;

    // Si no mandan customerType, lo calculas por defecto (RETAIL)
    (body as any).customerType = (body as any).customerType ?? "RETAIL";

    const repo = new PrismaSaleOrderRepository();
    const uc = new CreateSaleOrderUseCase(repo);

    const created = await uc.execute(body, session.userId);

    return ok(created);
  } catch (e: any) {
    const msg = e?.message ?? "Error al crear pedido POS";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}