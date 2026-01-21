"use client";

import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { SubmitButton, TextField } from "@/lib/form-fields";

const signInSchema = z.object({
	email: z.email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

const signUpSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		email: z.email("Please enter a valid email address"),
		password: z.string().min(5, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Google"
			role="img"
		>
			<title>Google</title>
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				fill="#EA4335"
			/>
		</svg>
	);
}

function SignInForm() {
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: signInSchema,
		},
		onSubmit: async ({ value }) => {
			const result = await authClient.signIn.email({
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
						inputProps={{
							type: "password",
							placeholder: "Enter your password",
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
						submittingText="Signing in..."
					>
						Sign in
					</SubmitButton>
				)}
			/>
		</form>
	);
}

function SignUpForm() {
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

export function AuthCard() {
	const handleGoogleSignIn = async () => {
		await authClient.signIn.social({
			provider: "google",
			callbackURL: "/",
		});
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Welcome</CardTitle>
				<CardDescription>
					Sign in to your account or create a new one
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<Button
					variant="outline"
					className="w-full"
					onClick={handleGoogleSignIn}
				>
					<GoogleIcon className="size-5" />
					Continue with Google
				</Button>

				<div className="flex items-center gap-4">
					<Separator className="flex-1" />
					<span className="text-muted-foreground text-sm">or</span>
					<Separator className="flex-1" />
				</div>

				<Tabs defaultValue="sign-in">
					<TabsList className="w-full">
						<TabsTab value="sign-in" className="flex-1">
							Sign in
						</TabsTab>
						<TabsTab value="sign-up" className="flex-1">
							Sign up
						</TabsTab>
					</TabsList>
					<TabsPanel value="sign-in" className="pt-4">
						<SignInForm />
					</TabsPanel>
					<TabsPanel value="sign-up" className="pt-4">
						<SignUpForm />
					</TabsPanel>
				</Tabs>
			</CardContent>
		</Card>
	);
}
