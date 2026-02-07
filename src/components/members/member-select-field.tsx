"use client";

import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface MemberSelectFieldProps {
	field: AnyFieldApi;
	label?: string;
	description?: string;
	className?: string;
	disabled?: boolean;
	excludeMemberId?: string;
}

export function MemberSelectField({
	field,
	label = "Invitado por",
	description,
	className,
	disabled,
	excludeMemberId,
}: MemberSelectFieldProps) {
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);

	const { data: members = [] } = useQuery(
		convexQuery(api.members.searchMembers, {
			search: search || undefined,
			limit: 20,
			excludeId: excludeMemberId as Id<"members"> | undefined,
		}),
	);

	// Find selected member name
	const selectedMember = members.find((m) => m.id === field.state.value);

	const handleValueChange = (value: string) => {
		field.handleChange(value || undefined);
		field.handleBlur();
		setOpen(false);
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
	};

	return (
		<Field className={className}>
			{label && <FieldLabel>{label}</FieldLabel>}
			<Select
				value={field.state.value || ""}
				onValueChange={handleValueChange}
				open={open}
				onOpenChange={setOpen}
			>
				<SelectTrigger disabled={disabled}>
					<SelectValue
						placeholder="Selecciona un miembro"
						className="text-left"
					>
						{selectedMember ? selectedMember.fullName : "Selecciona un miembro"}
					</SelectValue>
				</SelectTrigger>
				<SelectPopup className="w-[300px] p-2">
					<div className="mb-2">
						<Input
							placeholder="Buscar miembro..."
							value={search}
							onChange={handleSearchChange}
							className="h-8 text-sm"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
					<div className="max-h-[200px] overflow-y-auto">
						<SelectItem value="" className="text-muted-foreground">
							-- Sin invitador --
						</SelectItem>
						{members.length === 0 ? (
							<div className="px-2 py-3 text-sm text-muted-foreground text-center">
								No se encontraron miembros
							</div>
						) : (
							members.map((member) => (
								<SelectItem key={member.id} value={member.id}>
									{member.fullName}
								</SelectItem>
							))
						)}
					</div>
				</SelectPopup>
			</Select>
			{description && <FieldDescription>{description}</FieldDescription>}
			{field.state.meta.errors.length > 0 && field.state.meta.isTouched && (
				<div className="text-destructive-foreground text-xs">
					{field.state.meta.errors[0]}
				</div>
			)}
		</Field>
	);
}
