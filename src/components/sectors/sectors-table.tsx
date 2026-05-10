import { api } from "@convex/api";
import type { Doc, Id } from "@convex/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MapPinIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DetailSectorDialog,
	prefetchSectorDetailQueries,
} from "./detail-sector-dialog";

interface PendingDelete {
	sectorId: Id<"sectors">;
	sectorName: string;
}

export function SectorsTable({
	onDeleteSector,
}: {
	onDeleteSector: (args: { sectorId: Id<"sectors"> }) => void;
}) {
	const queryClient = useQueryClient();
	const { data: sectors } = useSuspenseQuery(
		convexQuery(api.sectors.listSectors, {}),
	);

	const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
		null,
	);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [editSector, setEditSector] = useState<Doc<"sectors"> | null>(null);
	const [editOpen, setEditOpen] = useState(false);

	const handleDeleteRequest = (sectorId: Id<"sectors">, sectorName: string) => {
		setPendingDelete({ sectorId, sectorName });
		setConfirmOpen(true);
	};

	const handleConfirmDelete = () => {
		if (!pendingDelete) return;
		onDeleteSector({ sectorId: pendingDelete.sectorId });
		setConfirmOpen(false);
		setPendingDelete(null);
	};

	const handleEditRequest = (sector: Doc<"sectors">) => {
		setEditSector(sector);
		setEditOpen(true);
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Gestionar Sectores</CardTitle>
				</CardHeader>
				<CardContent>
					{!sectors || sectors.length === 0 ? (
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
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nombre</TableHead>
										<TableHead>Descripción</TableHead>
										<TableHead className="text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sectors.map((sector) => (
										<TableRow
											key={sector._id}
											className="cursor-pointer"
											onClick={() => handleEditRequest(sector)}
										>
											<TableCell className="font-medium">
												<div className="flex items-center gap-2">
													<MapPinIcon className="size-4 text-muted-foreground" />
													{sector.name}
												</div>
											</TableCell>
											<TableCell>
												{sector.description ? (
													<span className="text-sm text-muted-foreground">
														{sector.description}
													</span>
												) : (
													<Badge variant="outline" size="sm">
														Sin descripción
													</Badge>
												)}
											</TableCell>
											<TableCell
												className="text-right"
												onClick={(e) => e.stopPropagation()}
											>
												<Button
													variant="ghost"
													size="icon"
													onMouseEnter={() =>
														void prefetchSectorDetailQueries(
															queryClient,
															sector._id,
														)
													}
													onFocus={() =>
														void prefetchSectorDetailQueries(
															queryClient,
															sector._id,
														)
													}
													onPointerDown={() =>
														void prefetchSectorDetailQueries(
															queryClient,
															sector._id,
														)
													}
													onClick={() => handleEditRequest(sector)}
												>
													<PencilIcon className="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-destructive hover:text-destructive"
													onClick={() =>
														handleDeleteRequest(sector._id, sector.name)
													}
												>
													<Trash2Icon className="size-4" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{editSector && (
				<DetailSectorDialog
					sector={editSector}
					open={editOpen}
					onOpenChange={setEditOpen}
				/>
			)}

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogPopup>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar sector</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingDelete && (
								<>
									¿Estás seguro de que deseas eliminar el sector{" "}
									<span className="font-semibold text-foreground">
										{pendingDelete.sectorName}
									</span>
									? Esta acción no se puede deshacer.
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogClose render={<Button variant="outline" />}>
							Cancelar
						</AlertDialogClose>
						<Button variant="destructive" onClick={handleConfirmDelete}>
							Eliminar
						</Button>
					</AlertDialogFooter>
				</AlertDialogPopup>
			</AlertDialog>
		</>
	);
}

export function SectorsSkeleton() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Gestionar Sectores</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			</CardContent>
		</Card>
	);
}
