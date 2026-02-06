import { useCallback, useState } from "react";

import {
	clearDraft,
	createEmptyMemberRow,
	loadDraft,
	type MemberFormData,
	saveDraft,
} from "@/lib/member-schema";

export interface UseBulkMembersDraftReturn {
	initialMembers: MemberFormData[];
	savedIndices: Set<number>;
	setSavedIndices: React.Dispatch<React.SetStateAction<Set<number>>>;
	markSaved: (index: number) => void;
	savingIndex: number | null;
	setSavingIndex: React.Dispatch<React.SetStateAction<number | null>>;
	isSaving: (index: number) => boolean;
	saveToDraft: (members: MemberFormData[]) => void;
	clearDraftState: () => void;
	resetSavedIndices: () => void;
}

export function useBulkMembersDraft(): UseBulkMembersDraftReturn {
	const [initialMembers] = useState<MemberFormData[]>(() => {
		if (typeof window === "undefined") return [createEmptyMemberRow()];
		const draft = loadDraft();
		if (draft && draft.length > 0) {
			return draft.map((m) => ({
				...m,
				_rowId: m._rowId ?? crypto.randomUUID(),
			}));
		}
		return [createEmptyMemberRow()];
	});

	const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());

	const [savingIndex, setSavingIndex] = useState<number | null>(null);

	const markSaved = useCallback((index: number) => {
		setSavedIndices((prev) => new Set(prev).add(index));
	}, []);

	const isSaving = useCallback(
		(index: number) => savingIndex === index,
		[savingIndex],
	);

	const saveToDraft = useCallback((members: MemberFormData[]) => {
		saveDraft(members);
	}, []);

	const clearDraftState = useCallback(() => {
		clearDraft();
	}, []);

	const resetSavedIndices = useCallback(() => {
		setSavedIndices(new Set());
		setSavingIndex(null);
	}, []);

	return {
		initialMembers,
		savedIndices,
		setSavedIndices,
		markSaved,
		savingIndex,
		setSavingIndex,
		isSaving,
		saveToDraft,
		clearDraftState,
		resetSavedIndices,
	};
}
