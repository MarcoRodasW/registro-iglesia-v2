import { authClient } from "@/lib/auth-client";
import { SubmitButton, TextField } from "@/lib/form-fields";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import z from "zod";

const signInSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export function SignInForm() {
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
