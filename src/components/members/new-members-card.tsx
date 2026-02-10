import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SparklesIcon, UserPlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/use-count-up";

export function NewMembersCard() {
	const { data: count } = useSuspenseQuery(
		convexQuery(api.members.countNewThisMonth, {}),
	);
	const animatedCount = useCountUp(count ?? 0);

	const currentMonth = new Date().toLocaleString("es", { month: "long" });

	return (
		<Card
			className="group animate-fade-in-up w-full overflow-hidden shadow-sm dark:shadow-black/10 [animation-delay:80ms]"
			role="region"
			aria-label={`Nuevos miembros este mes de ${currentMonth}: ${count ?? 0}`}
		>
			<CardHeader>
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-teal-100 ring-1 ring-teal-200/60 dark:bg-teal-950/40 dark:ring-teal-800/40">
						<UserPlusIcon className="size-[18px] text-teal-600 dark:text-teal-400" />
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Nuevos Este Mes
						</p>
						<p className="text-xs text-muted-foreground/60 capitalize">
							{currentMonth}
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-baseline gap-3">
					<span className="text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">
						{animatedCount}
					</span>
					{count > 0 && (
						<Badge variant="success" size="sm">
							<SparklesIcon className="size-3" />+{count}
						</Badge>
					)}
				</div>
			</CardContent>
			<CardFooter>
				<div className="flex w-full items-center gap-2 border-t pt-4 text-xs text-muted-foreground/70">
					<div className="size-1.5 rounded-full bg-teal-400" />
					<span>
						{count > 0
							? "Nuevas incorporaciones a la familia"
							: "Sin incorporaciones este mes"}
					</span>
				</div>
			</CardFooter>
		</Card>
	);
}

export function NewMembersCardSkeleton() {
	return (
		<Card className="w-full overflow-hidden">
			<CardHeader>
				<div className="flex items-center gap-3">
					<Skeleton className="size-10 rounded-xl" />
					<div className="space-y-1.5">
						<Skeleton className="h-3.5 w-24" />
						<Skeleton className="h-3 w-16" />
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<Skeleton className="h-14 w-20" />
			</CardContent>
			<CardFooter>
				<div className="flex w-full items-center gap-2 border-t pt-4">
					<Skeleton className="size-1.5 rounded-full" />
					<Skeleton className="h-3 w-48" />
				</div>
			</CardFooter>
		</Card>
	);
}
