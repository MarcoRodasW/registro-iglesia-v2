import { api } from "@convex/api";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { toastManager } from "@/components/ui/toast";
import { SubmitButton, TextareaField, TextField } from "@/lib/form-fields";

const sectorSchema = z.object({
	name: z.string().min(1, "El nombre es requerido"),
	description: z.string(),
});

export function CreateSectorDialog() {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const createSectorMutation = useConvexMutation(api.sectors.createSector);

	const createSector = useMutation({
		mutationFn: createSectorMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: convexQuery(api.sectors.listSectors, {}).queryKey,
			});
			toastManager.add({
				title: "Sector creado exitosamente",
				type: "success",
			});
			setOpen(false);
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
		},
		validators: {
			onChange: sectorSchema,
		},
		onSubmit: async ({ value }) => {
			await createSector.mutateAsync({
				name: value.name,
				description: value.description || undefined,
			});
			form.reset();
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button />}>
				<PlusIcon className="size-4 mr-2" />
				Nuevo Sector
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Crear nuevo sector</DialogTitle>
					<DialogDescription>
						Ingresa la información del nuevo sector.
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
								Crear Sector
							</SubmitButton>
						)}
					/>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
