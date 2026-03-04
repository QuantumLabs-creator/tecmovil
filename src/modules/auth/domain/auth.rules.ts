import { Role } from "@/src/generated/prisma";

export function normalizeEmail(email: string) {
    return String(email).toLowerCase().trim();
}

// ✅ Auto-registro permitido SOLO para USER o SELLER
export function assertSelfRegisterRole(role: Role) {
    const allowed: Role[] = [Role.USER, Role.SELLER];

    if (!allowed.includes(role)) {
        throw new Error("Rol no permitido para auto-registro");
    }
}

export function assertActiveUser(active: boolean) {
    if (!active) throw new Error("Usuario inactivo");
}