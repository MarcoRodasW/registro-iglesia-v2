import type { MemberFields } from "../../convex/member-types";
import type { MemberFormData } from "./member-schema";

// Re-exportar el tipo para uso en componentes
export type { MemberFields };

/**
 * Normaliza los datos del formulario para enviarlos a la API.
 * Convierte strings vacíos en undefined para campos opcionales.
 */
export function toMemberPayload(data: MemberFormData): MemberFields {
	return {
		fullName: data.fullName,
		phone: data.phone,
		address: data.address,
		email: data.email?.trim() || undefined,
		age: data.age,
		childrenCount: data.childrenCount,
		firstVisitDate: data.firstVisitDate,
		notes: data.notes?.trim() || undefined,
	};
}
