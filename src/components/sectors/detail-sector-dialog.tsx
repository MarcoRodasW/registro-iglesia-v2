import { api } from "@convex/api";
import type { Doc, Id } from "@convex/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
	type QueryClient,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	MapPinIcon,
	PhoneIcon,
	PlusIcon,
	ShieldIcon,
	UserMinusIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogPanel,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toastManager } from "@/components/ui/toast";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatPhone } from "@/lib/utils";
import {
	EmptyLeaders,
	EmptyMembers,
} from "./detail-sector-dialog/empty-states";
import { LeaderEditPanel } from "./detail-sector-dialog/leader-edit-panel";
import { MemberSearchPanel } from "./detail-sector-dialog/member-search-panel";
import {
	LeadersListSkeleton,
	MembersTableSkeleton,
} from "./detail-sector-dialog/skeletons";
import type { LeaderOption } from "./detail-sector-dialog/types";
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
	const setSectorLeadersMutation = useConvexMutation(
		api.sectors.setSectorLeaders,
	);
	const assignMembersMutation = useConvexMutation(
		api.sectors.assignMembersToSector,
	);
	const removeMembersMutation = useConvexMutation(
		api.sectors.removeMembersFromSector,
	);

	const [leaderPanelOpen, setLeaderPanelOpen] = useState(false);
	const [memberPanelOpen, setMemberPanelOpen] = useState(false);

	const [leaderSearch, setLeaderSearch] = useState("");
	const [pendingLeaderIds, setPendingLeaderIds] = useState<string[]>([]);
	const [isSavingLeaders, setIsSavingLeaders] = useState(false);

	const [memberSearch, setMemberSearch] = useState("");
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
	const [isAssigningMembers, setIsAssigningMembers] = useState(false);

	const sectorDetailQuery = convexQuery(api.sectors.getSector, {
		sectorId: sector._id,
	});
	const sectorsQuery = convexQuery(api.sectors.listSectors, {});

	const { data: sectorDetail, isLoading: detailLoading } = useQuery({
		...sectorDetailQuery,
		enabled: open,
	});

	const { data: assignableLeaders = [] } = useQuery({
		...convexQuery(api.users.listAssignableLeaders, {
			sectorId: sector._id,
			search: leaderSearch || undefined,
		}),
		enabled: open && leaderPanelOpen,
		placeholderData: (previous) => previous,
	});

	const { data: availableMembers = [], isFetching: searchingMembers } =
		useQuery({
			...convexQuery(api.sectors.searchMembersNotInSector, {
				search: memberSearch || undefined,
				limit: 20,
			}),
			enabled: open && memberPanelOpen,
			placeholderData: (previous) => previous,
		});

	const members = sectorDetail?.members ?? [];
	const sectorLeaders = sectorDetail?.leaders ?? [];

	const leaderItems = useMemo<LeaderOption[]>(() => {
		const merged = [
			...sectorLeaders.map((leader) => ({
				value: leader._id,
				label: leader.name,
			})),
			...assignableLeaders.map((leader) => ({
				value: leader._id,
				label: leader.name,
			})),
		];

		return [...new Map(merged.map((item) => [item.value, item])).values()];
	}, [assignableLeaders, sectorLeaders]);

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

					return current.map((item) =>
						item._id === sector._id ? { ...item, name, description } : item,
					);
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

	const handleSaveSectorField = useCallback(
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

	const handleOpenLeaderPanel = useCallback(() => {
		setPendingLeaderIds(sectorLeaders.map((leader) => leader._id));
		setLeaderSearch("");
		setLeaderPanelOpen(true);
	}, [sectorLeaders]);

	const handleCloseLeaderPanel = useCallback(() => {
		setLeaderPanelOpen(false);
		setPendingLeaderIds([]);
		setLeaderSearch("");
	}, []);

	const handleSaveLeaders = useCallback(async () => {
		setIsSavingLeaders(true);
		try {
			await setSectorLeadersMutation({
				sectorId: sector._id,
				leaderIds: pendingLeaderIds as Id<"users">[],
			});

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: sectorDetailQuery.queryKey }),
				queryClient.invalidateQueries({ queryKey: sectorsQuery.queryKey }),
			]);

			toastManager.add({
				title: "Líderes actualizados correctamente",
				type: "success",
			});
			setLeaderPanelOpen(false);
		} catch {
			toastManager.add({ title: "Error al actualizar líderes", type: "error" });
		} finally {
			setIsSavingLeaders(false);
		}
	}, [
		pendingLeaderIds,
		sector._id,
		setSectorLeadersMutation,
		queryClient,
		sectorDetailQuery.queryKey,
		sectorsQuery.queryKey,
	]);

	const handleOpenMemberPanel = useCallback(() => {
		setSelectedMemberIds([]);
		setMemberSearch("");
		setMemberPanelOpen(true);
	}, []);

	const handleCloseMemberPanel = useCallback(() => {
		setMemberPanelOpen(false);
		setSelectedMemberIds([]);
		setMemberSearch("");
	}, []);

	const toggleMemberSelection = useCallback((memberId: string) => {
		setSelectedMemberIds((previous) =>
			previous.includes(memberId)
				? previous.filter((id) => id !== memberId)
				: [...previous, memberId],
		);
	}, []);

	const handleAssignMembers = useCallback(async () => {
		if (selectedMemberIds.length === 0) {
			return;
		}

		setIsAssigningMembers(true);
		try {
			await assignMembersMutation({
				sectorId: sector._id,
				memberIds: selectedMemberIds as Id<"members">[],
			});

			await queryClient.invalidateQueries({
				queryKey: sectorDetailQuery.queryKey,
			});
			toastManager.add({
				title: `${selectedMemberIds.length} miembro${selectedMemberIds.length > 1 ? "s" : ""} asignado${selectedMemberIds.length > 1 ? "s" : ""}`,
				type: "success",
			});
			handleCloseMemberPanel();
		} catch {
			toastManager.add({ title: "Error al asignar miembros", type: "error" });
		} finally {
			setIsAssigningMembers(false);
		}
	}, [
		selectedMemberIds,
		sector._id,
		assignMembersMutation,
		queryClient,
		sectorDetailQuery.queryKey,
		handleCloseMemberPanel,
	]);

	const handleRemoveMember = useCallback(
		async (memberId: string) => {
			try {
				await removeMembersMutation({ memberIds: [memberId as Id<"members">] });
				await queryClient.invalidateQueries({
					queryKey: sectorDetailQuery.queryKey,
				});
			} catch {
				toastManager.add({
					title: "Error al quitar el miembro",
					type: "error",
				});
			}
		},
		[removeMembersMutation, queryClient, sectorDetailQuery.queryKey],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[92vh] sm:min-h-[72vh] max-sm:min-h-[65vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DetailSectorForm
						name={sector.name}
						description={sector.description ?? ""}
						onSave={handleSaveSectorField}
					/>
				</DialogHeader>

				<DialogPanel className="flex-1 overflow-hidden" scrollFade={false}>
					<div className="grid grid-cols-1 md:grid-cols-[1fr_300px] h-full min-h-0">
						<div className="flex flex-col min-h-0 max-md:border-b md:border-r border-border/50">
							<div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/30">
								<UsersIcon className="size-3.5 text-muted-foreground" />
								<h3 className="text-sm font-semibold tracking-tight">
									Miembros asignados
								</h3>
								<Badge variant="outline" size="sm">
									{members.length}
								</Badge>
								<div className="ml-auto">
									{memberPanelOpen ? (
										<Button
											size="xs"
											variant="ghost"
											onClick={handleCloseMemberPanel}
											className="gap-1 text-muted-foreground"
										>
											<XIcon className="size-3" />
											Cancelar
										</Button>
									) : (
										<Button
											size="xs"
											variant="outline"
											onClick={handleOpenMemberPanel}
											className="gap-1"
										>
											<PlusIcon className="size-3" />
											Agregar
										</Button>
									)}
								</div>
							</div>

							{memberPanelOpen ? (
								<MemberSearchPanel
									members={availableMembers}
									isSearching={searchingMembers}
									search={memberSearch}
									onSearchChange={setMemberSearch}
									selectedIds={selectedMemberIds}
									onToggle={toggleMemberSelection}
									onAssign={handleAssignMembers}
									isAssigning={isAssigningMembers}
								/>
							) : null}

							<ScrollArea className="flex-1 max-md:max-h-[38vh]">
								{detailLoading ? (
									<MembersTableSkeleton />
								) : members.length > 0 ? (
									<TooltipProvider>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="pl-4">Nombre</TableHead>
													<TableHead>Teléfono</TableHead>
													<TableHead className="pr-2">Dirección</TableHead>
													<TableHead className="w-8 pr-3" />
												</TableRow>
											</TableHeader>
											<TableBody>
												{members.map((member) => (
													<TableRow key={member._id} className="group">
														<TableCell className="pl-4 font-medium">
															{member.fullName}
														</TableCell>
														<TableCell className="tabular-nums text-muted-foreground">
															<span className="inline-flex items-center gap-1.5">
																<PhoneIcon className="size-3 shrink-0" />
																{formatPhone(member.phone)}
															</span>
														</TableCell>
														<TableCell className="pr-2 text-muted-foreground max-w-44 truncate">
															<span className="inline-flex items-center gap-1.5">
																<MapPinIcon className="size-3 shrink-0" />
																<span className="truncate">
																	{member.address}
																</span>
															</span>
														</TableCell>
														<TableCell className="pr-3">
															<Tooltip>
																<TooltipTrigger
																	className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
																	render={
																		<Button
																			size="icon-xs"
																			variant="ghost"
																			className="text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/8"
																			onClick={() =>
																				handleRemoveMember(member._id)
																			}
																		/>
																	}
																>
																	<UserMinusIcon className="size-3.5" />
																</TooltipTrigger>
																<TooltipContent>
																	Quitar del sector
																</TooltipContent>
															</Tooltip>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TooltipProvider>
								) : (
									<EmptyMembers onAdd={handleOpenMemberPanel} />
								)}
							</ScrollArea>
						</div>

						<div className="flex flex-col min-h-0">
							<div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/30">
								<ShieldIcon className="size-3.5 text-muted-foreground" />
								<h3 className="text-sm font-semibold tracking-tight">
									Líderes
								</h3>
								<Badge variant="outline" size="sm">
									{sectorLeaders.length}
								</Badge>
								<div className="ml-auto">
									{leaderPanelOpen ? (
										<Button
											size="xs"
											variant="ghost"
											onClick={handleCloseLeaderPanel}
											className="gap-1 text-muted-foreground"
										>
											<XIcon className="size-3" />
											Cancelar
										</Button>
									) : (
										<Button
											size="xs"
											variant="outline"
											onClick={handleOpenLeaderPanel}
										>
											Gestionar
										</Button>
									)}
								</div>
							</div>

							{leaderPanelOpen ? (
								<LeaderEditPanel
									leaderItems={leaderItems}
									pendingIds={pendingLeaderIds}
									onChange={setPendingLeaderIds}
									onSave={handleSaveLeaders}
									isSaving={isSavingLeaders}
									onLeaderSearchChange={setLeaderSearch}
								/>
							) : null}

							<ScrollArea className="flex-1 max-md:max-h-[28vh]">
								{detailLoading ? (
									<LeadersListSkeleton />
								) : sectorLeaders.length > 0 ? (
									<ul className="divide-y divide-border/40">
										{sectorLeaders.map((leader) => (
											<li
												key={leader._id}
												className="flex items-center gap-3 px-4 py-2.5"
											>
												<Avatar className="size-7 shrink-0">
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
									<EmptyLeaders onManage={handleOpenLeaderPanel} />
								)}
							</ScrollArea>
						</div>
					</div>
				</DialogPanel>
			</DialogContent>
		</Dialog>
	);
}

export function prefetchSectorDetailQueries(
	queryClient: QueryClient,
	sectorId: Id<"sectors">,
) {
	return queryClient.prefetchQuery(
		convexQuery(api.sectors.getSector, {
			sectorId,
		}),
	);
}
