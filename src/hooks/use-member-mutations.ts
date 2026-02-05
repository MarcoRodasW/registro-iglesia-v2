import { api } from "@convex/api";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { useCallback } from "react";

import { toastManager } from "@/components/ui/toast";

// ============================================================================
// Types - Inferred from Convex API
// ============================================================================

/** Create member input - inferred from createMember function */
export type CreateMemberInput = FunctionArgs<typeof api.members.createMember>;

/** Update member input - inferred from updateMember function */
export type UpdateMemberInput = FunctionArgs<typeof api.members.updateMember>;

/** Delete member input - inferred from deleteMember function */
export type DeleteMemberInput = FunctionArgs<typeof api.members.deleteMember>;

/** Batch create members input - inferred from createMembersBatch function */
export type CreateMembersBatchInput = FunctionArgs<
	typeof api.members.createMembersBatch
>;

// ============================================================================
// Hook
// ============================================================================

export function useMemberMutations() {
	const queryClient = useQueryClient();

	// Invalidate both list and count queries
	const invalidateQueries = useCallback(async () => {
		// Get the base query key for members.list to invalidate all variations
		const listQueryKey = convexQuery(api.members.list, {
			paginationOpts: { numItems: 25, cursor: null },
			search: undefined,
		}).queryKey;

		// Get the base query key for members.count
		const countQueryKey = convexQuery(api.members.count, {}).queryKey;

		// Invalidate all queries with these prefixes
		// This will invalidate all search variations of the list query
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: listQueryKey }),
			queryClient.invalidateQueries({ queryKey: countQueryKey }),
		]);
	}, [queryClient]);

	// Create single member
	const createMemberMutation = useConvexMutation(api.members.createMember);
	const createMember = useMutation({
		mutationFn: createMemberMutation,
		onSuccess: async () => {
			await invalidateQueries();
			toastManager.add({
				title: "Miembro creado",
				type: "success",
			});
		},
		onError: (error) => {
			toastManager.add({
				title: "Error al crear el miembro",
				type: "error",
			});
			console.error(error);
		},
	});

	// Create multiple members (batch)
	const createMembersBatchMutation = useConvexMutation(
		api.members.createMembersBatch,
	);
	const createMembersBatch = useMutation({
		mutationFn: createMembersBatchMutation,
		onSuccess: async (_data, variables) => {
			await invalidateQueries();
			toastManager.add({
				title: `${variables.members.length} miembro(s) guardado(s)`,
				type: "success",
			});
		},
		onError: (error) => {
			toastManager.add({
				title: "Error al guardar los miembros",
				type: "error",
			});
			console.error(error);
		},
	});

	// Update member
	const updateMemberMutation = useConvexMutation(api.members.updateMember);
	const updateMember = useMutation({
		mutationFn: updateMemberMutation,
		onSuccess: async () => {
			await invalidateQueries();
			toastManager.add({
				title: "Miembro actualizado",
				type: "success",
			});
		},
		onError: (error) => {
			toastManager.add({
				title: "Error al actualizar el miembro",
				type: "error",
			});
			console.error(error);
		},
	});

	// Delete member
	const deleteMemberMutation = useConvexMutation(api.members.deleteMember);
	const deleteMember = useMutation({
		mutationFn: deleteMemberMutation,
		onSuccess: async () => {
			await invalidateQueries();
			toastManager.add({
				title: "Miembro eliminado",
				type: "success",
			});
		},
		onError: (error) => {
			toastManager.add({
				title: "Error al eliminar el miembro",
				type: "error",
			});
			console.error(error);
		},
	});

	return {
		// Mutations
		createMember,
		createMembersBatch,
		updateMember,
		deleteMember,
		// Helpers
		invalidateQueries,
		// Loading states
		isCreating: createMember.isPending,
		isCreatingBatch: createMembersBatch.isPending,
		isUpdating: updateMember.isPending,
		isDeleting: deleteMember.isPending,
	};
}
