import { api } from "@convex/api";
import type { Doc, Id } from "@convex/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { CrownIcon, ShieldIcon, UserIcon, UsersIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
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
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";

type UserRole = "admin" | "leader" | "user";
type UserData = Doc<"users">;
type UserId = Id<"users">;
type SectorId = Id<"sectors">;

const ROLE_LABELS = {
	admin: "Admin",
	leader: "Líder",
	user: "Usuario",
} as const;

const roleLabel = (role: UserRole) => ROLE_LABELS[role];

function isUserRole(value: string | null): value is UserRole {
	return value === "admin" || value === "leader" || value === "user";
}

interface PendingRoleChange {
	userId: UserId;
	userName: string;
	currentRole: UserRole;
	newRole: UserRole;
}

function useUsersColumns(
	currentAppUserId: string | null,
	sectorNameById: Map<SectorId, string>,
	onRoleChangeRequest: (
		userId: UserId,
		userName: string,
		currentRole: UserRole,
		newRole: UserRole,
	) => void,
	isRoleMutationPending: boolean,
): ColumnDef<UserData>[] {
	return useMemo(
		(): ColumnDef<UserData>[] => [
			{
				id: "name",
				accessorKey: "name",
				header: "Nombre",
				cell: ({ row }) => {
					const user = row.original;
					const isSelf = currentAppUserId === user._id;
					return (
						<div className="flex items-center gap-2 font-medium">
							{user.role === "admin" ? (
								<ShieldIcon className="size-4 text-amber-500" />
							) : user.role === "leader" ? (
								<CrownIcon className="size-4 text-violet-500" />
							) : (
								<UserIcon className="size-4 text-muted-foreground" />
							)}
							{user.name}
							{isSelf && (
								<Badge variant="outline" size="sm">
									Tú
								</Badge>
							)}
						</div>
					);
				},
			},
			{
				id: "email",
				accessorKey: "email",
				header: "Email",
			},
			{
				id: "sector",
				accessorKey: "sectorId",
				header: "Sector",
				cell: ({ getValue }) => {
					const sectorId = getValue<UserData["sectorId"]>();
					if (!sectorId) {
						return <span className="text-muted-foreground">Sin sector</span>;
					}

					return sectorNameById.get(sectorId) ?? "Sector no disponible";
				},
			},
			{
				id: "role",
				accessorKey: "role",
				header: "Rol",
				cell: ({ getValue }) => {
					const role = getValue<UserRole>();
					return (
						<Badge
							variant={
								role === "admin"
									? "warning"
									: role === "leader"
										? "default"
										: "secondary"
							}
						>
							{roleLabel(role)}
						</Badge>
					);
				},
			},
			{
				id: "changeRole",
				header: () => <span className="sr-only">Cambiar rol</span>,
				meta: {
					headerClassName: "text-right",
					cellClassName: "text-right",
				},
				cell: ({ row }) => {
					const user = row.original;
					const isSelf = currentAppUserId === user._id;
					return (
						<RoleSelect
							currentRole={user.role}
							disabled={isSelf || isRoleMutationPending}
							onRoleChange={(newRole) =>
								onRoleChangeRequest(user._id, user.name, user.role, newRole)
							}
						/>
					);
				},
			},
		],
		[
			currentAppUserId,
			sectorNameById,
			onRoleChangeRequest,
			isRoleMutationPending,
		],
	);
}

