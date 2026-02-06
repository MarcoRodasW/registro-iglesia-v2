import { z } from "zod";

export const memberSchema = z.object({
	_rowId: z.string().optional(),
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

export const membersArraySchema = z.object({
	members: z.array(memberSchema).min(1, "Debe agregar al menos un miembro"),
});

export type MemberFormData = z.infer<typeof memberSchema>;
export type MembersArrayFormData = z.infer<typeof membersArraySchema>;

export function createEmptyMemberRow(): MemberFormData {
	return {
		_rowId: crypto.randomUUID(),
		fullName: "",
		phone: "",
		address: "",
		email: "",
		age: undefined,
		childrenCount: undefined,
		firstVisitDate: undefined,
		notes: "",
	};
}

/** @deprecated Use createEmptyMemberRow() */
export const emptyMemberRow: MemberFormData = {
	_rowId: crypto.randomUUID(),
	fullName: "",
	phone: "",
	address: "",
	email: "",
	age: undefined,
	childrenCount: undefined,
	firstVisitDate: undefined,
	notes: "",
};

export const DRAFT_STORAGE_KEY = "members-draft";

export function saveDraft(members: MemberFormData[]): void {
	try {
		localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(members));
	} catch {}
}

export function loadDraft(): MemberFormData[] | null {
	try {
		const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored) as MemberFormData[];
		}
	} catch {}
	return null;
}

export function clearDraft(): void {
	try {
		localStorage.removeItem(DRAFT_STORAGE_KEY);
	} catch {}
}
