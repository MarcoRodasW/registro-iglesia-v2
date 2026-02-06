import type { Doc } from "@convex/dataModel";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { z } from "zod";

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
} from "@/components/ui/dialog";
import { useMemberMutations } from "@/hooks/use-member-mutations";
import {
	NumberFieldForm,
	SubmitButton,
	TextareaField,
	TextField,
} from "@/lib/form-fields";

interface EditMemberDialogProps {
	member: Doc<"members">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EditMemberDialog({
	member,
	open,
	onOpenChange,
}: EditMemberDialogProps) {
	const { updateMember } = useMemberMutations();

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
				await updateMember.mutateAsync({
					id: member._id,
					fullName: value.fullName,
					phone: value.phone,
					address: value.address,
					email: value.email || undefined,
					age: value.age,
					childrenCount: value.childrenCount,
					firstVisitDate: value.firstVisitDate,
					notes: value.notes || undefined,
				});
				onOpenChange(false);
			} catch (error) {
				console.error(error);
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				fullName: member.fullName,
				phone: member.phone,
				address: member.address,
				email: member.email ?? "",
				age: member.age,
				childrenCount: member.childrenCount,
				firstVisitDate: member.firstVisitDate,
				notes: member.notes ?? "",
			});
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
							{(field) => (
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
							{(field) => (
								<TextField
									field={field}
									label="Teléfono *"
									inputProps={{
										placeholder: "+52 555 123 4567",
										type: "tel",
									}}
								/>
							)}
						</form.Field>

						<form.Field
							name="address"
							validators={{
								onChange: z.string().min(1, "La dirección es requerida"),
							}}
						>
							{(field) => (
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
							{(field) => (
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
								{(field) => (
									<NumberFieldForm
										field={field}
										label="Edad"
										min={0}
										max={120}
									/>
								)}
							</form.Field>

							<form.Field name="childrenCount">
								{(field) => (
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
							{(field) => (
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
