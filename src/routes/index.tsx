import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/login" });
		}
	},
	loader: async ({ context }) => {
		const { queryClient } = context;
		await queryClient.ensureQueryData(convexQuery(api.auth.getCurrentUser, {}));
	},
	component: App,
});

function App() {
	const { data } = useSuspenseQuery(convexQuery(api.auth.getCurrentUser, {}));
	return (
		<div className="min-h-screen flex flex-col mx-auto max-w-6xl container">
			<h1 className="text-4xl font-bold mb-8 text-center mt-16">
				Welcome to Registro Iglesia!
			</h1>
			<p>{data.name}</p>
		</div>
	);
}
