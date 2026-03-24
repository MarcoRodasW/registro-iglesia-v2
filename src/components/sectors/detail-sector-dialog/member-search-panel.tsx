import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { MemberOption } from "./types";

interface MemberSearchPanelProps {
	members: MemberOption[];
	isSearching: boolean;
	search: string;
	onSearchChange: (v: string) => void;
	selectedIds: string[];
	onToggle: (id: string) => void;
	onAssign: () => void;
	isAssigning: boolean;
}

export function MemberSearchPanel({
	members,
	isSearching,
	search,
	onSearchChange,
	selectedIds,
	onToggle,
	onAssign,
	isAssigning,
}: MemberSearchPanelProps) {
	return (
		<div className="border-b border-border/50 bg-background/60 backdrop-blur-sm">
			<div className="px-3 pt-3 pb-2 space-y-2">
				<div className="relative">
					<input
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Buscar miembro..."
						// biome-ignore lint/a11y/noAutofocus: improve mobile and keyboard UX in inline editor
						autoFocus
						className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background transition-shadow"
					/>
					{isSearching ? (
						<span className="absolute right-2.5 top-1/2 -translate-y-1/2">
							<Spinner className="size-3.5 animate-spin text-muted-foreground" />
						</span>
					) : null}
				</div>

				{members.length > 0 ? (
					<div className="max-h-40 overflow-y-auto rounded-md border border-border/50 divide-y divide-border/40">
						{members.map((member) => {
							const selected = selectedIds.includes(member.id);

							return (
								<button
									key={member.id}
									type="button"
									onClick={() => onToggle(member.id)}
									className={cn(
										"w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
										selected
											? "bg-primary/8 text-primary"
											: "hover:bg-accent/60 text-foreground",
									)}
								>
									<span
										className={cn(
											"size-4 shrink-0 rounded border flex items-center justify-center transition-colors",
											selected
												? "bg-primary border-primary text-primary-foreground"
												: "border-input bg-background",
										)}
									>
										{selected ? (
											<CheckIcon className="size-2.5 stroke-[3]" />
										) : null}
									</span>
									<span className="truncate">{member.fullName}</span>
								</button>
							);
						})}
					</div>
				) : search.length > 0 && !isSearching ? (
					<p className="text-center text-xs text-muted-foreground py-3">
						No se encontraron miembros sin sector
					</p>
				) : (
					<p className="text-center text-xs text-muted-foreground py-3">
						Escribe para buscar miembros disponibles
					</p>
				)}

				{selectedIds.length > 0 ? (
					<div className="flex items-center justify-between pt-1">
						<span className="text-xs text-muted-foreground">
							{selectedIds.length} seleccionado
							{selectedIds.length !== 1 ? "s" : ""}
						</span>
						<Button
							size="xs"
							onClick={onAssign}
							disabled={isAssigning}
							className="gap-1.5"
						>
							{isAssigning ? (
								<Spinner className="size-3 animate-spin" />
							) : (
								<CheckIcon className="size-3" />
							)}
							Asignar al sector
						</Button>
					</div>
				) : null}
			</div>
		</div>
	);
}
