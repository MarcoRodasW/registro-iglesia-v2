import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { SubmitButton, TextField } from "@/lib/form-fields";

const signUpSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		email: z.email("Please enter a valid email address"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export function SignUpForm() {
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		validators: {
			onChange: signUpSchema,
		},
		onSubmit: async ({ value }) => {
			const result = await authClient.signUp.email({
				name: value.name,
				email: value.email,
				password: value.password,
			});

			if (result.error) {
				throw new Error(result.error.message);
			}

			navigate({ to: "/" });
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="flex flex-col gap-4"
		>
			<form.Field
				name="name"
				children={(field) => (
					<TextField
						field={field}
						label="Name"
						inputProps={{ type: "text", placeholder: "Your name" }}
					/>
				)}
			/>

			<form.Field
				name="email"
				children={(field) => (
					<TextField
						field={field}
						label="Email"
						inputProps={{ type: "email", placeholder: "you@example.com" }}
					/>
				)}
			/>

			<form.Field
				name="password"
				children={(field) => (
					<TextField
						field={field}
						label="Password"
						inputProps={{ type: "password", placeholder: "Create a password" }}
					/>
				)}
			/>

			<form.Field
				name="confirmPassword"
				children={(field) => (
					<TextField
						field={field}
						label="Confirm Password"
						inputProps={{
							type: "password",
							placeholder: "Confirm your password",
						}}
					/>
				)}
			/>

			<form.Subscribe
				selector={(state) => ({
					canSubmit: state.canSubmit,
					isSubmitting: state.isSubmitting,
				})}
				children={({ canSubmit, isSubmitting }) => (
					<SubmitButton
						canSubmit={canSubmit}
						isSubmitting={isSubmitting}
						className="w-full"
						submittingText="Creating account..."
					>
						Create account
					</SubmitButton>
				)}
			/>
		</form>
	);
}
