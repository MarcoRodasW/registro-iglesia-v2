import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxPopup,
	ComboboxValue,
} from "@/components/ui/combobox";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { toastManager } from "@/components/ui/toast";
import { SubmitButton, TextareaField, TextField } from "@/lib/form-fields";

interface LeaderOption {
	value: string;
	label: string;
}

const sectorSchema = z.object({
	name: z.string().min(1, "El nombre es requerido"),
	description: z.string(),
	leaderIds: z.array(z.string()),
});

export function CreateSectorDialog() {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const createSectorMutation = useConvexMutation(api.sectors.createSector);

	const { data: leaders = [] } = useQuery(
		convexQuery(api.users.listAssignableLeaders, {}),
	);

	const leaderItems: LeaderOption[] = leaders.map((leader) => ({
		value: leader._id,
		label: leader.name,
	}));

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
			leaderIds: [] as string[],
		},
		validators: {
			onChange: sectorSchema,
		},
		onSubmit: async ({ value }) => {
			await createSector.mutateAsync({
				name: value.name,
				description: value.description || undefined,
				leaderIds:
					value.leaderIds.length > 0
						? (value.leaderIds as Id<"users">[])
						: undefined,
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
						<form.Field
							name="leaderIds"
							children={(field) => {
								const selectedIds = (field.state.value ?? []) as string[];
								const selectedItems = leaderItems.filter((item) =>
									selectedIds.includes(item.value),
								);

								return (
									<Field>
										<FieldLabel>Líderes (opcional)</FieldLabel>
										<Combobox
											items={leaderItems}
											multiple
											value={selectedItems}
											onValueChange={(newValue: LeaderOption[] | null) => {
												const ids = (newValue ?? []).map((item) => item.value);
												field.handleChange(ids);
											}}
										>
											<ComboboxChips>
												<ComboboxValue>
													{(value: LeaderOption[]) => (
														<>
															{value?.map((item) => (
																<ComboboxChip
																	key={item.value}
																	aria-label={item.label}
																>
																	{item.label}
																</ComboboxChip>
															))}
															<ComboboxInput
																placeholder={
																	value.length > 0
																		? undefined
																		: "Buscar líderes..."
																}
																aria-label="Buscar líderes"
															/>
														</>
													)}
												</ComboboxValue>
											</ComboboxChips>
											<ComboboxPopup>
												<ComboboxEmpty>
													No se encontraron líderes.
												</ComboboxEmpty>
												<ComboboxList>
													{(item: LeaderOption) => (
														<ComboboxItem value={item}>
															{item.label}
														</ComboboxItem>
													)}
												</ComboboxList>
											</ComboboxPopup>
										</Combobox>
									</Field>
								);
							}}
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
