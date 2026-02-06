import type { MemberFields } from "../../convex/memberTypes";
import type { MemberFormData } from "./member-schema";

export type { MemberFields };

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
