import { api } from "@convex/api";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { toastManager } from "@/components/ui/toast";
import {
	NumberFieldForm,
	SubmitButton,
	TextareaField,
	TextField,
} from "@/lib/form-fields";
import {
	clearDraft,
	emptyMemberRow,
	loadDraft,
	type MemberFormData,
	membersArraySchema,
	saveDraft,
} from "@/lib/member-schema";

// ============================================================================
// Bulk Add Members Dialog
// ============================================================================

export function BulkAddMembersDialog() {
	const [open, setOpen] = useState(false);
	const formId = useId();
	const queryClient = useQueryClient();

	// Estado para rastrear qué miembros ya fueron guardados (por índice)
	const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
	// Estado para rastrear qué miembro se está guardando actualmente
	const [savingIndex, setSavingIndex] = useState<number | null>(null);

	const invalidateQueries = useCallback(() => {
		queryClient.invalidateQueries({
			queryKey: convexQuery(api.members.list, {}).queryKey,
		});
		queryClient.invalidateQueries({
			queryKey: convexQuery(api.members.count, {}).queryKey,
		});
	}, [queryClient]);

	// Mutación para crear un solo miembro
	const createSingle = useConvexMutation(api.members.createMember);
	const singleMutation = useMutation({
		mutationFn: createSingle,
		onSuccess: invalidateQueries,
	});

	// Mutación para crear múltiples miembros
	const createBatch = useConvexMutation(api.members.createMembersBatch);
	const mutation = useMutation({
		mutationFn: createBatch,
		onSuccess: invalidateQueries,
	});

	// Load draft from localStorage on mount
	const [initialMembers] = useState<MemberFormData[]>(() => {
		if (typeof window === "undefined") return [emptyMemberRow];
		const draft = loadDraft();
		return draft && draft.length > 0 ? draft : [emptyMemberRow];
	});

	const form = useForm({
		defaultValues: {
			members: initialMembers,
		},
		validators: {
			onChange: membersArraySchema,
		},
		onSubmit: async ({ value }) => {
			try {
				// Filter out empty rows and already saved members
				const validMembers = value.members.filter(
					(m, idx) => m.fullName.trim() !== "" && !savedIndices.has(idx),
				);
				if (validMembers.length === 0) {
					// Si no hay miembros nuevos pero hay guardados, solo cerrar
					if (savedIndices.size > 0) {
						clearDraft();
						form.reset();
						form.setFieldValue("members", [emptyMemberRow]);
						handleOpenChange(false);
						return;
					}
					toastManager.add({
						title: "No hay miembros para guardar",
						type: "warning",
					});
					return;
				}

				// Transform data: convert empty strings to undefined for optional fields
				const membersToSave = validMembers.map((m) => ({
					fullName: m.fullName,
					phone: m.phone,
					address: m.address,
					email: m.email && m.email.trim() !== "" ? m.email : undefined,
					age: m.age,
					childrenCount: m.childrenCount,
					firstVisitDate: m.firstVisitDate,
					notes: m.notes && m.notes.trim() !== "" ? m.notes : undefined,
				}));

				await mutation.mutateAsync({ members: membersToSave });
				clearDraft();
				form.reset();
				form.setFieldValue("members", [emptyMemberRow]);
				handleOpenChange(false);
				toastManager.add({
					title: `${validMembers.length} miembro(s) guardado(s)`,
					type: "success",
				});
			} catch (error) {
				toastManager.add({
					title: "Error al guardar los miembros",
					type: "error",
				});
				console.error(error);
			}
		},
	});

	// Save to localStorage when form values change
	const handleFormChange = useCallback(() => {
		const members = form.getFieldValue("members");
		saveDraft(members);
	}, [form]);

	// Guardar un miembro individualmente
	const handleSaveSingle = useCallback(
		async (index: number) => {
			const member = form.getFieldValue(`members[${index}]`) as MemberFormData;

			// Validar que tenga los campos requeridos
			if (
				!member.fullName?.trim() ||
				!member.phone?.trim() ||
				!member.address?.trim()
			) {
				toastManager.add({
					title: "Completa los campos requeridos",
					type: "warning",
				});
				return;
			}

			setSavingIndex(index);
			try {
				await singleMutation.mutateAsync({
					fullName: member.fullName,
					phone: member.phone,
					address: member.address,
					email:
						member.email && member.email.trim() !== ""
							? member.email
							: undefined,
					age: member.age,
					childrenCount: member.childrenCount,
					firstVisitDate: member.firstVisitDate,
					notes:
						member.notes && member.notes.trim() !== ""
							? member.notes
							: undefined,
				});

				setSavedIndices((prev) => new Set(prev).add(index));
				toastManager.add({
					title: `${member.fullName} guardado`,
					type: "success",
				});
			} catch (error) {
				toastManager.add({
					title: "Error al guardar el miembro",
					type: "error",
				});
				console.error(error);
			} finally {
				setSavingIndex(null);
			}
		},
		[form, singleMutation],
	);

	// Resetear estado cuando se cierra el dialog
	const handleOpenChange = useCallback((newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			// Limpiar los índices guardados al cerrar
			setSavedIndices(new Set());
			setSavingIndex(null);
		}
	}, []);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger
				render={
					<Button size="lg" className="w-full sm:w-auto">
						<PlusIcon className="size-5" />
						Agregar Miembros
					</Button>
				}
			/>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle>Alta Múltiple de Miembros</DialogTitle>
					<DialogDescription>
						Agrega uno o más miembros a la vez
					</DialogDescription>
				</DialogHeader>
				<DialogPanel className="overflow-y-auto flex-1">
					<form
						id={formId}
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						onChange={handleFormChange}
						className="space-y-6"
					>
						<form.Field name="members" mode="array">
							{(field) => (
								<div className="space-y-4">
									{field.state.value.map((_, index) => (
										<MemberRowForm
											key={`member-row-${field.state.value[index]?.fullName || ""}-${index}`}
											form={form}
											index={index}
											onRemove={() => {
												field.removeValue(index);
												handleFormChange();
											}}
											canRemove={field.state.value.length > 1}
											isSaved={savedIndices.has(index)}
											isSaving={savingIndex === index}
											onSaveSingle={() => handleSaveSingle(index)}
										/>
									))}

									<Button
										type="button"
										variant="outline"
										onClick={() => {
											field.pushValue(emptyMemberRow);
											handleFormChange();
										}}
										className="w-full"
									>
										<PlusIcon className="size-4" />
										Agregar otra fila
									</Button>
								</div>
							)}
						</form.Field>
					</form>
				</DialogPanel>
				<DialogFooter className="gap-2 sm:gap-0">
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
								form={formId}
								className="w-full sm:w-auto"
							>
								Guardar todos
							</SubmitButton>
						)}
					</form.Subscribe>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ============================================================================
