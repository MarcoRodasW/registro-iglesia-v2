import {
	ArrowUp,
	EyeIcon,
	SearchIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

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
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type MemberData, useMembersList } from "@/hooks/use-members-list";
import { DeleteMemberDialog } from "./delete-member-dialog";
import { EditMemberDialog } from "./edit-member-dialog";

export function MembersTable() {
	const {
		members,
		totalCount,
		isLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		search,
		setSearch,
		showJumpToTop,
		handleJumpToTop,
		loadMoreRef,
		totalLoaded,
	} = useMembersList();

	const [editMember, setEditMember] = useState<MemberData | null>(null);
	const [deleteMember, setDeleteMember] = useState<MemberData | null>(null);

	const handleEditOpen = useCallback((member: MemberData) => {
		setEditMember(member);
	}, []);

	const handleDeleteOpen = useCallback((member: MemberData) => {
		setDeleteMember(member);
	}, []);

	const handleLoadMore = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<CardTitle>Listado de Miembros</CardTitle>
					<InputGroup className="w-full sm:w-64">
						<InputGroupAddon align="inline-start">
							<SearchIcon />
						</InputGroupAddon>
						<InputGroupInput
							placeholder="Buscar por nombre..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</InputGroup>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading && totalLoaded === 0 ? (
					<TableSkeleton />
				) : members.length === 0 ? (
					<EmptyState search={search} />
				) : (
					<>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nombre</TableHead>
										<TableHead>Teléfono</TableHead>
										<TableHead className="hidden md:table-cell">
											Dirección
										</TableHead>
										<TableHead className="hidden lg:table-cell">
											Email
										</TableHead>
										<TableHead className="hidden lg:table-cell">Edad</TableHead>
										<TableHead className="hidden xl:table-cell">
											Hijos
										</TableHead>
										<TableHead className="text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{members.map((member) => (
										<MemberRow
											key={member._id}
											member={member}
											onEdit={handleEditOpen}
											onDelete={handleDeleteOpen}
										/>
									))}
									{isFetchingNextPage && <TableSkeletonRows />}
								</TableBody>
							</Table>
						</div>

						<div className="flex flex-col items-center gap-4 mt-6">
							<p className="text-sm text-muted-foreground">
								Mostrando {totalLoaded} de {totalCount} miembros
							</p>

							{hasNextPage ? (
								<Button
									onClick={handleLoadMore}
									disabled={isFetchingNextPage}
									variant="outline"
									size="default"
								>
									{isFetchingNextPage ? (
										<>
											<Spinner className="size-4 mr-2" />
											Cargando...
										</>
									) : (
										"Cargar más miembros"
									)}
								</Button>
							) : (
								<p className="text-sm text-muted-foreground">
									No hay más miembros para cargar
								</p>
							)}
						</div>

						<div ref={loadMoreRef} className="h-4" />
					</>
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

interface MemberRowProps {
	member: MemberData;
	onEdit: (member: MemberData) => void;
	onDelete: (member: MemberData) => void;
}

function MemberRow({ member, onEdit, onDelete }: MemberRowProps) {
	return (
		<TableRow>
			<TableCell className="font-medium">{member.fullName}</TableCell>
			<TableCell>{member.phone}</TableCell>
			<TableCell className="hidden md:table-cell">{member.address}</TableCell>
			<TableCell className="hidden lg:table-cell">
				{member.email || "-"}
			</TableCell>
			<TableCell className="hidden lg:table-cell">
				{member.age ?? "-"}
			</TableCell>
			<TableCell className="hidden xl:table-cell">
				{member.childrenCount ?? "-"}
			</TableCell>
			<TableCell className="text-right">
				<div className="flex justify-end gap-1">
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={() => onEdit(member)}
						aria-label="Ver"
					>
						<EyeIcon className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={() => onDelete(member)}
						aria-label="Eliminar"
					>
						<Trash2Icon className="size-4" />
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}

function TableSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton key="table-skeleton-1" className="h-12 w-full" />
			<Skeleton key="table-skeleton-2" className="h-12 w-full" />
			<Skeleton key="table-skeleton-3" className="h-12 w-full" />
			<Skeleton key="table-skeleton-4" className="h-12 w-full" />
			<Skeleton key="table-skeleton-5" className="h-12 w-full" />
		</div>
	);
}

function TableSkeletonRows() {
	return (
		<>
			<TableRow key="skeleton-row-1">
				<TableCell colSpan={7}>
					<Skeleton className="h-10 w-full" />
				</TableCell>
			</TableRow>
			<TableRow key="skeleton-row-2">
				<TableCell colSpan={7}>
					<Skeleton className="h-10 w-full" />
				</TableCell>
			</TableRow>
			<TableRow key="skeleton-row-3">
				<TableCell colSpan={7}>
					<Skeleton className="h-10 w-full" />
				</TableCell>
			</TableRow>
		</>
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
