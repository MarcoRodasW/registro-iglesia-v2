import { ConvexQueryClient } from "@convex-dev/react-query";
import { notifyManager, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexProvider } from "convex/react";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	if (typeof document !== "undefined") {
		notifyManager.setScheduler(window.requestAnimationFrame);
	}

	const convexUrl = import.meta.env.VITE_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("VITE_CONVEX_URL is not set");
	}

	const convexQueryClient = new ConvexQueryClient(convexUrl, {
		expectAuth: true,
	});

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	});
	convexQueryClient.connect(queryClient);

	const router = createRouter({
		routeTree,
		defaultPreload: "intent",
		context: { queryClient, convexQueryClient },
		scrollRestoration: true,
		defaultErrorComponent: (err) => (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
				<h1 className="text-2xl font-bold">Algo salió mal</h1>
				<p className="text-muted-foreground text-center max-w-md">
					Ocurrió un error inesperado. Intenta recargar la página.
				</p>
				{import.meta.env.DEV && (
					<pre className="text-xs text-destructive-foreground bg-destructive/10 p-4 rounded-lg max-w-full overflow-auto">
						{err.error.message}
						{"\n"}
						{err.error.stack}
					</pre>
				)}
			</div>
		),
		defaultNotFoundComponent: () => <p>not found</p>,
		Wrap: ({ children }) => (
			<ConvexProvider client={convexQueryClient.convexClient}>
				{children}
			</ConvexProvider>
		),
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	return router;
};