// Member Row Form Component
// ============================================================================

interface MemberRowFormProps {
	// biome-ignore lint/suspicious/noExplicitAny: TanStack Form types are complex
	form: any;
	index: number;
	onRemove: () => void;
	canRemove: boolean;
	isSaved: boolean;
	isSaving: boolean;
	onSaveSingle: () => void;
}

function MemberRowForm({
	form,
	index,
	onRemove,
	canRemove,
	isSaved,
	isSaving,
	onSaveSingle,
}: MemberRowFormProps) {
	return (
		<div
			className={`border rounded-lg p-4 space-y-4 relative bg-card ${isSaved ? "opacity-75" : ""}`}
		>
			{/* Header con badge y botones */}
			<div className="flex items-center justify-between gap-2 pr-8">
				<Badge variant={isSaved ? "success" : "outline"} size="sm">
					{isSaved ? (
						<>
							<CheckIcon className="size-3" />
							Guardado
						</>
					) : (
						"No guardado"
					)}
				</Badge>

				<div className="flex items-center gap-1">
					{!isSaved && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onSaveSingle}
							disabled={isSaving}
							className="h-7 px-2 text-xs"
						>
							{isSaving ? (
								"Guardando..."
							) : (
								<>
									<SaveIcon className="size-3.5" />
									Guardar
								</>
							)}
						</Button>
					)}
				</div>
			</div>

			{canRemove && (
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={onRemove}
					className="absolute top-2 right-2"
					aria-label="Eliminar fila"
					disabled={isSaved}
				>
					<XIcon className="size-4" />
				</Button>
			)}

			<div className="grid gap-4 sm:grid-cols-2">
				<form.Field
					name={`members[${index}].fullName`}
					validators={{
						onChange: z.string().min(1, "El nombre es requerido"),
					}}
				>
					{(field: AnyFieldApi) => (
						<TextField
							field={field}
							label="Nombre completo *"
							inputProps={{ placeholder: "Juan Pérez", disabled: isSaved }}
						/>
					)}
				</form.Field>

				<form.Field
					name={`members[${index}].phone`}
					validators={{
						onChange: z.string().min(1, "El teléfono es requerido"),
					}}
				>
					{(field: AnyFieldApi) => (
						<TextField
							field={field}
							label="Teléfono *"
							inputProps={{
								placeholder: "+52 555 123 4567",
								type: "tel",
								disabled: isSaved,
							}}
						/>
					)}
				</form.Field>

				<form.Field
					name={`members[${index}].address`}
					validators={{
						onChange: z.string().min(1, "La dirección es requerida"),
					}}
				>
					{(field: AnyFieldApi) => (
						<TextField
							field={field}
							label="Dirección *"
							inputProps={{
								placeholder: "Calle 123, Col. Centro",
								disabled: isSaved,
							}}
						/>
					)}
				</form.Field>

				<form.Field
					name={`members[${index}].email`}
					validators={{
						onChange: z
							.string()
							.email("Email inválido")
							.optional()
							.or(z.literal("")),
					}}
				>
					{(field: AnyFieldApi) => (
						<TextField
							field={field}
							label="Email"
							inputProps={{
								placeholder: "correo@ejemplo.com",
								type: "email",
								disabled: isSaved,
							}}
						/>
					)}
				</form.Field>

				<form.Field name={`members[${index}].age`}>
					{(field: AnyFieldApi) => (
						<NumberFieldForm
							field={field}
							label="Edad"
							min={0}
							max={120}
							disabled={isSaved}
						/>
					)}
				</form.Field>

				<form.Field name={`members[${index}].childrenCount`}>
					{(field: AnyFieldApi) => (
						<NumberFieldForm
							field={field}
							label="Número de hijos"
							min={0}
							max={20}
							disabled={isSaved}
						/>
					)}
				</form.Field>
			</div>

			<form.Field name={`members[${index}].notes`}>
				{(field: AnyFieldApi) => (
					<TextareaField
						field={field}
						label="Notas"
						textareaProps={{
							placeholder: "Información adicional...",
							disabled: isSaved,
						}}
					/>
				)}
			</form.Field>
		</div>
	);
}
