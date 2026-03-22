import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import {
	BookUserIcon,
	LayoutDashboardIcon,
	MapPinIcon,
	UsersIcon,
} from "lucide-react";

import { MembersNavbar } from "@/components/members";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, preload, cause }) => {
		if (preload || cause !== "enter") return;
		if (!context.isAuthenticated) {
			throw redirect({ to: "/login" });
		}
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.users.getCurrentUserWithRole, {}),
		);
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	const { data: currentUser } = useSuspenseQuery(
		convexQuery(api.users.getCurrentUserWithRole, {}),
	);
	const isAdmin = currentUser?.role === "admin";
	const isAdminOrLeader =
		currentUser?.role === "admin" || currentUser?.role === "leader";

	return (
		<div className="min-h-screen flex flex-col">
			<MembersNavbar />

			<nav className="border-b bg-background overflow-x-auto">
				<div className="mx-auto max-w-6xl px-4">
					<div className="flex items-center gap-1 -mb-px min-w-0">
						{isAdmin && (
							<NavLink to="/" icon={<LayoutDashboardIcon className="size-4" />}>
								Dashboard
							</NavLink>
						)}
						<NavLink to="/members" icon={<BookUserIcon className="size-4" />}>
							Miembros
						</NavLink>
						{isAdminOrLeader && (
							<NavLink to="/sectors" icon={<MapPinIcon className="size-4" />}>
								Sectores
							</NavLink>
						)}
						{isAdmin && (
							<NavLink to="/users" icon={<UsersIcon className="size-4" />}>
								Usuarios
							</NavLink>
						)}
					</div>
				</div>
			</nav>

			<main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
				<Outlet />
			</main>
		</div>
	);
}

function NavLink({
	to,
	icon,
	children,
}: {
	to: string;
	icon: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<Link
			to={to}
			className={cn(
				"flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-muted-foreground border-b-2 border-transparent transition-colors hover:text-foreground",
				"[&.active]:text-foreground [&.active]:border-primary",
			)}
			activeOptions={{ exact: true }}
		>
			{icon}
			{children}
		</Link>
	);
}
