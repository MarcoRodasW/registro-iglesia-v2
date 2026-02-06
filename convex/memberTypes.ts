import type { Infer } from "convex/values";
import { v } from "convex/values";

/**
 * Validador de campos de miembro - compartido entre schema y API
 * Define la forma base de un miembro sin metadatos del sistema
 */
export const memberFieldsValidator = v.object({
	fullName: v.string(),
	phone: v.string(),
	address: v.string(),
	email: v.optional(v.string()),
	age: v.optional(v.number()),
	childrenCount: v.optional(v.number()),
	firstVisitDate: v.optional(v.number()),
	notes: v.optional(v.string()),
});

/**
 * Tipo base de miembro inferido desde el validador Convex
 * Usado para inputs de creación/actualización
 */
export type MemberFields = Infer<typeof memberFieldsValidator>;
