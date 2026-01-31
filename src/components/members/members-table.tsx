import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, SearchIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
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
import { toastManager } from "@/components/ui/toast";
import {
	NumberFieldForm,
	SubmitButton,
	TextareaField,
	TextField,
} from "@/lib/form-fields";

// ============================================================================
// Members Table Component
// ============================================================================

export function MembersTable() {
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>(
		[],
	);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setCursor(undefined);
			setCursorHistory([]);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const { data, isLoading, isError } = useQuery(
		convexQuery(api.members.list, {
			cursor,
			search: debouncedSearch || undefined,
		}),
	);

	const handlePrevPage = () => {
		if (cursorHistory.length > 0) {
			const newHistory = [...cursorHistory];
			const prevCursor = newHistory.pop();
			setCursorHistory(newHistory);
			setCursor(prevCursor);
		}
	};

	const handleNextPage = () => {
		if (data?.nextCursor) {
			setCursorHistory([...cursorHistory, cursor]);
			setCursor(data.nextCursor);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<CardTitle>Listado de Miembros</CardTitle>
					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Buscar por nombre..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<TableSkeleton />
				) : isError ? (
					<ErrorState />
				) : !data?.members || data.members.length === 0 ? (
					<EmptyState search={debouncedSearch} />
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
									{data.members.map((member) => (
										<MemberRow key={member._id} member={member} />
									))}
								</TableBody>
							</Table>
						</div>

						{/* Pagination */}
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
							<p className="text-sm text-muted-foreground">
								Página {data.currentPage} de {data.totalPages} (
								{data.totalCount} miembros)
							</p>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={handlePrevPage}
											className={
												cursorHistory.length === 0
													? "pointer-events-none opacity-50"
													: "cursor-pointer"
											}
										/>
									</PaginationItem>
									<PaginationItem>
										<PaginationNext
											onClick={handleNextPage}
											className={
												!data.hasMore
													? "pointer-events-none opacity-50"
													: "cursor-pointer"
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}

// ============================================================================
// Member Row Component
// ============================================================================

interface MemberData {
	_id: Id<"members">;
	fullName: string;
	phone: string;
	address: string;
	email?: string;
	age?: number;
	childrenCount?: number;
	firstVisitDate?: number;
	notes?: string;
}

interface MemberRowProps {
	member: MemberData;
}

function MemberRow({ member }: MemberRowProps) {
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	return (
		<>
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
							onClick={() => setEditOpen(true)}
							aria-label="Editar"
						>
							<PencilIcon className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={() => setDeleteOpen(true)}
							aria-label="Eliminar"
						>
							<Trash2Icon className="size-4" />
						</Button>
					</div>
				</TableCell>
			</TableRow>

			<EditMemberDialog
				member={member}
				open={editOpen}
				onOpenChange={setEditOpen}
			/>
			<DeleteMemberDialog
				member={member}
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
			/>
		</>
	);
}

// ============================================================================
// Edit Member Dialog
// ============================================================================

interface EditMemberDialogProps {
	member: MemberData;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function EditMemberDialog({
	member,
	open,
	onOpenChange,
}: EditMemberDialogProps) {
	const queryClient = useQueryClient();
	const updateMember = useConvexMutation(api.members.updateMember);
	const mutation = useMutation({
		mutationFn: updateMember,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: convexQuery(api.members.list, {}).queryKey,
			});
		},
	});

	const form = useForm({
		defaultValues: {
			fullName: member.fullName,
			phone: member.phone,
			address: member.address,
			email: member.email ?? "",
			age: member.age,
			childrenCount: member.childrenCount,
			firstVisitDate: member.firstVisitDate,
			notes: member.notes ?? "",
		},
		onSubmit: async ({ value }) => {
			try {
				await mutation.mutateAsync({
					id: member._id,
					fullName: value.fullName,
					phone: value.phone,
					address: value.address,
					email:
						value.email && value.email.trim() !== "" ? value.email : undefined,
					age: value.age,
					childrenCount: value.childrenCount,
					firstVisitDate: value.firstVisitDate,
					notes:
						value.notes && value.notes.trim() !== "" ? value.notes : undefined,
				});
				onOpenChange(false);
				toastManager.add({
					title: "Miembro actualizado",
					type: "success",
				});
			} catch (error) {
				toastManager.add({
					title: "Error al actualizar el miembro",
					type: "error",
				});
				console.error(error);
			}
		},
	});

	// Reset form when member changes
	useEffect(() => {
		if (open) {
			form.reset();
			form.setFieldValue("fullName", member.fullName);
			form.setFieldValue("phone", member.phone);
			form.setFieldValue("address", member.address);
			form.setFieldValue("email", member.email ?? "");
			form.setFieldValue("age", member.age);
			form.setFieldValue("childrenCount", member.childrenCount);
			form.setFieldValue("firstVisitDate", member.firstVisitDate);
			form.setFieldValue("notes", member.notes ?? "");
		}
	}, [open, member, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar Miembro</DialogTitle>
					<DialogDescription>
						Modifica la información del miembro
					</DialogDescription>
				</DialogHeader>
				<DialogPanel>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<form.Field
							name="fullName"
							validators={{
								onChange: z.string().min(1, "El nombre es requerido"),
							}}
						>
							{(field: AnyFieldApi) => (
								<TextField
									field={field}
									label="Nombre completo *"
									inputProps={{ placeholder: "Juan Pérez" }}
								/>
							)}
						</form.Field>

						<form.Field
							name="phone"
							validators={{
								onChange: z.string().min(1, "El teléfono es requerido"),
							}}
						>
							{(field: AnyFieldApi) => (
								<TextField
									field={field}
									label="Teléfono *"
									inputProps={{ placeholder: "+52 555 123 4567", type: "tel" }}
								/>
							)}
						</form.Field>

						<form.Field
							name="address"
							validators={{
								onChange: z.string().min(1, "La dirección es requerida"),
							}}
						>
							{(field: AnyFieldApi) => (
								<TextField
									field={field}
									label="Dirección *"
									inputProps={{ placeholder: "Calle 123, Col. Centro" }}
								/>
							)}
						</form.Field>

						<form.Field
							name="email"
							validators={{
								onChange: z.string().email("Email inválido").or(z.literal("")),
							}}
						>
							{(field: AnyFieldApi) => (
								<TextField
									field={field}
									label="Email"
									inputProps={{
										placeholder: "correo@ejemplo.com",
										type: "email",
									}}
								/>
							)}
						</form.Field>

						<div className="grid grid-cols-2 gap-4">
							<form.Field name="age">
								{(field: AnyFieldApi) => (
									<NumberFieldForm
										field={field}
										label="Edad"
										min={0}
										max={120}
									/>
								)}
							</form.Field>

							<form.Field name="childrenCount">
								{(field: AnyFieldApi) => (
									<NumberFieldForm
										field={field}
										label="Número de hijos"
										min={0}
										max={20}
									/>
								)}
							</form.Field>
						</div>

						<form.Field name="notes">
							{(field: AnyFieldApi) => (
								<TextareaField
									field={field}
									label="Notas"
									textareaProps={{ placeholder: "Información adicional..." }}
								/>
							)}
						</form.Field>
					</form>
				</DialogPanel>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancelar
					</DialogClose>
					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<SubmitButton
								canSubmit={canSubmit}
								isSubmitting={isSubmitting}
								submittingText="Guardando..."
								onClick={() => form.handleSubmit()}
							>
								Guardar cambios
							</SubmitButton>
						)}
					</form.Subscribe>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ============================================================================
// Delete Member Dialog
// ============================================================================

interface DeleteMemberDialogProps {
	member: MemberData;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function DeleteMemberDialog({
	member,
	open,
	onOpenChange,
}: DeleteMemberDialogProps) {
	const queryClient = useQueryClient();
	const deleteMember = useConvexMutation(api.members.deleteMember);
	const mutation = useMutation({
		mutationFn: deleteMember,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: convexQuery(api.members.list, {}).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: convexQuery(api.members.count, {}).queryKey,
			});
		},
	});

	const handleDelete = async () => {
		try {
			await mutation.mutateAsync({ id: member._id });
			onOpenChange(false);
			toastManager.add({
				title: "Miembro eliminado",
				type: "success",
			});
		} catch (error) {
			toastManager.add({
				title: "Error al eliminar el miembro",
				type: "error",
			});
			console.error(error);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Eliminar miembro</AlertDialogTitle>
					<AlertDialogDescription>
						¿Estás seguro de que deseas eliminar a{" "}
						<strong>{member.fullName}</strong>? Esta acción no se puede
						deshacer.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose render={<Button variant="outline" />}>
						Cancelar
					</AlertDialogClose>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={mutation.isPending}
					>
						{mutation.isPending && <Spinner className="size-4" />}
						Eliminar
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// ============================================================================
// State Components
// ============================================================================

function TableSkeleton() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 5 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no unique id
				<Skeleton key={`table-skeleton-${i}`} className="h-12 w-full" />
			))}
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

function ErrorState() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyTitle>Error al cargar los miembros</EmptyTitle>
				<EmptyDescription>
					Ocurrió un error al cargar la lista de miembros. Por favor, intenta de
					nuevo.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
