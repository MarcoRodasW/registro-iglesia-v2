import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { BulkAddMembersDialog, MembersTable } from "@/components/members";

export const Route = createFileRoute("/_authenticated/members")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.members.list, {
				paginationOpts: { numItems: 25, cursor: null },
				search: undefined,
			}),
		);
	},
	component: MembersPage,
});

function MembersPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<header>
					<h1 className="text-2xl sm:text-3xl font-bold">
						Registro de Miembros
					</h1>
					<p className="text-muted-foreground mt-1 text-sm sm:text-base">
						Administra los miembros de la iglesia
					</p>
				</header>

				<BulkAddMembersDialog />
			</div>

			<MembersTable />
		</div>
	);
}
