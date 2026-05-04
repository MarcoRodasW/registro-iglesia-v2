import { api } from "@convex/api";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { ConvexHttpClient } from "convex/browser";
import type { FunctionArgs } from "convex/server";
import { CheckCircle2Icon } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DateField,
	NumberFieldForm,
	PhoneField,
	SubmitButton,
	TextField,
} from "@/lib/form-fields";

interface PublicMemberRegistrationFormProps {
	token: string;
	sectorName: string;
}

type RegisterFromSectorLinkInput = FunctionArgs<
	typeof api.members.registerFromSectorLink
>;

const publicRegistrationSchema = z.object({
	fullName: z.string().min(1, "El nombre es requerido"),
	phone: z.string().min(8, "El telefono debe tener 8 digitos"),
	address: z.string().min(1, "La direccion es requerida"),
	age: z.number().min(0, "La edad debe ser positiva").or(z.undefined()),
	childrenCount: z
		.number()
		.min(0, "El numero de hijos debe ser positivo")
		.or(z.undefined()),
	firstVisitDate: z.number().or(z.undefined()),
	invitedByName: z.string(),
});

function toOptionalText(value: string): string | undefined {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function mapRegistrationError(error: unknown): string {
	if (!(error instanceof Error)) {
		return "No se pudo completar el registro. Intenta nuevamente.";
	}

	if (
		error.message.includes("Invalid registration link") ||
		error.message.includes("not active")
	) {
		return "Este enlace no es valido. Solicita uno nuevo al lider de tu sector.";
	}

	return "No se pudo completar el registro. Intenta nuevamente.";
}

export function PublicMemberRegistrationForm({
	token,
	sectorName,
}: PublicMemberRegistrationFormProps) {
	const convexUrl = import.meta.env.VITE_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("VITE_CONVEX_URL is not set");
	}

	const convexHttpClient = useMemo(() => new ConvexHttpClient(convexUrl), []);

	const registerMemberMutation = useMutation({
		mutationFn: async (payload: RegisterFromSectorLinkInput) =>
			await convexHttpClient.mutation(
				api.members.registerFromSectorLink,
				payload,
			),
	});

	const form = useForm({
		defaultValues: {
			fullName: "",
			phone: "",
			address: "",
			age: undefined as number | undefined,
			childrenCount: undefined as number | undefined,
			firstVisitDate: undefined as number | undefined,
			invitedByName: "",
		},
		validators: {
			onChange: publicRegistrationSchema,
		},
		onSubmit: async ({ value }) => {
			const payload: RegisterFromSectorLinkInput = {
				token,
				fullName: value.fullName.trim(),
				phone: value.phone,
				address: value.address.trim(),
				age: value.age,
				childrenCount: value.childrenCount,
				firstVisitDate: value.firstVisitDate,
				invitedByName: toOptionalText(value.invitedByName),
			};

			await registerMemberMutation.mutateAsync(payload);
		},
	});

	if (registerMemberMutation.isSuccess) {
		return (
			<Card className="w-full">
				<CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
					<CheckCircle2Icon className="size-20 text-green-600" />
					<p className="text-lg font-medium text-green-700">
						Registrado correctamente.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Formulario de registro</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					onChange={() => {
						if (registerMemberMutation.isError) {
							registerMemberMutation.reset();
						}
					}}
					className="space-y-4"
				>
					{registerMemberMutation.isError ? (
						<Alert variant="error">
							<AlertTitle>No se pudo enviar el formulario</AlertTitle>
							<AlertDescription>
								{mapRegistrationError(registerMemberMutation.error)}
							</AlertDescription>
						</Alert>
					) : null}

					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="fullName">
							{(field: AnyFieldApi) => (
								<TextField
									field={field}
									label="Nombre completo *"
									inputProps={{ placeholder: "Juan Perez" }}
								/>
							)}
						</form.Field>

						<form.Field name="phone">
							{(field: AnyFieldApi) => (
								<PhoneField field={field} label="Telefono *" />
							)}
						</form.Field>

						<form.Field name="address">
							{(field: AnyFieldApi) => (
								<TextField
									field={field}
									label="Direccion *"
									inputProps={{ placeholder: "Calle 123, Col. Centro" }}
								/>
							)}
						</form.Field>
						<form.Field name="age">
							{(field: AnyFieldApi) => (
								<NumberFieldForm field={field} label="Edad" min={0} max={120} />
							)}
						</form.Field>

						<form.Field name="childrenCount">
							{(field: AnyFieldApi) => (
								<NumberFieldForm
									field={field}
									label="Numero de hijos"
									min={0}
									max={20}
								/>
							)}
						</form.Field>

						<form.Field name="firstVisitDate">
							{(field: AnyFieldApi) => (
								<DateField field={field} label="Fecha de primera visita" />
							)}
						</form.Field>

						<form.Field name="invitedByName">
							{(field: AnyFieldApi) => (
								<TextField
									field={field}
									label="Invitado por"
									inputProps={{ placeholder: "Nombre de quien te invito" }}
								/>
							)}
						</form.Field>
					</div>

					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<SubmitButton
								canSubmit={canSubmit && !registerMemberMutation.isPending}
								isSubmitting={isSubmitting || registerMemberMutation.isPending}
								submittingText="Enviando registro..."
								className="w-full"
							>
								Enviar registro
							</SubmitButton>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
		</Card>
	);
}
