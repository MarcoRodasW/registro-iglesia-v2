import { api } from "@convex/api";
import type { Doc } from "@convex/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPinIcon, PhoneIcon, ShieldIcon, UsersIcon } from "lucide-react";
import { useCallback } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogPanel,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toastManager } from "@/components/ui/toast";
import { cn, formatPhone } from "@/lib/utils";
import { DetailSectorForm } from "./detail-sector-form";

interface DetailSectorDialogProps {
	sector: Doc<"sectors">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DetailSectorDialog({
	sector,
	open,
	onOpenChange,
}: DetailSectorDialogProps) {
	const queryClient = useQueryClient();
	const updateSectorMutation = useConvexMutation(api.sectors.updateSector);

	const sectorsQuery = convexQuery(api.sectors.listSectors, {});

	const { data: members, isLoading: membersLoading } = useQuery({
		...convexQuery(api.members.listMembersBySector, {
			sectorId: sector._id,
		}),
		enabled: open,
	});

	const { data: sectorLeaders = [], isLoading: leadersLoading } = useQuery({
		...convexQuery(api.sectors.listLeadersBySector, {
			sectorId: sector._id,
		}),
		enabled: open,
	});

	const updateSector = useMutation({
		mutationFn: updateSectorMutation,
		onMutate: async ({ name, description }) => {
			await queryClient.cancelQueries({ queryKey: sectorsQuery.queryKey });

			const previousSectors = queryClient.getQueryData<Array<Doc<"sectors">>>(
				sectorsQuery.queryKey,
			);

			queryClient.setQueryData<Array<Doc<"sectors">>>(
				sectorsQuery.queryKey,
				(current) => {
					if (!current) {
						return current;
					}

					return current.map((item) => {
						if (item._id !== sector._id) {
							return item;
						}

						return {
							...item,
							name,
							description,
						};
					});
				},
			);

			return { previousSectors };
		},
		onError: (_error, _variables, context) => {
			queryClient.setQueryData(sectorsQuery.queryKey, context?.previousSectors);

			toastManager.add({
				title: "Error al actualizar el sector",
				type: "error",
			});
		},
		onSettled: async () => {
			await queryClient.invalidateQueries({ queryKey: sectorsQuery.queryKey });
		},
	});

	const handleSave = useCallback(
		(field: "name" | "description", value: string) => {
			if (field === "name") {
				const name = value.trim();
				if (name.length === 0 || name === sector.name) {
					return;
				}

				updateSector.mutate({
					sectorId: sector._id,
					name,
					description: sector.description,
				});
				return;
			}

			if (value === (sector.description ?? "")) {
				return;
			}

			updateSector.mutate({
				sectorId: sector._id,
				name: sector.name,
				description: value || undefined,
			});
		},
		[sector, updateSector],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] sm:min-h-[70vh] max-sm:min-h-[60vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DetailSectorForm
						name={sector.name}
						description={sector.description ?? ""}
						onSave={handleSave}
					/>
				</DialogHeader>

				<DialogPanel className="flex-1 overflow-hidden">
					<div className="grid grid-cols-1 md:grid-cols-[1fr_280px] h-full min-h-0">
						<div className="flex flex-col min-h-0 max-md:border-b md:border-r border-border/50">
							<div className="flex items-center gap-2 p-3 border-b border-border/40 bg-muted/30">
								<h3 className="text-sm font-semibold tracking-tight">
									Miembros asignados
								</h3>
								<UsersIcon className="size-4 text-muted-foreground" />
								<Badge variant="outline" size="sm">
									{members?.length ?? 0}
								</Badge>
							</div>

							<ScrollArea className="flex-1 max-md:max-h-[40vh]">
								{membersLoading ? (
									<MembersTableSkeleton />
								) : members && members.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="pl-4">Nombre</TableHead>
												<TableHead>Telefono</TableHead>
												<TableHead className="pr-4">Direccion</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{members.map((member) => (
												<TableRow key={member._id}>
													<TableCell className="pl-4 font-medium">
														{member.fullName}
													</TableCell>
													<TableCell className="tabular-nums text-muted-foreground">
														<span className="inline-flex items-center gap-1.5">
															<PhoneIcon className="size-3 shrink-0" />
															{formatPhone(member.phone)}
														</span>
													</TableCell>
													<TableCell className="pr-4 text-muted-foreground max-w-50 truncate">
														<span className="inline-flex items-center gap-1.5">
															<MapPinIcon className="size-3 shrink-0" />
															<span className="truncate">{member.address}</span>
														</span>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<div className="flex flex-col items-center justify-center py-12 text-center">
										<UsersIcon className="size-8 text-muted-foreground/40 mb-2" />
										<p className="text-sm text-muted-foreground">
											No hay miembros asignados a este sector.
										</p>
									</div>
								)}
							</ScrollArea>
						</div>

						<div className="flex flex-col min-h-0">
							<div className="flex items-center gap-2 p-3 border-b border-border/40 bg-muted/30">
								<h3 className="text-sm font-semibold tracking-tight">
									Lideres
								</h3>
								<ShieldIcon className="size-4 text-muted-foreground" />
								<Badge variant="outline" size="sm">
									{sectorLeaders.length}
								</Badge>
							</div>

							<ScrollArea className="flex-1 max-md:max-h-[30vh]">
								{leadersLoading ? (
									<LeadersListSkeleton />
								) : sectorLeaders.length > 0 ? (
									<ul className="divide-y divide-border/40">
										{sectorLeaders.map((leader) => (
											<li
												key={leader._id}
												className="flex items-center gap-3 px-4 py-2.5"
											>
												<Avatar className="size-7">
													<AvatarFallback
														className={cn(
															"text-[11px] font-semibold",
															"bg-primary/10 text-primary",
														)}
													>
														{leader.name
															.split(" ")
															.map((part) => part[0])
															.join("")
															.slice(0, 2)
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="min-w-0 flex-1">
													<p className="text-sm font-medium truncate">
														{leader.name}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														{leader.email}
													</p>
												</div>
											</li>
										))}
									</ul>
								) : (
									<div className="flex flex-col items-center justify-center py-8 text-center">
										<ShieldIcon className="size-6 text-muted-foreground/40 mb-1.5" />
										<p className="text-sm text-muted-foreground">
											Sin lideres asignados.
										</p>
									</div>
								)}
							</ScrollArea>
						</div>
					</div>
				</DialogPanel>
			</DialogContent>
		</Dialog>
	);
}

function MembersTableSkeleton() {
	return (
		<div className="p-4 space-y-3">
			<div className="flex gap-4">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-40" />
			</div>
			<div className="flex gap-4">
				<Skeleton className="h-4 w-28" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-36" />
			</div>
			<div className="flex gap-4">
				<Skeleton className="h-4 w-36" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-32" />
			</div>
			<div className="flex gap-4">
				<Skeleton className="h-4 w-30" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-44" />
			</div>
			<div className="flex gap-4">
				<Skeleton className="h-4 w-34" />
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-38" />
			</div>
		</div>
	);
}

function LeadersListSkeleton() {
	return (
		<div className="p-4 space-y-3">
			{Array.from({ length: 4 }).map((_, index) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: <Skeleton list>
					key={`leader-skeleton-${index}`}
					className="flex items-center gap-3"
				>
					<Skeleton className="size-7 rounded-full" />
					<div className="space-y-1.5 flex-1">
						<Skeleton className="h-3 w-32" />
						<Skeleton className="h-3 w-44" />
					</div>
				</div>
			))}
		</div>
	);
}
