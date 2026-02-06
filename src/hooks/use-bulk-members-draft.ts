import { useCallback, useState } from "react";

import {
	clearDraft,
	createEmptyMemberRow,
	loadDraft,
	type MemberFormData,
	saveDraft,
} from "@/lib/member-schema";

// ============================================================================
// Types
// ============================================================================

export interface UseBulkMembersDraftReturn {
	// Draft data
	initialMembers: MemberFormData[];
	// Saved indices tracking
	savedIndices: Set<number>;
	setSavedIndices: React.Dispatch<React.SetStateAction<Set<number>>>;
	markSaved: (index: number) => void;
	// Saving state
	savingIndex: number | null;
	setSavingIndex: React.Dispatch<React.SetStateAction<number | null>>;
	isSaving: (index: number) => boolean;
	// Draft operations
	saveToDraft: (members: MemberFormData[]) => void;
	clearDraftState: () => void;
	resetSavedIndices: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useBulkMembersDraft(): UseBulkMembersDraftReturn {
	// Load draft from localStorage on mount
	const [initialMembers] = useState<MemberFormData[]>(() => {
		if (typeof window === "undefined") return [createEmptyMemberRow()];
		const draft = loadDraft();
		if (draft && draft.length > 0) {
			// Ensure loaded drafts have stable row IDs
			return draft.map((m) => ({
				...m,
				_rowId: m._rowId ?? crypto.randomUUID(),
			}));
		}
		return [createEmptyMemberRow()];
	});

	// Track which members have been saved (by index)
	const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());

	// Track which member is currently being saved
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
