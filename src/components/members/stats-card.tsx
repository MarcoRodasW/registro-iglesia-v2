import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsCard() {
	const { data: count, isLoading } = useQuery(
		convexQuery(api.members.count, {}),
	);

	return (
		<Card className="w-full ">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Total de Miembros
				</CardTitle>
				<UsersIcon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<div className="text-3xl font-bold">{count ?? 0}</div>
				)}
			</CardContent>
		</Card>
	);
}
