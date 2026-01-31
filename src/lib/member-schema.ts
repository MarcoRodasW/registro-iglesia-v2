import { z } from "zod";

// Schema de validación para un miembro individual (para formularios con strings vacíos)
export const memberSchema = z.object({
	fullName: z.string().min(1, "El nombre es requerido"),
	phone: z.string().min(1, "El teléfono es requerido"),
	address: z.string().min(1, "La dirección es requerida"),
	email: z.string().email("Email inválido").or(z.literal("")),
	age: z.number().min(0, "La edad debe ser positiva").optional(),
	childrenCount: z
		.number()
		.min(0, "El número de hijos debe ser positivo")
		.optional(),
	firstVisitDate: z.number().optional(),
	notes: z.string(),
});

// Schema para un array de miembros (alta múltiple)
export const membersArraySchema = z.object({
	members: z.array(memberSchema).min(1, "Debe agregar al menos un miembro"),
});

// Tipo inferido del schema
export type MemberFormData = z.infer<typeof memberSchema>;
export type MembersArrayFormData = z.infer<typeof membersArraySchema>;

// Valores por defecto para una fila vacía
export const emptyMemberRow: MemberFormData = {
	fullName: "",
	phone: "",
	address: "",
	email: "",
	age: undefined,
	childrenCount: undefined,
	firstVisitDate: undefined,
	notes: "",
};

// Clave para localStorage
export const DRAFT_STORAGE_KEY = "members-draft";

// Función para guardar borrador en localStorage
export function saveDraft(members: MemberFormData[]): void {
	try {
		localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(members));
	} catch {
		// Silently fail if localStorage is not available
	}
}

// Función para cargar borrador desde localStorage
export function loadDraft(): MemberFormData[] | null {
	try {
		const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored) as MemberFormData[];
		}
	} catch {
		// Silently fail if localStorage is not available
	}
	return null;
}

// Función para limpiar borrador
export function clearDraft(): void {
	try {
		localStorage.removeItem(DRAFT_STORAGE_KEY);
	} catch {
		// Silently fail if localStorage is not available
	}
}
