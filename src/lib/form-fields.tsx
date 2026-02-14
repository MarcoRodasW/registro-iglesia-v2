"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input, type InputProps } from "@/components/ui/input";
import {
	NumberField,
	NumberFieldDecrement,
	NumberFieldGroup,
	NumberFieldIncrement,
	NumberFieldInput,
} from "@/components/ui/number-field";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { cn, formatPhone, stripPhoneFormatting } from "@/lib/utils";

interface BaseFieldProps {
	label?: ReactNode;
	description?: ReactNode;
	className?: string;
}

interface TextFieldProps extends BaseFieldProps {
	field: AnyFieldApi;
	inputProps?: Omit<
		InputProps,
		"value" | "onChange" | "onBlur" | "name" | "id"
	>;
}

interface TextareaFieldProps extends BaseFieldProps {
	field: AnyFieldApi;
	textareaProps?: Omit<
		TextareaProps,
		"value" | "onChange" | "onBlur" | "name" | "id"
	>;
}

interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
	field: AnyFieldApi;
	options: SelectOption[];
	placeholder?: string;
}

interface CheckboxFieldProps extends BaseFieldProps {
	field: AnyFieldApi;
}

interface NumberFieldFormProps extends BaseFieldProps {
	field: AnyFieldApi;
	min?: number;
	max?: number;
	step?: number;
	size?: "sm" | "default" | "lg";
	disabled?: boolean;
	inputMode?: "numeric" | "decimal";
}

interface DateFieldProps extends BaseFieldProps {
	field: AnyFieldApi;
	disabled?: boolean;
}

interface PhoneFieldProps extends BaseFieldProps {
	field: AnyFieldApi;
	inputProps?: Omit<
		InputProps,
		"value" | "onChange" | "onBlur" | "name" | "id" | "type" | "placeholder"
	>;
}

interface SubmitButtonProps
	extends Omit<ComponentProps<typeof Button>, "type" | "disabled"> {
	isSubmitting: boolean;
	canSubmit: boolean;
	submittingText?: string;
}

function RequiredLabel({ children }: { children: ReactNode }) {
	if (typeof children !== "string") return <>{children}</>;
	if (!children.endsWith(" *")) return <>{children}</>;
	const text = children.slice(0, -2);
	return (
		<>
			{text} <span className="text-red-500">*</span>
		</>
	);
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

function TextField({
	field,
	label,
	description,
	className,
	inputProps,
}: TextFieldProps) {
	const hasError =
		field.state.meta.isTouched && field.state.meta.errors.length > 0;

	return (
		<Field className={className}>
			{label && (
				<FieldLabel htmlFor={field.name}>
					<RequiredLabel>{label}</RequiredLabel>
				</FieldLabel>
			)}
			<Input
				id={field.name}
				name={field.name}
				value={field.state.value ?? ""}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={hasError || undefined}
				{...inputProps}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldValidating field={field} />
			<FieldErrors field={field} />
		</Field>
	);
}

function PhoneField({
	field,
	label,
	description,
	className,
	inputProps,
}: PhoneFieldProps) {
	const hasError =
		field.state.meta.isTouched && field.state.meta.errors.length > 0;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = stripPhoneFormatting(e.target.value).slice(0, 8);
		field.handleChange(rawValue);
	};

	const displayValue = formatPhone(field.state.value ?? "");

	return (
		<Field className={className}>
			{label && (
				<FieldLabel htmlFor={field.name}>
					<RequiredLabel>{label}</RequiredLabel>
				</FieldLabel>
			)}
			<Input
				id={field.name}
				name={field.name}
				type="tel"
				placeholder="8890-4253"
				value={displayValue}
				onChange={handleChange}
				onBlur={field.handleBlur}
				aria-invalid={hasError || undefined}
				{...inputProps}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldValidating field={field} />
			<FieldErrors field={field} />
		</Field>
	);
}

function TextareaField({
	field,
	label,
	description,
	className,
	textareaProps,
}: TextareaFieldProps) {
	const hasError =
		field.state.meta.isTouched && field.state.meta.errors.length > 0;

	return (
		<Field className={cn("sm:col-span-2", className)}>
			{label && (
				<FieldLabel htmlFor={field.name}>
					<RequiredLabel>{label}</RequiredLabel>
				</FieldLabel>
			)}
			<Textarea
				id={field.name}
				name={field.name}
				value={field.state.value ?? ""}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={hasError || undefined}
				{...textareaProps}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldValidating field={field} />
			<FieldErrors field={field} />
		</Field>
	);
}

