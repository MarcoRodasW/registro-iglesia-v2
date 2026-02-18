import { api } from "@convex/api";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { CreateSectorDialog } from "@/components/sectors/create-sector-dialog";
import { SectorsTable } from "@/components/sectors/sectors-table";

export const Route = createFileRoute("/_authenticated/sectors")({
	component: SectorsPage,
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData(
			convexQuery(api.users.getCurrentUserWithRole, {}),
		);
		if (user.role !== "admin" && user.role !== "leader") {
			throw redirect({ to: "/members" });
		}
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.sectors.listSectors, {}),
		);
	},
});

function SectorsPage() {
	const queryClient = useQueryClient();

	const deleteSectorMutation = useConvexMutation(api.sectors.deleteSector);
	const deleteSector = useMutation({
		mutationFn: deleteSectorMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: convexQuery(api.sectors.listSectors, {}).queryKey,
			});
		},
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Sectores</h1>
				<CreateSectorDialog />
			</div>
			<SectorsTable onDeleteSector={(args) => deleteSector.mutate(args)} />
		</div>
	);
}
