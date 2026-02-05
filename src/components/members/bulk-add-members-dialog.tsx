import type { AnyFieldApi, AnyFormApi } from "@tanstack/react-form";
import { useForm } from "@tanstack/react-form";
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
import { useBulkMembersDraft } from "@/hooks/use-bulk-members-draft";
import { useMemberMutations } from "@/hooks/use-member-mutations";
import {
	NumberFieldForm,
	SubmitButton,
	TextareaField,
	TextField,
} from "@/lib/form-fields";
import { type MemberFields, toMemberPayload } from "@/lib/member-payload";
import {
	emptyMemberRow,
	type MemberFormData,
	membersArraySchema,
} from "@/lib/member-schema";

export function BulkAddMembersDialog() {
	const [open, setOpen] = useState(false);
	const formId = useId();

	const { createMember, createMembersBatch } = useMemberMutations();
	const {
		initialMembers,
		savedIndices,
		markSaved,
		setSavingIndex,
		isSaving,
		saveToDraft,
		clearDraftState,
		resetSavedIndices,
	} = useBulkMembersDraft();

	const form = useForm({
		defaultValues: {
			members: initialMembers,
		},
		validators: {
			onChange: membersArraySchema,
		},
		onSubmit: async ({ value }) => {
			// Filter out empty rows and already saved members
			const validMembers = value.members.filter(
				(m, idx) => m.fullName.trim() !== "" && !savedIndices.has(idx),
			);

			if (validMembers.length === 0) {
				if (savedIndices.size > 0) {
					clearDraftState();
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

			const membersToSave = validMembers.map(toMemberPayload) as MemberFields[];
			await createMembersBatch.mutateAsync({ members: membersToSave });

			clearDraftState();
			form.reset();
			form.setFieldValue("members", [emptyMemberRow]);
			handleOpenChange(false);
		},
	});

	// Save to localStorage when form values change
	const handleFormChange = useCallback(() => {
		const members = form.getFieldValue("members");
		saveToDraft(members as MemberFormData[]);
	}, [form, saveToDraft]);

	// Guardar un miembro individualmente
	const handleSaveSingle = useCallback(
		async (index: number) => {
			const member = form.getFieldValue(`members[${index}]`) as MemberFormData;

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
				await createMember.mutateAsync(toMemberPayload(member));
				markSaved(index);
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
		[form, createMember, markSaved, setSavingIndex],
	);

	// Resetear estado cuando se cierra el dialog
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			setOpen(newOpen);
			if (!newOpen) {
				resetSavedIndices();
			}
		},
		[resetSavedIndices],
	);

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
											isSaving={isSaving(index)}
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

interface MemberRowFormProps {
	form: AnyFormApi;
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
