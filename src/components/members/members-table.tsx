import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type {
	ColumnDef,
	Updater,
	VisibilityState,
} from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
	ArrowUp,
	EyeIcon,
	SearchIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ColumnVisibilityDropdown,
	DataTable,
	getColumnVisibilityForRole,
	type RoleVisibilityConfig,
	resolveColumnVisibility,
	saveColumnVisibility,
} from "@/components/data-table";
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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { type MemberData, useMembersList } from "@/hooks/use-members-list";
import { formatPhone } from "@/lib/utils";

import { DeleteMemberDialog } from "./delete-member-dialog";
import { EditMemberDialog } from "./edit-member-dialog";
import { FilterBar } from "./filter-bar";

const COLUMN_IDS = {
	name: "name",
	phone: "phone",
	address: "address",
	sector: "sector",
	email: "email",
	age: "age",
	childrenCount: "childrenCount",
	actions: "actions",
} as const;

const MEMBERS_TABLE_ID = "members-table";

const MEMBERS_VISIBILITY_CONFIG: RoleVisibilityConfig = {
	allColumnIds: Object.values(COLUMN_IDS),
	alwaysVisible: [COLUMN_IDS.name, COLUMN_IDS.actions],
	roles: {
		admin: [
			COLUMN_IDS.name,
			COLUMN_IDS.phone,
			COLUMN_IDS.address,
			COLUMN_IDS.sector,
			COLUMN_IDS.email,
			COLUMN_IDS.age,
			COLUMN_IDS.childrenCount,
			COLUMN_IDS.actions,
		],
		user: [
			COLUMN_IDS.name,
			COLUMN_IDS.address,
			COLUMN_IDS.sector,
			COLUMN_IDS.actions,
		],
	},
};

const COLUMN_LABELS: Record<string, string> = {
	[COLUMN_IDS.name]: "Nombre",
	[COLUMN_IDS.phone]: "Teléfono",
	[COLUMN_IDS.address]: "Dirección",
	[COLUMN_IDS.sector]: "Sector",
	[COLUMN_IDS.email]: "Email",
	[COLUMN_IDS.age]: "Edad",
	[COLUMN_IDS.childrenCount]: "Hijos",
	[COLUMN_IDS.actions]: "Acciones",
};

function useMembersColumns(
	onEdit: (member: MemberData) => void,
	onDelete: (member: MemberData) => void,
	sectorNameById: Map<string, string>,
	canReadSectors: boolean,
): ColumnDef<MemberData>[] {
	return useMemo(
		(): ColumnDef<MemberData>[] => [
			{
				id: COLUMN_IDS.name,
				accessorKey: "fullName",
				header: "Nombre",
				cell: ({ getValue }) => (
					<span className="font-medium">{getValue<string>()}</span>
				),
				enableHiding: false,
			},
			{
				id: COLUMN_IDS.phone,
				accessorKey: "phone",
				header: "Teléfono",
				cell: ({ getValue }) => formatPhone(getValue<string>()),
			},
			{
				id: COLUMN_IDS.address,
				accessorKey: "address",
				header: "Dirección",
			},
			{
				id: COLUMN_IDS.sector,
				accessorKey: "sectorId",
				header: "Sector",
				cell: ({ getValue }) => {
					const sectorId = getValue<MemberData["sectorId"]>();
					if (!sectorId) {
						return <span className="text-muted-foreground">Sin sector</span>;
					}

					const sectorName = sectorNameById.get(sectorId);
					if (sectorName) {
						return sectorName;
					}

					return canReadSectors ? "Sector no disponible" : "Sector asignado";
				},
			},
			{
				id: COLUMN_IDS.email,
				accessorKey: "email",
				header: "Email",
				cell: ({ getValue }) => getValue<string>() || "-",
			},
			{
				id: COLUMN_IDS.age,
				accessorKey: "age",
				header: "Edad",
				cell: ({ getValue }) => getValue<number | null>() ?? "-",
			},
			{
				id: COLUMN_IDS.childrenCount,
				accessorKey: "childrenCount",
				header: "Hijos",
				cell: ({ getValue }) => getValue<number | null>() ?? "-",
			},
			{
				id: COLUMN_IDS.actions,
				header: () => <span className="sr-only">Acciones</span>,
				meta: {
					headerClassName: "text-right",
					cellClassName: "text-right",
				},
				enableHiding: false,
				cell: ({ row }) => {
					const member = row.original;
					return (
						<div className="flex justify-end gap-1">
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(member);
								}}
								aria-label="Ver"
							>
								<EyeIcon className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(member);
								}}
								aria-label="Eliminar"
							>
								<Trash2Icon className="size-4" />
							</Button>
						</div>
					);
				},
			},
		],
		[onEdit, onDelete, sectorNameById, canReadSectors],
	);
}

