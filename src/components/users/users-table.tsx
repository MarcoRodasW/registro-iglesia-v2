import { api } from "@convex/api";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { CrownIcon, ShieldIcon, UserIcon, UsersIcon } from "lucide-react";
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
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

type UserRole = "admin" | "leader" | "user";

interface PendingRoleChange {
	userId: string;
	userName: string;
	currentRole: UserRole;
	newRole: UserRole;
}

const ROLE_LABELS = {
	admin: "Admin",
	leader: "Líder",
	user: "Usuario",
} as const;

export function UsersTable() {
	const queryClient = useQueryClient();
	const { data: users } = useSuspenseQuery(
		convexQuery(api.users.listUsers, {}),
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
			await queryClient.invalidateQueries({
				queryKey: convexQuery(api.users.listUsers, {}).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: convexQuery(api.users.getCurrentUserWithRole, {}).queryKey,
			});
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

	const handleRoleChangeRequest = (
		userId: string,
		userName: string,
		currentRole: UserRole,
		newRole: UserRole,
	) => {
		setPendingChange({ userId, userName, currentRole, newRole });
		setConfirmOpen(true);
	};

	const handleConfirmRoleChange = () => {
		if (!pendingChange) return;
		setUserRole.mutate({
			userId: pendingChange.userId as Parameters<
				typeof setUserRoleMutation
			>[0]["userId"],
			role: pendingChange.newRole,
		});
		setConfirmOpen(false);
		setPendingChange(null);
	};

	const roleLabel = (role: UserRole) => ROLE_LABELS[role];

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Gestionar Usuarios</CardTitle>
				</CardHeader>
				<CardContent>
					{!users || users.length === 0 ? (
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
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nombre</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Rol</TableHead>
										<TableHead className="text-right">Cambiar Rol</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.map((user) => {
										const isSelf = currentUser?.appUserId === user._id;
										return (
											<TableRow key={user._id}>
												<TableCell className="font-medium">
													<div className="flex items-center gap-2">
														{user.role === "admin" ? (
															<ShieldIcon className="size-4 text-amber-500" />
														) : user.role === "leader" ? (
															<CrownIcon className="size-4 text-purple-500" />
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
												</TableCell>
												<TableCell>{user.email}</TableCell>
												<TableCell>
													<Badge
														variant={
															user.role === "admin"
																? "warning"
																: user.role === "leader"
																	? "default"
																	: "secondary"
														}
													>
														{roleLabel(user.role)}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<RoleSelect
														currentRole={user.role}
														disabled={isSelf || setUserRole.isPending}
														onRoleChange={(newRole) =>
															handleRoleChangeRequest(
																user._id,
																user.name,
																user.role,
																newRole,
															)
														}
													/>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
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
										<span className="block mt-2 text-amber-600 dark:text-amber-400">
											Los administradores tienen acceso completo al sistema,
											incluyendo la gestión de usuarios.
										</span>
									)}
									{pendingChange.newRole === "leader" && (
										<span className="block mt-2 text-purple-600 dark:text-purple-400">
											Los líderes pueden gestionar miembros y realizar acciones
											de moderación.
										</span>
									)}
									{pendingChange.currentRole === "admin" &&
										pendingChange.newRole !== "admin" && (
											<span className="block mt-2 text-amber-600 dark:text-amber-400">
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
			defaultValue={currentRole}
			onValueChange={(value) => {
				if (value !== currentRole) {
					onRoleChange(value as UserRole);
				}
			}}
			disabled={disabled}
		>
			<SelectTrigger size="sm" className="w-32 ml-auto">
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