export function UsersTable() {
	const queryClient = useQueryClient();
	const { data: users } = useSuspenseQuery(
		convexQuery(api.users.listUsers, {}),
	);
	const { data: sectors } = useSuspenseQuery(
		convexQuery(api.sectors.listSectors, {}),
	);
	const { data: currentUser } = useSuspenseQuery(
		convexQuery(api.users.getCurrentUserWithRole, {}),
	);

	const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(
		null,
	);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const setUserRoleMutation = useConvexMutation(api.users.setUserRole);
	const setUserRole = useMutation({
		mutationFn: setUserRoleMutation,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: convexQuery(api.users.listUsers, {}).queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: convexQuery(api.users.getCurrentUserWithRole, {}).queryKey,
				}),
			]);
			toastManager.add({
				title: "Rol actualizado",
				type: "success",
			});
		},
		onError: (error) => {
			toastManager.add({
				title:
					error.message === "Cannot remove your own admin role"
						? "No puedes quitarte tu propio rol de admin"
						: "Error al actualizar el rol",
				type: "error",
			});
		},
	});

	const handleRoleChangeRequest = useCallback(
		(
			userId: UserId,
			userName: string,
			currentRole: UserRole,
			newRole: UserRole,
		) => {
			setPendingChange({ userId, userName, currentRole, newRole });
			setConfirmOpen(true);
		},
		[],
	);

	const handleConfirmRoleChange = useCallback(() => {
		if (!pendingChange) return;
		setUserRole.mutate({
			userId: pendingChange.userId,
			role: pendingChange.newRole,
		});
		setConfirmOpen(false);
		setPendingChange(null);
	}, [pendingChange, setUserRole]);

	const sectorNameById = useMemo(
		() => new Map(sectors.map((sector) => [sector._id, sector.name] as const)),
		[sectors],
	);

	const columns = useUsersColumns(
		currentUser?.appUserId ?? null,
		sectorNameById,
		handleRoleChangeRequest,
		setUserRole.isPending,
	);

	const table = useReactTable({
		data: users,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row._id,
	});

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Gestionar Usuarios</CardTitle>
				</CardHeader>
				<CardContent>
					{users.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<UsersIcon />
								</EmptyMedia>
								<EmptyTitle>Sin usuarios</EmptyTitle>
								<EmptyDescription>
									No hay usuarios registrados en el sistema.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<DataTable table={table} />
					)}
				</CardContent>
			</Card>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogPopup>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar cambio de rol</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingChange && (
								<>
									Cambiar el rol de{" "}
									<span className="font-semibold text-foreground">
										{pendingChange.userName}
									</span>{" "}
									de{" "}
									<span className="font-semibold text-foreground">
										{roleLabel(pendingChange.currentRole)}
									</span>{" "}
									a{" "}
									<span className="font-semibold text-foreground">
										{roleLabel(pendingChange.newRole)}
									</span>
									?
									{pendingChange.newRole === "admin" && (
										<span className="mt-2 block text-amber-600 dark:text-amber-400">
											Los administradores tienen acceso completo al sistema,
											incluyendo la gestión de usuarios.
										</span>
									)}
									{pendingChange.newRole === "leader" && (
										<span className="mt-2 block text-violet-600 dark:text-violet-400">
											Los líderes pueden gestionar miembros y realizar acciones
											de moderación.
										</span>
									)}
									{pendingChange.currentRole === "admin" &&
										pendingChange.newRole !== "admin" && (
											<span className="mt-2 block text-amber-600 dark:text-amber-400">
												Este usuario perderá todos los permisos de
												administrador.
											</span>
										)}
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogClose render={<Button variant="outline" />}>
							Cancelar
						</AlertDialogClose>
						<Button onClick={handleConfirmRoleChange}>Confirmar cambio</Button>
					</AlertDialogFooter>
				</AlertDialogPopup>
			</AlertDialog>
		</>
	);
}

function RoleSelect({
	currentRole,
	disabled,
	onRoleChange,
}: {
	currentRole: UserRole;
	disabled: boolean;
	onRoleChange: (role: UserRole) => void;
}) {
	return (
		<Select
			value={currentRole}
			onValueChange={(value) => {
				if (isUserRole(value) && value !== currentRole) {
					onRoleChange(value);
				}
			}}
			disabled={disabled}
		>
			<SelectTrigger size="sm" className="ml-auto w-32">
				<SelectValue />
			</SelectTrigger>
			<SelectPopup>
				<SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
				<SelectItem value="leader">{ROLE_LABELS.leader}</SelectItem>
				<SelectItem value="user">{ROLE_LABELS.user}</SelectItem>
			</SelectPopup>
		</Select>
	);
}

export function UsersSkeleton() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Gestionar Usuarios</CardTitle>
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
