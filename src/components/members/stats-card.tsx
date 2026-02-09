import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsCard() {
	const { data: count } = useSuspenseQuery(convexQuery(api.members.count, {}));

	return (
		<Card className="w-full ">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Total de Miembros
				</CardTitle>
				<UsersIcon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-3xl font-bold">{count ?? 0}</div>
			</CardContent>
		</Card>
	);
}

export function StatsCardSkeleton() {
	return (
		<Card className="w-full ">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Total de Miembros
				</CardTitle>
				<UsersIcon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-8 w-16" />
			</CardContent>
		</Card>
	);
}
