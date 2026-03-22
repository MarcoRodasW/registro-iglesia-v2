import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	EyeIcon,
	MapPinIcon,
	Trash2Icon,
	UserCheckIcon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DeleteSectorAlert } from "./delete-sector-alert";
import { DetailSectorDialog } from "./detail-sector-dialog";

export function SectorsGrid() {
	const { data: sectors } = useSuspenseQuery(
		convexQuery(api.sectors.listSectors, {}),
	);

	const [sectorToEdit, setSectorToEdit] = useState<(typeof sectors)[0] | null>(
		null,
	);
	const [sectorToDelete, setSectorToDelete] = useState<
		(typeof sectors)[0] | null
	>(null);

	return (
		<>
			{!sectors || sectors.length === 0 ? (
				<EmptySectorGrid />
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
					{sectors.map((sector) => (
						<Card key={sector._id} className="flex flex-col">
							<CardHeader className="">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<MapPinIcon className="size-5 text-muted-foreground" />
										<CardTitle className="text-lg">{sector.name}</CardTitle>
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="size-8"
											onClick={() => setSectorToEdit(sector)}
										>
											<EyeIcon className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="size-8 text-destructive hover:text-destructive"
											onClick={() => setSectorToDelete(sector)}
										>
											<Trash2Icon className="size-4" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex-1">
								<p
									className={cn(
										"text-sm line-clamp-2",
										sector.description
											? "text-muted-foreground"
											: "text-muted-foreground/50 italic",
									)}
								>
									{sector.description ?? "Sin descripción añadida aún"}
								</p>
							</CardContent>
							<CardFooter className="border-t pt-4">
								<div className="flex w-full justify-around text-sm text-muted-foreground">
									<div className="flex items-center gap-1.5">
										<UsersIcon className="size-4" />
										<span>{sector.memberCount} miembros</span>
									</div>
									<div className="flex items-center gap-1.5">
										<UserCheckIcon className="size-4" />
										<span>{sector.leaderCount} líderes</span>
									</div>
								</div>
							</CardFooter>
						</Card>
					))}
				</div>
			)}

			{sectorToEdit && (
				<DetailSectorDialog
					sector={sectorToEdit}
					open={!!sectorToEdit}
					onOpenChange={(open) => !open && setSectorToEdit(null)}
				/>
			)}

			{sectorToDelete && (
				<DeleteSectorAlert
					open={!!sectorToDelete}
					onOpenChange={(open) => !open && setSectorToDelete(null)}
					sector={sectorToDelete}
				/>
			)}
		</>
	);
}

export function SectorsGridSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
			{Array.from({ length: 4 }).map((_, i) => (
				<Card
					// biome-ignore lint/suspicious/noArrayIndexKey: <Skeleton array>
					key={`skeleton-${i}`}
					className="flex flex-col"
				>
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-2">
								<Skeleton className="size-5 rounded" />
								<Skeleton className="h-5 w-24" />
							</div>
							<div className="flex gap-1">
								<Skeleton className="size-8 rounded" />
								<Skeleton className="size-8 rounded" />
							</div>
						</div>
						<Skeleton className="h-4 w-full mt-2" />
					</CardHeader>
					<CardContent className="flex-1" />
					<CardFooter className="border-t pt-4">
						<div className="flex w-full justify-around">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-16" />
						</div>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}

export function EmptySectorGrid() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<MapPinIcon />
				</EmptyMedia>
				<EmptyTitle>Sin sectores</EmptyTitle>
				<EmptyDescription>
					No hay sectores registrados en el sistema.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
