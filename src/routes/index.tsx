import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import {
	BulkAddMembersDialog,
	GrowthRateCard,
	MembersNavbar,
	MembersTable,
	NewMembersCard,
	StatsCard,
} from "@/components/members";

export const Route = createFileRoute("/")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/login" });
		}
	},
	loader: async ({ context }) => {
		const { queryClient } = context;
		await Promise.all([
			queryClient.ensureQueryData(convexQuery(api.auth.getCurrentUser, {})),
			queryClient.ensureQueryData(convexQuery(api.members.count, {})),
			queryClient.ensureQueryData(
				convexQuery(api.members.countNewThisMonth, {}),
			),
			queryClient.ensureQueryData(
				convexQuery(api.members.getGrowthRate, { period: "month" }),
			),
			queryClient.ensureQueryData(
				convexQuery(api.members.getGrowthRate, { period: "week" }),
			),
			queryClient.ensureQueryData(
				convexQuery(api.members.list, {
					paginationOpts: { numItems: 25, cursor: null },
					search: undefined,
				}),
			),
		]);
	},
	component: MembersPage,
});

function MembersPage() {
	return (
		<div className="min-h-screen flex flex-col">
			<MembersNavbar />

			<main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8 space-y-6">
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

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<StatsCard />
					<NewMembersCard />
					<GrowthRateCard />
				</div>

				<MembersTable />
			</main>
		</div>
	);
}
