"use client";

import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
	Combobox,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxPopup,
} from "@/components/ui/combobox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

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
	const selectedLabelRef = useRef<string>(initialName);

	const { data: members = [] } = useQuery(
		convexQuery(api.members.searchMembers, {
			search: inputValue || undefined,
			limit: 20,
			excludeId: excludeMemberId as Id<"members"> | undefined,
		}),
	);

	const items: MemberOption[] = members.map((m) => ({
		value: m.id,
		label: m.fullName,
	}));

	// Ensure the selected item is always in the items list, even if search filters it out
	const fieldValue = field.state.value as string | undefined;
	const selectedInList = fieldValue
		? items.find((item) => item.value === fieldValue)
		: undefined;

	const effectiveItems =
		fieldValue && !selectedInList && selectedLabelRef.current
			? [{ value: fieldValue, label: selectedLabelRef.current }, ...items]
			: items;

	const selectedItem = fieldValue
		? (effectiveItems.find((item) => item.value === fieldValue) ?? null)
		: null;

	// Sync the label when the selected member is found in search results
	// (handles case where draft had an ID but initial search didn't include the member)
	const resolvedLabel = selectedInList?.label;
	useEffect(() => {
		if (resolvedLabel && !selectedLabelRef.current) {
			selectedLabelRef.current = resolvedLabel;
			setInputValue(resolvedLabel);
			nameField?.handleChange(resolvedLabel);
		}
	}, [resolvedLabel, nameField]);

	return (
		<Field className={className}>
			{label && <FieldLabel>{label}</FieldLabel>}
			<Combobox
				items={effectiveItems}
				value={selectedItem}
				onValueChange={(val) => {
					field.handleChange(val?.value ?? undefined);
					selectedLabelRef.current = val?.label ?? "";
					nameField?.handleChange(val?.label ?? undefined);
					field.handleBlur();
					onSelect?.();
				}}
				inputValue={inputValue}
				onInputValueChange={(value) => {
					setInputValue(value);
					if (value === "") {
						field.handleChange(undefined);
						nameField?.handleChange(undefined);
						selectedLabelRef.current = "";
						onSelect?.();
					}
				}}
				isItemEqualToValue={(a, b) => a.value === b.value}
				filter={null}
			>
				<ComboboxInput
					placeholder="Buscar miembro..."
					disabled={disabled}
					showClear
				/>
				<ComboboxPopup>
					<ComboboxEmpty>No se encontraron miembros</ComboboxEmpty>
					<ComboboxList>
						{(item: MemberOption) => (
							<ComboboxItem key={item.value} value={item}>
								{item.label}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxPopup>
			</Combobox>
			{description && <FieldDescription>{description}</FieldDescription>}
			{field.state.meta.errors.length > 0 && field.state.meta.isTouched && (
				<div className="text-destructive-foreground text-xs">
					{field.state.meta.errors[0]}
				</div>
			)}
		</Field>
	);
}
