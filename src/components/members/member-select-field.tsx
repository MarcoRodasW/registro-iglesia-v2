"use client";

import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

import {
	Autocomplete,
	AutocompleteEmpty,
	AutocompleteInput,
	AutocompleteItem,
	AutocompleteList,
	AutocompletePopup,
	AutocompleteStatus,
} from "@/components/ui/autocomplete";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

interface MemberOption {
	value: string;
	label: string;
}

interface MemberSelectFieldProps {
	field: AnyFieldApi;
	nameField?: AnyFieldApi;
	label?: string;
	description?: string;
	className?: string;
	disabled?: boolean;
	excludeMemberId?: string;
	onSelect?: () => void;
}

export function MemberSelectField({
	field,
	nameField,
	label = "Invitado por",
	description,
	className,
	disabled,
	excludeMemberId,
	onSelect,
}: MemberSelectFieldProps) {
	const initialName = (nameField?.state.value as string) ?? "";
	const [inputValue, setInputValue] = useState(initialName);
	const selectedIdRef = useRef<string | undefined>(
		(field.state.value as string | undefined) ?? undefined,
	);

	const { data: members = [], isPending } = useQuery({
		...convexQuery(api.members.searchMembers, {
			search: inputValue || undefined,
			limit: 20,
			excludeId: excludeMemberId as Id<"members"> | undefined,
		}),
		placeholderData: (previousData) => previousData,
	});

	const items: MemberOption[] = members.map((m) => ({
		value: m.id,
		label: m.fullName,
	}));

	const hasSearchTerm = inputValue.trim().length > 0;
	const isSearching = isPending && hasSearchTerm;
	const showEmptyState = hasSearchTerm && !isSearching && items.length === 0;

	return (
		<Field className={className}>
			{label && <FieldLabel>{label}</FieldLabel>}
			<Autocomplete
				items={items}
				value={inputValue}
				onValueChange={(value, details) => {
					setInputValue(value ?? "");

					if (details.reason === "item-press") {
						// User selected an existing member from the list
						const selected = items.find((item) => item.label === value);
						if (selected) {
							selectedIdRef.current = selected.value;
							field.handleChange(selected.value);
							nameField?.handleChange(selected.label);
							field.handleBlur();
							onSelect?.();
							return;
						}
					}

					// Free text typed or cleared
					if (!value || value === "") {
						// Cleared
						selectedIdRef.current = undefined;
						field.handleChange(undefined);
						nameField?.handleChange(undefined);
						onSelect?.();
						return;
					}

					// User is typing free text — clear the member ID reference
					selectedIdRef.current = undefined;
					field.handleChange(undefined);
					nameField?.handleChange(value);
					onSelect?.();
				}}
				filter={null}
			>
				<AutocompleteInput
					placeholder="Buscar miembro o escribir nombre..."
					disabled={disabled}
					showClear
				/>
				<AutocompletePopup aria-busy={isSearching || undefined}>
					<AutocompleteStatus>
						{isSearching ? (
							<span className="flex items-center justify-center gap-2">
								<Spinner aria-hidden className="size-3.5 animate-spin" />
								Buscando miembros...
							</span>
						) : null}
					</AutocompleteStatus>
					{showEmptyState ? (
						<AutocompleteEmpty>No se encontraron miembros</AutocompleteEmpty>
					) : null}
					<AutocompleteList>
						{(item: MemberOption) => (
							<AutocompleteItem key={item.value} value={item}>
								{item.label}
							</AutocompleteItem>
						)}
					</AutocompleteList>
				</AutocompletePopup>
			</Autocomplete>
			{description && <FieldDescription>{description}</FieldDescription>}
			{field.state.meta.errors.length > 0 && field.state.meta.isTouched && (
				<div className="text-destructive-foreground text-xs">
					{field.state.meta.errors[0]}
				</div>
			)}
		</Field>
	);
}
