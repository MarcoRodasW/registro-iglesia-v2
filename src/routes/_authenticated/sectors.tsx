import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { CreateSectorDialog } from "@/components/sectors/create-sector-dialog";
import {
	SectorsGrid,
	SectorsGridSkeleton,
} from "@/components/sectors/sectors-grid";

export const Route = createFileRoute("/_authenticated/sectors")({
	component: SectorsPage,
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData(
			convexQuery(api.users.getCurrentUserWithRole, {}),
		);
		if (user.role !== "admin" && user.role !== "leader") {
			throw redirect({ to: "/members" });
		}

		return {
			user,
		};
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.sectors.listSectors, {}),
		);
	},
});

function SectorsPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Sectores</h1>
				<CreateSectorDialog />
			</div>
			<Suspense fallback={<SectorsGridSkeleton />}>
				<SectorsGrid />
			</Suspense>
		</div>
	);
}
