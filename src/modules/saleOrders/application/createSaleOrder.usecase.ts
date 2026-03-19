import type { SaleOrderRepository } from "../domain/saleOrder.repository";
import { assertCreateSaleOrderDTO, type CreateSaleOrderDTO } from "./dtos/saleOrder.dto";
import { normalizeCustomerType, normalizeInt, normalizeText } from "../domain/saleOrder.rules";

export class CreateSaleOrderUseCase {
  constructor(private readonly repo: SaleOrderRepository) {}

  async execute(input: unknown, actorUserId: string) {
    assertCreateSaleOrderDTO(input);
    const dto = input as CreateSaleOrderDTO;

    const items = dto.items.map((it) => ({
      productId: String(it.productId).trim(),
      quantity: Math.max(1, normalizeInt(it.quantity, 1)),
    }));

    const customerType = normalizeCustomerType(dto.customerType, "RETAIL");

    return this.repo.createRequest(
      {
        userId: dto.userId ?? null,
        customerId: dto.customerId ?? null,
        sellerId: dto.sellerId ?? null,
        customerType,
        observations: normalizeText(dto.observations) ?? null,
        customerData: dto.customerData
          ? {
              name: normalizeText(dto.customerData.name) ?? null,
              phone: normalizeText(dto.customerData.phone) ?? null,
              document: normalizeText(dto.customerData.document) ?? null,
            }
          : undefined,
        items,
      },
      actorUserId
    );
  }
}