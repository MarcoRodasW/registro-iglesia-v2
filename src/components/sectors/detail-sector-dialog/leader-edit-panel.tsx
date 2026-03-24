import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxPopup,
	ComboboxValue,
} from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import type { LeaderOption } from "./types";

interface LeaderEditPanelProps {
	leaderItems: LeaderOption[];
	pendingIds: string[];
	onChange: (ids: string[]) => void;
	onSave: () => void;
	isSaving: boolean;
	onLeaderSearchChange: (value: string) => void;
}

export function LeaderEditPanel({
	leaderItems,
	pendingIds,
	onChange,
	onSave,
	isSaving,
	onLeaderSearchChange,
}: LeaderEditPanelProps) {
	const selectedItems = leaderItems.filter((item) =>
		pendingIds.includes(item.value),
	);

	return (
		<div className="border-b border-border/50 bg-background/60 backdrop-blur-sm">
			<div className="px-3 pt-3 pb-2 space-y-2">
				<Combobox
					items={leaderItems}
					multiple
					value={selectedItems}
					filter={null}
					onInputValueChange={(value: string) => onLeaderSearchChange(value)}
					onValueChange={(newValue: LeaderOption[] | null) => {
						onChange((newValue ?? []).map((item) => item.value));
					}}
				>
					<ComboboxChips className="min-h-8">
						<ComboboxValue>
							{(value: LeaderOption[]) => (
								<>
									{value?.map((item) => (
										<ComboboxChip key={item.value} aria-label={item.label}>
											{item.label}
										</ComboboxChip>
									))}
									<ComboboxInput
										placeholder={
											value.length > 0 ? undefined : "Buscar líderes..."
										}
										aria-label="Buscar líderes"
									/>
								</>
							)}
						</ComboboxValue>
					</ComboboxChips>
					<ComboboxPopup>
						<ComboboxEmpty>
							No se encontraron líderes disponibles.
						</ComboboxEmpty>
						<ComboboxList>
							{(item: LeaderOption) => (
								<ComboboxItem value={item}>{item.label}</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxPopup>
				</Combobox>

				<div className="flex justify-end">
					<Button
						size="xs"
						onClick={onSave}
						disabled={isSaving}
						className="gap-1.5"
					>
						{isSaving ? (
							<Spinner className="size-3 animate-spin" />
						) : (
							<CheckIcon className="size-3" />
						)}
						Guardar cambios
					</Button>
				</div>
			</div>
		</div>
	);
}
