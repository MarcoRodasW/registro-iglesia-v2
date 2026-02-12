import { api } from "@convex/api";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { useCallback } from "react";

import { toastManager } from "@/components/ui/toast";

export type CreateMemberInput = FunctionArgs<typeof api.members.createMember>;
export type UpdateMemberInput = FunctionArgs<typeof api.members.updateMember>;
export type DeleteMemberInput = FunctionArgs<typeof api.members.deleteMember>;
export type CreateMembersBatchInput = FunctionArgs<
	typeof api.members.createMembersBatch
>;

export function useMemberMutations() {
	const queryClient = useQueryClient();

	const invalidateQueries = useCallback(async () => {
		const countQueryKey = convexQuery(api.members.count, {}).queryKey;
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: countQueryKey }),
		]);
	}, [queryClient]);

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
		createMember,
		createMembersBatch,
		updateMember,
		deleteMember,
		invalidateQueries,
		isCreating: createMember.isPending,
		isCreatingBatch: createMembersBatch.isPending,
		isUpdating: updateMember.isPending,
		isDeleting: deleteMember.isPending,
	};
}
