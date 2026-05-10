"use client";

import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FieldErrors, FieldValidating } from "@/lib/form-fields";

export interface SectorSelectFieldProps {
	field: AnyFieldApi;
	label?: string;
	description?: string;
	className?: string;
	disabled?: boolean;
}

export function SectorSelectField({
	field,
	label = "Sector",
	description,
	className,
	disabled,
}: SectorSelectFieldProps) {
	const { data: sectors = [] } = useQuery(
		convexQuery(api.sectors.listSectors, {}),
	);

	const sectorsList = sectors ?? [];
	const fieldValue = field.state.value as string | undefined;
	const selectedSector = fieldValue
		? sectorsList.find((s) => s._id === fieldValue)
		: null;

	const hasError =
		field.state.meta.isTouched && field.state.meta.errors.length > 0;

	return (
		<Field className={className}>
			{label && <FieldLabel>{label}</FieldLabel>}
			<Select
				value={fieldValue ?? ""}
				onValueChange={(value: string | null) => {
					field.handleChange(value || undefined);
					field.handleBlur();
				}}
				disabled={disabled}
			>
				<SelectTrigger aria-invalid={hasError || undefined}>
					<SelectValue>
						{selectedSector?.name ?? "Seleccionar sector"}
					</SelectValue>
				</SelectTrigger>
				<SelectPopup>
					{sectorsList.length === 0 ? (
						<div className="text-muted-foreground px-3 py-6 text-center text-sm">
							No hay sectores disponibles
						</div>
					) : (
						sectorsList.map((sector) => (
							<SelectItem key={sector._id} value={sector._id}>
								{sector.name}
							</SelectItem>
						))
					)}
				</SelectPopup>
			</Select>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldValidating field={field} />
			<FieldErrors field={field} />
		</Field>
	);
}
