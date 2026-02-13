import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthCard } from "@/components/login/auth-card";

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
		<div className="relative flex min-h-svh w-full overflow-hidden bg-[#0c0a14]">
			{/* ── Mobile: blurred full-screen background ── */}
			<div className="absolute inset-0 lg:hidden" aria-hidden="true">
				<img
					src="/church_hero_bg.jpg"
					alt=""
					className="h-full w-full object-cover object-[center_40%] scale-110 blur-md brightness-[0.3] saturate-[0.7]"
				/>
				{/* dark vignette overlay */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(12,10,20,0.9)_100%)]" />
			</div>

			{/* ── Desktop: hero image panel (left) ── */}
			<div className="relative hidden lg:flex lg:w-[62%] xl:w-[65%] items-end overflow-hidden">
				<img
					src="/church_hero_bg.jpg"
					alt="Iglesia Casa de David - Servicio de adoración"
					className="absolute inset-0 h-full w-full object-cover object-[center_35%] animate-login-image-reveal"
				/>
				{/* gradient overlays for depth */}
				<div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-[#0c0a14]" />
				<div className="absolute inset-0 bg-linear-to-t from-[#0c0a14] via-[#0c0a14]/40 to-[#0c0a14]/20" />
				{/* extra bottom fade to mask baked-in text */}
				<div className="absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-[#0c0a14] via-[#0c0a14]/80 to-transparent" />

				{/* bottom text overlay */}
				<div className="relative z-10 p-10 xl:p-14 pb-12 xl:pb-16 animate-login-text-reveal">
					<h1 className="text-white text-5xl xl:text-6xl font-extrabold leading-tight">
						Casa de David
					</h1>
					<p className="text-[#f5c518] text-3xl xl:text-4xl font-bold mt-1">
						Puerto Cortés
					</p>
					<div className="mt-4 flex items-stretch gap-4 max-w-lg">
						<div className="w-1 shrink-0 bg-[#f5c518] rounded-full" />
						<p className="text-white text-lg xl:text-xl font-semibold italic leading-relaxed">
							"Sin techos, Sin Límites, Sin Fronteras, somos uno en Amor, somos
							Familia"
						</p>
					</div>
				</div>
			</div>

			{/* ── Auth panel (right on desktop, centered on mobile) ── */}
			<div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-16 lg:bg-[#0c0a14]">
				{/* decorative vertical line */}
				<div className="absolute left-0 top-[15%] bottom-[15%] hidden lg:block w-px bg-linear-to-b from-transparent via-violet-500/15 to-transparent" />

				<div className="w-full max-w-sm animate-login-card-reveal">
					<AuthCard />
				</div>

				{/* footer */}
				<p className="mt-10 text-center text-xs text-white/25 lg:text-white/15 font-[Cormorant_Garamond,Georgia,serif] tracking-wider">
					Puerto Cortés, Honduras
				</p>
			</div>
		</div>
	);
}
