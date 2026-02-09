import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	MinusIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function GrowthRateCard() {
	const { data } = useSuspenseQuery(
		convexQuery(api.members.getMemberGrowthTrend, {}),
	);

	const getTrendIcon = (trend: "up" | "down" | "stable") => {
		switch (trend) {
			case "up":
				return <TrendingUpIcon className="size-5 text-emerald-500" />;
			case "down":
				return <TrendingDownIcon className="size-5 text-rose-500" />;
			default:
				return <MinusIcon className="size-5 text-amber-500" />;
		}
	};

	const getTrendColor = (trend: "up" | "down" | "stable") => {
		switch (trend) {
			case "up":
				return "text-emerald-600";
			case "down":
				return "text-rose-600";
			default:
				return "text-amber-600";
		}
	};

	const getTrendMessage = (
		trend: "up" | "down" | "stable",
		difference: number,
	) => {
		if (trend === "up") {
			if (difference === 1) return "¡Un nuevo hermano en Cristo!";
			if (difference <= 3) return "¡La familia crece!";
			return "¡Dios está moviéndose poderosamente!";
		}
		if (trend === "down") {
			if (difference === -1) return "Un mes tranquilo de oración";
			return "Momento de sembrar con fe";
		}
		return "Estabilidad en la congregación";
	};

	const maxCount =
		data.monthsData.reduce((max, m) => Math.max(max, m.count), 0) || 1;

	return (
		<Card className="w-full overflow-hidden">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
							<UsersIcon className="size-4 text-primary" />
						</div>
						<CardTitle className="text-base font-semibold">
							Nuevos miembros
						</CardTitle>
					</div>
					{getTrendIcon(data.trend)}
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				{/* Current month big number */}
				<div className="flex items-end gap-3">
					<span className="text-5xl font-bold tracking-tight">
						{data.currentMonth}
					</span>
					<div className="mb-1 flex items-center gap-1.5">
						<span
							className={cn("text-sm font-medium", getTrendColor(data.trend))}
						>
							{data.difference > 0 && "+"}
							{data.difference} este mes
						</span>
					</div>
				</div>

				{/* Motivational message */}
				<p className="text-sm text-muted-foreground">
					{getTrendMessage(data.trend, data.difference)}
				</p>

				{/* Mini bar chart */}
				<div className="space-y-2">
					<div className="flex items-end justify-between gap-1.5">
						{data.monthsData.map((month, index) => {
							const heightPercent =
								maxCount > 0 ? (month.count / maxCount) * 100 : 0;
							const isCurrentMonth = index === 5;

							return (
								<div
									key={month.label}
									className="flex flex-1 flex-col items-center gap-1.5"
								>
									<div className="relative w-full">
										<div
											className={cn(
												"w-full rounded-t-sm transition-all duration-500",
												isCurrentMonth ? "bg-primary" : "bg-primary/20",
											)}
											style={{
												height: `${Math.max(heightPercent, 4)}%`,
												minHeight: month.count > 0 ? "16px" : "4px",
											}}
										/>
									</div>
									<span
										className={cn(
											"text-[10px] font-medium",
											isCurrentMonth ? "text-primary" : "text-muted-foreground",
										)}
									>
										{month.label}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* Footer stats */}
				<div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
					<span>Total: {data.totalMembers} miembros</span>
					<span>Promedio: {data.avgGrowth}/mes</span>
				</div>
			</CardContent>
		</Card>
	);
}

export function GrowthRateCardSkeleton() {
	return (
		<Card className="w-full overflow-hidden">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
							<UsersIcon className="size-4 text-primary" />
						</div>
						<CardTitle className="text-base font-semibold">
							Nuevos miembros
						</CardTitle>
					</div>
					<Skeleton className="size-5" />
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="space-y-4">
					<Skeleton className="h-12 w-32" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
			</CardContent>
		</Card>
	);
}