function SelectField({
	field,
	label,
	description,
	className,
	options,
	placeholder = "Select an option",
}: SelectFieldProps) {
	const hasError =
		field.state.meta.isTouched && field.state.meta.errors.length > 0;

	return (
		<Field className={className}>
			{label && (
				<FieldLabel>
					<RequiredLabel>{label}</RequiredLabel>
				</FieldLabel>
			)}
			<Select
				value={field.state.value ?? ""}
				onValueChange={(value) => {
					field.handleChange(value);
					field.handleBlur();
				}}
			>
				<SelectTrigger aria-invalid={hasError || undefined}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectPopup>
					{options.map((option) => (
						<SelectItem
							key={option.value}
							value={option.value}
							disabled={option.disabled}
						>
							{option.label}
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

function CheckboxField({
	field,
	label,
	description,
	className,
}: CheckboxFieldProps) {
	const hasError =
		field.state.meta.isTouched && field.state.meta.errors.length > 0;

	return (
		<Field className={cn("flex-row items-center gap-3", className)}>
			<Checkbox
				id={field.name}
				name={field.name}
				checked={Boolean(field.state.value)}
				onCheckedChange={(checked) => {
					field.handleChange(checked);
					field.handleBlur();
				}}
				aria-invalid={hasError || undefined}
			/>
			<div className="flex flex-col gap-1">
				{label && (
					<FieldLabel htmlFor={field.name} className="cursor-pointer">
						<RequiredLabel>{label}</RequiredLabel>
					</FieldLabel>
				)}
				{description && <FieldDescription>{description}</FieldDescription>}
				<FieldErrors field={field} />
			</div>
		</Field>
	);
}

function NumberFieldForm({
	field,
	label,
	description,
	className,
	min,
	max,
	step,
	size = "default",
	inputMode = "numeric",
	disabled,
}: NumberFieldFormProps) {
	const hasError =
		field.state.meta.isTouched && field.state.meta.errors.length > 0;
	return (
		<Field className={className}>
			{label && (
				<FieldLabel htmlFor={field.name}>
					<RequiredLabel>{label}</RequiredLabel>
				</FieldLabel>
			)}
			<NumberField
				id={field.name}
				value={field.state.value ?? undefined}
				onValueChange={(value) => field.handleChange(value)}
				min={min}
				max={max}
				step={step}
				size={size}
				disabled={disabled}
				inputMode={inputMode}
			>
				<NumberFieldGroup aria-invalid={hasError || undefined}>
					<NumberFieldDecrement />
					<NumberFieldInput onBlur={field.handleBlur} />
					<NumberFieldIncrement />
				</NumberFieldGroup>
			</NumberField>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldValidating field={field} />
			<FieldErrors field={field} />
		</Field>
	);
}

function DateField({
	field,
	label,
	description,
	className,
	disabled,
}: DateFieldProps) {
	const hasError =
		field.state.meta.isTouched && field.state.meta.errors.length > 0;

	// Convert timestamp to YYYY-MM-DD format for input
	const timestampToDateString = (timestamp: number | undefined): string => {
		if (!timestamp) return "";
		const date = new Date(timestamp);
		return date.toISOString().split("T")[0];
	};

	// Convert YYYY-MM-DD string to timestamp
	const dateStringToTimestamp = (dateString: string): number | undefined => {
		if (!dateString) return undefined;
		return new Date(dateString).getTime();
	};

	return (
		<Field className={className}>
			{label && (
				<FieldLabel htmlFor={field.name}>
					<RequiredLabel>{label}</RequiredLabel>
				</FieldLabel>
			)}
			<Input
				id={field.name}
				name={field.name}
				type="date"
				value={timestampToDateString(field.state.value)}
				onChange={(e) => {
					const timestamp = dateStringToTimestamp(e.target.value);
					field.handleChange(timestamp);
				}}
				onBlur={field.handleBlur}
				aria-invalid={hasError || undefined}
				disabled={disabled}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldValidating field={field} />
			<FieldErrors field={field} />
		</Field>
	);
}

function SubmitButton({
	isSubmitting,
	canSubmit,
	children = "Submit",
	submittingText,
	className,
	...props
}: SubmitButtonProps) {
	return (
		<Button
			{...props}
			type="submit"
			disabled={!canSubmit || isSubmitting}
			className={className}
		>
			{isSubmitting && <Spinner className="size-4" />}
			{isSubmitting ? (submittingText ?? children) : children}
		</Button>
	);
}

interface FormSubmitProps {
	canSubmit: boolean;
	isSubmitting: boolean;
	children?: ReactNode;
	submittingText?: string;
}

function FormSubmitText({
	isSubmitting,
	children = "Submit",
	submittingText = "Submitting...",
}: FormSubmitProps) {
	return <>{isSubmitting ? submittingText : children}</>;
}

export {
	CheckboxField,
	DateField,
	FieldErrors,
	FieldValidating,
	FormSubmitText,
	NumberFieldForm,
	PhoneField,
	SelectField,
	SubmitButton,
	TextareaField,
	TextField,
	type CheckboxFieldProps,
	type DateFieldProps,
	type FormSubmitProps,
	type NumberFieldFormProps,
	type PhoneFieldProps,
	type SelectFieldProps,
	type SelectOption,
	type SubmitButtonProps,
	type TextareaFieldProps,
	type TextFieldProps,
};
