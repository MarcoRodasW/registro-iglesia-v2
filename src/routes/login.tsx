import { createFileRoute } from "@tanstack/react-router";

import { AuthCard } from "@/components/auth-card";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	beforeLoad: ({ context }) => {
		if (context.isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
});

function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
			<AuthCard />
		</div>
	);
}
