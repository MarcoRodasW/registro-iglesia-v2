import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/use-count-up";

export function StatsCard() {
	const { data: count } = useSuspenseQuery(convexQuery(api.members.count, {}));
	const animatedCount = useCountUp(count ?? 0);

	return (
		<Card
			className="group animate-fade-in-up w-full overflow-hidden shadow-sm dark:shadow-black/10"
			role="region"
			aria-label={`Total de miembros: ${count ?? 0} personas`}
		>
			<CardHeader>
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:ring-amber-800/40">
						<UsersIcon className="size-[18px] text-amber-600 dark:text-amber-400" />
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Total de Miembros
						</p>
						<p className="text-xs text-muted-foreground/60">
							Congregación registrada
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-baseline gap-2">
					<span className="text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">
						{animatedCount}
					</span>
					<span className="text-sm font-medium text-muted-foreground">
						personas
					</span>
				</div>
			</CardContent>
			<CardFooter>
				<div className="flex w-full items-center gap-2 border-t pt-4 text-xs text-muted-foreground/70">
					<div className="size-1.5 rounded-full bg-amber-400" />
					<span>Miembros activos en el registro</span>
				</div>
			</CardFooter>
		</Card>
	);
}

export function StatsCardSkeleton() {
	return (
		<Card className="w-full overflow-hidden">
			<CardHeader>
				<div className="flex items-center gap-3">
					<Skeleton className="size-10 rounded-xl" />
					<div className="space-y-1.5">
						<Skeleton className="h-3.5 w-28" />
						<Skeleton className="h-3 w-36" />
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<Skeleton className="h-14 w-24" />
			</CardContent>
			<CardFooter>
				<div className="flex w-full items-center gap-2 border-t pt-4">
					<Skeleton className="size-1.5 rounded-full" />
					<Skeleton className="h-3 w-44" />
				</div>
			</CardFooter>
		</Card>
	);
}
