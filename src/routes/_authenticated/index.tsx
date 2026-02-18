import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";

import {
	GrowthRateCard,
	GrowthRateCardSkeleton,
	NewMembersCard,
	NewMembersCardSkeleton,
	StatsCard,
	StatsCardSkeleton,
} from "@/components/members";

export const Route = createFileRoute("/_authenticated/")({
	beforeLoad: async ({ context }) => {
		const { queryClient } = context;
		const user = await queryClient.ensureQueryData(
			convexQuery(api.users.getCurrentUserWithRole, {}),
		);
		if (user.role !== "admin") {
			throw redirect({ to: "/members" });
		}
	},
	component: DashboardPage,
});

function DashboardPage() {
	const today = new Date();
	const formattedDate = today.toLocaleDateString("es", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<div className="space-y-6">
			<header className="animate-fade-in">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Dashboard
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Resumen de tu iglesia &middot; {formattedDate}
				</p>
			</header>

			{/* KPI summary cards */}
			<div className="grid gap-4 sm:grid-cols-2">
				<Suspense fallback={<StatsCardSkeleton />}>
					<StatsCard />
				</Suspense>
				<Suspense fallback={<NewMembersCardSkeleton />}>
					<NewMembersCard />
				</Suspense>
			</div>

			{/* Growth chart — full width */}
			<Suspense fallback={<GrowthRateCardSkeleton />}>
				<GrowthRateCard />
			</Suspense>
		</div>
	);
}
