import { Role, RecordStatus } from "@/src/generated/prisma";

export function normalizeEmail(email: string) {
  return String(email ?? "").toLowerCase().trim();
}

// Auto-registro público: solo clientes web
export function assertSelfRegisterRole(role: Role) {
  if (role !== Role.USER) {
    throw new Error("Rol no permitido para auto-registro");
  }
}

export function isUserActive(status: RecordStatus) {
  return status === RecordStatus.ACTIVE;
}

export function assertActiveUser(active: boolean) {
  if (!active) throw new Error("Usuario inactivo");
}