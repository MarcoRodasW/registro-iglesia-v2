import { api } from "@convex/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangleIcon } from "lucide-react";

import { PublicMemberRegistrationForm } from "@/components/members/public-member-registration-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/registro/$token")({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(
			convexQuery(api.members.getPublicRegistrationLinkInfo, {
				token: params.token,
			}),
		),
	component: PublicRegistrationPage,
});

function PublicRegistrationPage() {
	const { token } = Route.useParams();
	const { data } = useSuspenseQuery(
		convexQuery(api.members.getPublicRegistrationLinkInfo, {
			token,
		}),
	);

	return (
		<div className="min-h-svh bg-muted/30 py-8 px-4">
			<div className="mx-auto w-full max-w-2xl">
				<header className="mb-6 text-center">
					<img
						src="/church_logo.png"
						alt="Casa de David Puerto Cortes"
						className="mx-auto mb-3 h-12 w-auto"
					/>
					<h1 className="text-2xl sm:text-3xl font-bold">
						Registro de nuevos miembros
					</h1>
					<p className="text-muted-foreground mt-2 text-sm sm:text-base">
						Completa el formulario para registrar tus datos.
					</p>
				</header>

				{!data.isValid ? (
					<Alert variant="error">
						<AlertTriangleIcon className="size-4" />
						<AlertTitle>Enlace no disponible</AlertTitle>
						<AlertDescription>
							{data.message ??
								"Este enlace no esta disponible. Solicita un enlace nuevo al lider de tu sector."}
						</AlertDescription>
					</Alert>
				) : (
					<PublicMemberRegistrationForm
						token={token}
						sectorName={data.sectorName ?? "Sector"}
					/>
				)}
			</div>
		</div>
	);
}
