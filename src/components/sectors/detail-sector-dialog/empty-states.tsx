import { PlusIcon, ShieldIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyMembers({ onAdd }: { onAdd: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center py-10 text-center gap-2.5">
			<div className="size-10 rounded-full bg-muted flex items-center justify-center">
				<UsersIcon className="size-5 text-muted-foreground/60" />
			</div>
			<div>
				<p className="text-sm text-muted-foreground font-medium">
					Sin miembros asignados
				</p>
				<p className="text-xs text-muted-foreground/60 mt-0.5">
					Agrega miembros a este sector
				</p>
			</div>
			<Button size="xs" variant="outline" onClick={onAdd} className="gap-1.5">
				<PlusIcon className="size-3" />
				Agregar miembros
			</Button>
		</div>
	);
}

export function EmptyLeaders({ onManage }: { onManage: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center py-8 text-center gap-2">
			<div className="size-8 rounded-full bg-muted flex items-center justify-center">
				<ShieldIcon className="size-4 text-muted-foreground/60" />
			</div>
			<p className="text-sm text-muted-foreground">Sin líderes asignados</p>
			<Button
				size="xs"
				variant="outline"
				onClick={onManage}
				className="gap-1.5"
			>
				<PlusIcon className="size-3" />
				Asignar líderes
			</Button>
		</div>
	);
}
