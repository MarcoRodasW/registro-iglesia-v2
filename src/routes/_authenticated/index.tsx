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
	beforeLoad: ({ context }) => {
		const { queryClient } = context;
		// Fast cache check — only redirect if we already know the role
		const cached = queryClient.getQueryData<{ role: string }>(
			convexQuery(api.users.getCurrentUserWithRole, {}).queryKey,
		);
		if (cached && cached.role !== "admin") {
			throw redirect({ to: "/members" });
		}
	},
	loader: ({ context }) => {
		const { queryClient } = context;
		// Fire-and-forget prefetches — don't block navigation.
		// Components use useSuspenseQuery; Suspense shows skeletons until ready.
		queryClient.prefetchQuery(convexQuery(api.members.count, {}));
		queryClient.prefetchQuery(convexQuery(api.members.countNewThisMonth, {}));
		queryClient.prefetchQuery(
			convexQuery(api.members.getMemberGrowthTrend, {}),
		);
	},
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground mt-1 text-sm sm:text-base">
					Resumen general de la iglesia
				</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Suspense fallback={<StatsCardSkeleton />}>
					<StatsCard />
				</Suspense>
				<Suspense fallback={<NewMembersCardSkeleton />}>
					<NewMembersCard />
				</Suspense>
				<Suspense fallback={<GrowthRateCardSkeleton />}>
					<GrowthRateCard />
				</Suspense>
			</div>
		</div>
	);
}
