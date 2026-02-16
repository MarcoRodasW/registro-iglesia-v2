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

export interface SectorSelectFieldProps {
	field: AnyFieldApi;
	label?: string;
	description?: string;
	className?: string;
	disabled?: boolean;
}

function FieldErrors({ field }: { field: AnyFieldApi }) {
	const errors = field.state.meta.errors;
	const isTouched = field.state.meta.isTouched;

	if (!isTouched || !errors || errors.length === 0) return null;

	const normalizeErrorMessage = (error: unknown) => {
		if (typeof error === "string") return error;
		if (error && typeof error === "object" && "message" in error) {
			const message = (error as { message?: unknown }).message;
			if (typeof message === "string") return message;
		}
		return "Invalid value";
	};

	return (
		<div className="flex flex-col gap-1">
			{errors.map((error, index) => {
				const errorMessage = normalizeErrorMessage(error);
				return (
					<span
						key={`${field.name}-error-${index}`}
						className="text-destructive-foreground text-xs"
						role="alert"
					>
						{errorMessage}
					</span>
				);
			})}
		</div>
	);
}

function FieldValidating({ field }: { field: AnyFieldApi }) {
	if (!field.state.meta.isValidating) return null;

	return (
		<span className="text-muted-foreground text-xs animate-pulse">
			Validating...
		</span>
	);
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
					{sectorsList.map((sector) => (
						<SelectItem key={sector._id} value={sector._id}>
							{sector.name}
						</SelectItem>
					))}
				</SelectPopup>
			</Select>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldValidating field={field} />
			<FieldErrors field={field} />
		</Field>
	);
}
