import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Menu,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuTrigger,
} from "@/components/ui/menu";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function MembersNavbar() {
	const navigate = useNavigate();
	const { data: user, isLoading } = useQuery(
		convexQuery(api.auth.getCurrentUser, {}),
	);

	const handleSignOut = async () => {
		await authClient.signOut();
		navigate({ to: "/login" });
	};

	const userName = user?.name ?? "Usuario";
	const userEmail = user?.email ?? "";
	const userImage = user?.image;

	return (
		<nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="mx-auto max-w-6xl container px-4">
				<div className="flex h-14 items-center justify-between">
					{/* Logo/Title */}
					<div className="font-semibold text-lg">Registro Iglesia</div>

					{/* User Menu */}
					{isLoading ? (
						<div className="flex items-center gap-2">
							<Skeleton className="size-8 rounded-full" />
							<Skeleton className="h-4 w-24 hidden sm:block" />
						</div>
					) : (
						<Menu>
							<MenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-accent transition-colors cursor-pointer">
								<Avatar className="size-8">
									{userImage && <AvatarImage src={userImage} alt={userName} />}
									<AvatarFallback>{getInitials(userName)}</AvatarFallback>
								</Avatar>
								<span className="text-sm font-medium hidden sm:block">
									{userName}
								</span>
							</MenuTrigger>
							<MenuPopup align="end" sideOffset={8}>
								<div className="px-2 py-1.5">
									<p className="text-sm font-medium">{userName}</p>
									{userEmail && (
										<p className="text-xs text-muted-foreground">{userEmail}</p>
									)}
								</div>
								<MenuSeparator />
								<MenuItem onClick={handleSignOut} variant="destructive">
									<LogOutIcon className="size-4" />
									Cerrar sesión
								</MenuItem>
							</MenuPopup>
						</Menu>
					)}
				</div>
			</div>
		</nav>
	);
}
