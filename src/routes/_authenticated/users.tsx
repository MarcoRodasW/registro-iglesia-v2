import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { UsersSkeleton, UsersTable } from "@/components/users";

export const Route = createFileRoute("/_authenticated/users")({
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
		// Fire-and-forget prefetch — don't block navigation.
		// UsersTable uses useSuspenseQuery; Suspense shows skeleton until ready.
		context.queryClient.prefetchQuery(convexQuery(api.users.listUsers, {}));
	},
	component: UsersPage,
});

function UsersPage() {
	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl sm:text-3xl font-bold">Usuarios del Sistema</h1>
				<p className="text-muted-foreground mt-1 text-sm sm:text-base">
					Gestiona los roles de los usuarios registrados
				</p>
			</header>

			<Suspense fallback={<UsersSkeleton />}>
				<UsersTable />
			</Suspense>
		</div>
	);
}
