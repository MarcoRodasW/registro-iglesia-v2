import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	MinusIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "stable";

function getTrendBadge(trend: Trend, difference: number) {
	const variant =
		trend === "up" ? "success" : trend === "down" ? "error" : "warning";
	const Icon =
		trend === "up"
			? TrendingUpIcon
			: trend === "down"
				? TrendingDownIcon
				: MinusIcon;
	const label =
		trend === "stable"
			? "Sin cambios"
			: `${difference > 0 ? "+" : ""}${difference} vs mes anterior`;

	return (
		<Badge variant={variant} size="sm">
			<Icon className="size-3" />
			{label}
		</Badge>
	);
}

function getTrendMessage(trend: Trend, difference: number) {
	if (trend === "up") {
		if (difference === 1) return "Un nuevo hermano en Cristo";
		if (difference <= 3) return "La familia crece con fuerza";
		return "Dios está moviéndose poderosamente";
	}
	if (trend === "down") {
		if (difference === -1) return "Un mes tranquilo de oración";
		return "Momento de sembrar con fe";
	}
	return "Estabilidad en la congregación";
}

export function GrowthRateCard() {
	const { data } = useSuspenseQuery(
		convexQuery(api.members.getMemberGrowthTrend, {}),
	);

	const animatedCurrent = useCountUp(data.currentMonth);

	const maxCount =
		data.monthsData.reduce((max, m) => Math.max(max, m.count), 0) || 1;

	return (
		<Card
			className="animate-fade-in-up w-full overflow-hidden shadow-sm dark:shadow-black/10 [animation-delay:160ms]"
			role="region"
			aria-label={`Crecimiento mensual: ${data.currentMonth} nuevos este mes, tendencia ${data.trend === "up" ? "al alza" : data.trend === "down" ? "a la baja" : "estable"}`}
		>
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 ring-1 ring-violet-200/60 dark:bg-violet-950/40 dark:ring-violet-800/40">
							<UsersIcon className="size-4.5 text-violet-600 dark:text-violet-400" />
						</div>
						<div>
							<CardTitle className="text-base">Crecimiento Mensual</CardTitle>
							<p className="text-xs text-muted-foreground/60">
								Últimos 6 meses de actividad
							</p>
						</div>
					</div>
					{getTrendBadge(data.trend, data.difference)}
				</div>
			</CardHeader>

			<CardContent>
				<div className="flex flex-col gap-8 md:flex-row md:items-end md:gap-12">
					{/* Left panel: KPI + message */}
					<div className="flex shrink-0 flex-col gap-3 md:w-48">
						<div>
							<span className="text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">
								{animatedCurrent}
							</span>
							<p className="mt-1 text-sm text-muted-foreground">
								nuevos este mes
							</p>
						</div>
						<p className="text-sm italic text-muted-foreground/70">
							"{getTrendMessage(data.trend, data.difference)}"
						</p>
					</div>

					{/* Right panel: Bar chart */}
					<div className="flex min-w-0 flex-1 flex-col gap-2">
						{/* Screen-reader-only data table */}
						<table className="sr-only">
							<caption>Nuevos miembros por mes, últimos 6 meses</caption>
							<thead>
								<tr>
									<th scope="col">Mes</th>
									<th scope="col">Nuevos miembros</th>
								</tr>
							</thead>
							<tbody>
								{data.monthsData.map((month) => (
									<tr key={`sr-${month.label}`}>
										<td>{month.label}</td>
										<td>{month.count}</td>
									</tr>
								))}
							</tbody>
						</table>

						{/* Visual bars — hidden from assistive tech (data table above is used instead) */}
						<div
							className="flex items-end gap-2 sm:gap-3"
							role="img"
							aria-label={`Gráfico de barras: crecimiento mensual. ${data.monthsData.map((m) => `${m.label}: ${m.count}`).join(", ")}`}
						>
							{data.monthsData.map((month, index) => {
								const heightPercent =
									maxCount > 0 ? (month.count / maxCount) * 100 : 0;
								const isCurrentMonth = index === data.monthsData.length - 1;
								const hasData = month.count > 0;
								const barHeight = hasData ? Math.max(heightPercent, 8) : 3;

								return (
									<Tooltip key={month.label}>
										<div className="group/bar flex flex-1 flex-col items-center gap-2">
											{/* Count label — only show when there's data */}
											<span
												aria-hidden="true"
												className={cn(
													"h-4 text-xs tabular-nums transition-opacity duration-200",
													!hasData && "invisible",
													hasData && isCurrentMonth
														? "font-semibold text-foreground"
														: "text-muted-foreground opacity-0 group-hover/bar:opacity-100",
												)}
											>
												{month.count}
											</span>

											{/* Bar container with baseline — tooltip trigger */}
											<TooltipTrigger
												delay={0}
												className="relative h-25 w-full cursor-default border-b border-border/40 sm:h-35"
											>
												<div
													className={cn(
														"absolute inset-x-0 bottom-0 origin-bottom animate-bar-grow rounded-t-md transition-colors duration-200",
														isCurrentMonth
															? "bg-chart-1 shadow-[0_-4px_12px_-4px] shadow-chart-1/30"
															: hasData
																? "bg-primary/12 group-hover/bar:bg-primary/20 dark:bg-primary/15 dark:group-hover/bar:bg-primary/25"
																: "bg-primary/5 dark:bg-primary/8",
													)}
													style={{
														height: `${barHeight}%`,
														animationDelay: `${300 + index * 80}ms`,
													}}
												/>
											</TooltipTrigger>

											{/* Tooltip popup */}
											<TooltipPopup side="top" sideOffset={8}>
												<span className="font-medium">{month.count}</span>{" "}
												<span className="text-muted-foreground">
													{month.count === 1 ? "nuevo" : "nuevos"} en{" "}
													{month.label}
												</span>
											</TooltipPopup>

											{/* Month label */}
											<span
												aria-hidden="true"
												className={cn(
													"text-[11px] font-medium",
													isCurrentMonth
														? "text-foreground"
														: "text-muted-foreground/70",
												)}
											>
												{month.label}
											</span>
										</div>
									</Tooltip>
								);
							})}
						</div>
					</div>
				</div>
			</CardContent>

			<CardFooter>
				<div className="flex w-full items-center justify-between border-t pt-4 text-xs text-muted-foreground/70">
					<div className="flex items-center gap-2">
						<div className="size-1.5 rounded-full bg-violet-400" />
						<span>
							Total:{" "}
							<span className="font-medium text-foreground">
								{data.totalMembers}
							</span>{" "}
							miembros
						</span>
					</div>
					<span>
						Promedio:{" "}
						<span className="font-medium text-foreground">
							{data.avgGrowth}
						</span>
						/mes
					</span>
				</div>
			</CardFooter>
		</Card>
	);
}

