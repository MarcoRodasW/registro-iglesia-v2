import { api } from "@convex/api";
import type { Doc } from "@convex/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toastManager } from "@/components/ui/toast";
import { SubmitButton, TextareaField, TextField } from "@/lib/form-fields";

interface EditSectorDialogProps {
	sector: Doc<"sectors">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const sectorSchema = z.object({
	name: z.string().min(1, "El nombre es requerido"),
	description: z.string(),
});

export function EditSectorDialog({
	sector,
	open,
	onOpenChange,
}: EditSectorDialogProps) {
	const queryClient = useQueryClient();
	const updateSectorMutation = useConvexMutation(api.sectors.updateSector);

	const updateSector = useMutation({
		mutationFn: updateSectorMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: convexQuery(api.sectors.listSectors, {}).queryKey,
			});
			toastManager.add({
				title: "Sector actualizado",
				type: "success",
			});
			onOpenChange(false);
		},
	});

	const form = useForm({
		defaultValues: {
			name: sector.name,
			description: sector.description ?? "",
		},
		validators: {
			onChange: sectorSchema,
		},
		onSubmit: async ({ value }) => {
			await updateSector.mutateAsync({
				sectorId: sector._id,
				name: value.name,
				description: value.description || undefined,
			});
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar sector</DialogTitle>
					<DialogDescription>
						Actualiza la información del sector.
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
							name="name"
							children={(field) => (
								<TextField
									field={field}
									label="Nombre"
									inputProps={{ placeholder: "Nombre del sector" }}
								/>
							)}
						/>
						<form.Field
							name="description"
							children={(field) => (
								<TextareaField
									field={field}
									label="Descripción (opcional)"
									textareaProps={{ placeholder: "Descripción del sector" }}
								/>
							)}
						/>
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
						children={({ canSubmit, isSubmitting }) => (
							<SubmitButton
								canSubmit={canSubmit}
								isSubmitting={isSubmitting}
								submittingText="Guardando..."
								onClick={() => form.handleSubmit()}
							>
								Guardar cambios
							</SubmitButton>
						)}
					/>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