export function MembersTable() {
	const {
		members,
		totalCount,
		isLoading,
		search,
		setSearch,
		showJumpToTop,
		handleJumpToTop,
		filteredCount,
		filters,
		filterOptions,
	} = useMembersList();

	const { data: currentUser } = useSuspenseQuery(
		convexQuery(api.users.getCurrentUserWithRole, {}),
	);
	const role = currentUser?.role ?? "user";
	const canReadSectors = role === "admin" || role === "leader";

	const { data: sectors = [] } = useQuery({
		...convexQuery(api.sectors.listSectors, {}),
		enabled: canReadSectors,
	});

	const [editMember, setEditMember] = useState<MemberData | null>(null);
	const [deleteMember, setDeleteMember] = useState<MemberData | null>(null);

	const handleEditOpen = useCallback((member: MemberData) => {
		setEditMember(member);
	}, []);

	const handleDeleteOpen = useCallback((member: MemberData) => {
		setDeleteMember(member);
	}, []);

	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		() => getColumnVisibilityForRole(role, MEMBERS_VISIBILITY_CONFIG),
	);

	useEffect(() => {
		setColumnVisibility(
			resolveColumnVisibility(
				role,
				MEMBERS_TABLE_ID,
				MEMBERS_VISIBILITY_CONFIG,
			),
		);
	}, [role]);

	const handleColumnVisibilityChange = useCallback(
		(updaterOrValue: Updater<VisibilityState>) => {
			setColumnVisibility((prev) => {
				const next =
					typeof updaterOrValue === "function"
						? updaterOrValue(prev)
						: updaterOrValue;
				saveColumnVisibility(MEMBERS_TABLE_ID, role, next);
				return next;
			});
		},
		[role],
	);

	const sectorNameById = useMemo(
		() => new Map(sectors.map((sector) => [sector._id, sector.name] as const)),
		[sectors],
	);

	const columns = useMembersColumns(
		handleEditOpen,
		handleDeleteOpen,
		sectorNameById,
		canReadSectors,
	);

	const table = useReactTable({
		data: members,
		columns,
		getCoreRowModel: getCoreRowModel(),
		state: { columnVisibility },
		onColumnVisibilityChange: handleColumnVisibilityChange,
		getRowId: (row) => row._id,
	});

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div className="flex items-center gap-3">
							<CardTitle>Listado de Miembros</CardTitle>
							{totalCount > 0 && (
								<Badge variant="info" size="lg">
									<UsersIcon className="size-3.5" />
									{filteredCount} de {totalCount}
								</Badge>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<InputGroup className="w-full sm:w-56">
								<InputGroupAddon align="inline-start">
									<SearchIcon />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Buscar por nombre..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</InputGroup>
							<FilterBar filters={filters} filterOptions={filterOptions} />
							<ColumnVisibilityDropdown
								table={table}
								columnLabels={COLUMN_LABELS}
							/>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading && totalCount === 0 ? (
					<TableSkeleton />
				) : members.length === 0 ? (
					<EmptyState search={search} />
				) : (
					<DataTable
						table={table}
						onRowClick={(row) => handleEditOpen(row.original)}
					/>
				)}
			</CardContent>

			{showJumpToTop && (
				<Button
					onClick={handleJumpToTop}
					variant="secondary"
					size="icon"
					className="fixed bottom-4 right-4 shadow-lg z-50"
					aria-label="Volver arriba"
				>
					<ArrowUp className="size-4" />
				</Button>
			)}

			{editMember && (
				<EditMemberDialog
					member={editMember}
					open={true}
					onOpenChange={(open) => {
						if (!open) setEditMember(null);
					}}
				/>
			)}
			{deleteMember && (
				<DeleteMemberDialog
					member={deleteMember}
					open={true}
					onOpenChange={(open) => {
						if (!open) setDeleteMember(null);
					}}
				/>
			)}
		</Card>
	);
}

function TableSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-12 w-full" />
			<Skeleton className="h-12 w-full" />
			<Skeleton className="h-12 w-full" />
			<Skeleton className="h-12 w-full" />
			<Skeleton className="h-12 w-full" />
		</div>
	);
}

function EmptyState({ search }: { search: string }) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<UsersIcon />
				</EmptyMedia>
				<EmptyTitle>
					{search ? "No se encontraron miembros" : "Sin miembros registrados"}
				</EmptyTitle>
				<EmptyDescription>
					{search
						? `No hay miembros que coincidan con "${search}"`
						: "Comienza agregando miembros usando el botón de arriba"}
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