export function GrowthRateCardSkeleton() {
	return (
		<Card className="w-full overflow-hidden">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Skeleton className="size-10 rounded-xl" />
						<div className="space-y-1.5">
							<Skeleton className="h-4 w-36" />
							<Skeleton className="h-3 w-44" />
						</div>
					</div>
					<Skeleton className="h-5 w-28 rounded-sm" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-8 md:flex-row md:items-end md:gap-12">
					<div className="flex shrink-0 flex-col gap-3 md:w-48">
						<div className="space-y-2">
							<Skeleton className="h-14 w-20" />
							<Skeleton className="h-4 w-28" />
						</div>
						<Skeleton className="h-4 w-full" />
					</div>
					<div className="flex min-w-0 flex-1 items-end gap-2 sm:gap-3">
						{[56, 80, 44, 96, 64, 112].map((h, i) => (
							<div
								key={`skel-${String(i)}`}
								className="flex flex-1 flex-col items-center gap-2"
							>
								<Skeleton className="h-3 w-4" />
								<Skeleton
									className="w-full rounded-t-lg"
									style={{ height: `${h}px` }}
								/>
								<Skeleton className="h-3 w-6" />
							</div>
						))}
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<div className="flex w-full items-center justify-between border-t pt-4">
					<Skeleton className="h-3 w-32" />
					<Skeleton className="h-3 w-24" />
				</div>
			</CardFooter>
		</Card>
	);
}
