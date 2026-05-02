import { CalendarIcon, ChevronDownIcon, FilterIcon, XIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverClose,
	PopoverPopup,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
	FILTER_DEFINITIONS,
	type FilterKey,
	type FilterOption,
	type UseFiltersReturn,
} from "@/hooks/use-member-filters";

const FILTER_ICONS: Record<FilterKey, ReactNode> = {
	registrationMonth: <CalendarIcon className="size-3.5" />,
};

function getSelectedLabels(
	selectedValues: Set<string>,
	options: FilterOption[],
): string {
	const labelsByValue = new Map(
		options.map((option) => [option.value, option.label]),
	);

	return Array.from(selectedValues, (value) => labelsByValue.get(value) ?? value).join(
		", ",
	);
}

function toggleValueSelection(
	selectedValues: Set<string> | undefined,
	value: string,
) {
	const next = new Set(selectedValues);

	if (next.has(value)) {
		next.delete(value);
		return next;
	}

	next.add(value);
	return next;
}

interface FilterBarProps {
	filters: UseFiltersReturn;
	filterOptions: Record<FilterKey, FilterOption[]>;
}

export function FilterBar({ filters, filterOptions }: FilterBarProps) {
	const { activeFilters, setFilter, clearFilter, clearAllFilters } = filters;
	const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<AddFilterButton
				filterOptions={filterOptions}
				activeFilters={activeFilters}
				openFilter={openFilter}
				setOpenFilter={setOpenFilter}
				setFilter={setFilter}
				clearFilter={clearFilter}
			/>

			{FILTER_DEFINITIONS.map((def) => {
				const selected = activeFilters[def.key];
				if (!selected || selected.size === 0) return null;

				const options = filterOptions[def.key];
				const selectedLabels = getSelectedLabels(selected, options);

				return (
					<ActiveFilterChip
						key={def.key}
						label={def.label}
						selectedValues={selected}
						selectedLabels={selectedLabels}
						options={options}
						icon={FILTER_ICONS[def.key]}
						isOpen={openFilter === def.key}
						onOpenChange={(open) => setOpenFilter(open ? def.key : null)}
						onToggleValue={(value) =>
							setFilter(def.key, toggleValueSelection(selected, value))
						}
						onClear={() => clearFilter(def.key)}
					/>
				);
			})}

			{filters.hasActiveFilters && (
				<>
					<Separator orientation="vertical" className="h-5" />
					<button
						type="button"
						onClick={clearAllFilters}
						className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-xs transition-colors"
					>
						<XIcon className="size-3" />
						Limpiar
					</button>
				</>
			)}
		</div>
	);
}

interface AddFilterButtonProps {
	filterOptions: Record<FilterKey, FilterOption[]>;
	activeFilters: UseFiltersReturn["activeFilters"];
	openFilter: FilterKey | null;
	setOpenFilter: (key: FilterKey | null) => void;
	setFilter: UseFiltersReturn["setFilter"];
	clearFilter: UseFiltersReturn["clearFilter"];
}

function AddFilterButton({
	filterOptions,
	activeFilters,
	openFilter,
	setOpenFilter,
	setFilter,
	clearFilter,
}: AddFilterButtonProps) {
	const inactiveFilters = FILTER_DEFINITIONS.filter((definition) => {
		const selectedValues = activeFilters[definition.key];
		return !selectedValues || selectedValues.size === 0;
	});

	if (inactiveFilters.length === 0) {
		return null;
	}

	return (
		<>
			{inactiveFilters.map((definition) => {
				const selectedValues = activeFilters[definition.key] ?? new Set<string>();
				const options = filterOptions[definition.key];
				const isOpen = openFilter === definition.key;

				return (
					<FilterPopover
						key={definition.key}
						label={definition.label}
						options={options}
						selectedValues={selectedValues}
						isOpen={isOpen}
						onOpenChange={(open) => setOpenFilter(open ? definition.key : null)}
						onToggleValue={(value) =>
							setFilter(definition.key, toggleValueSelection(selectedValues, value))
						}
						onClear={() => clearFilter(definition.key)}
						trigger={
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5 text-xs border-dashed"
							>
								<FilterIcon className="size-3" />
								{definition.label}
							</Button>
						}
					/>
				);
			})}
		</>
	);
}

interface FilterPopoverProps {
	label: string;
	options: FilterOption[];
	selectedValues: Set<string>;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onToggleValue: (value: string) => void;
	onClear: () => void;
	trigger: ReactElement;
}

function FilterPopover({
	label,
	options,
	selectedValues,
	isOpen,
	onOpenChange,
	onToggleValue,
	onClear,
	trigger,
}: FilterPopoverProps) {
	return (
		<Popover open={isOpen} onOpenChange={onOpenChange}>
			<PopoverTrigger render={trigger} />
			<PopoverPopup align="start" sideOffset={6} className="w-56 p-0">
				<div className="flex items-center justify-between border-b px-3 py-2">
					<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						{label}
					</span>
					{selectedValues.size > 0 && (
						<button
							type="button"
							onClick={onClear}
							className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						>
							Limpiar
						</button>
					)}
				</div>

				<div className="p-1.5">
					{options.length === 0 ? (
						<p className="px-2 py-3 text-center text-xs text-muted-foreground">
							Sin opciones disponibles
						</p>
					) : (
						<div className="space-y-0.5">
							{options.map((opt) => {
								const checked = selectedValues.has(opt.value);
								return (
									<button
										type="button"
										key={opt.value}
										aria-pressed={checked}
										onClick={() => onToggleValue(opt.value)}
										className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm cursor-pointer hover:bg-accent transition-colors select-none"
									>
										<Checkbox
											checked={checked}
											className="size-3.5 pointer-events-none"
										/>
										<span className="flex-1 text-xs">{opt.label}</span>
										{checked && (
											<span className="size-1.5 rounded-full bg-primary shrink-0" />
										)}
									</button>
								);
							})}
						</div>
					)}
				</div>

				{selectedValues.size > 0 && (
					<div className="border-t px-3 py-2">
						<PopoverClose
							render={
								<button
									type="button"
									className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
								>
									Aplicar ({selectedValues.size}{" "}
									{selectedValues.size === 1 ? "seleccionado" : "seleccionados"}
									)
								</button>
							}
						/>
					</div>
				)}
			</PopoverPopup>
		</Popover>
	);
}

interface ActiveFilterChipProps {
	label: string;
	selectedValues: Set<string>;
	selectedLabels: string;
	options: FilterOption[];
	icon: ReactNode;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onToggleValue: (value: string) => void;
	onClear: () => void;
}

function ActiveFilterChip({
	label,
	selectedValues,
	selectedLabels,
	options,
	icon,
	isOpen,
	onOpenChange,
	onToggleValue,
	onClear,
}: ActiveFilterChipProps) {
	return (
		<div className="flex h-7 items-stretch overflow-hidden rounded-full border border-primary/30 bg-primary/5 text-xs ring-0 transition-all hover:border-primary/50">
			<FilterPopover
				label={label}
				options={options}
				selectedValues={selectedValues}
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				onToggleValue={onToggleValue}
				onClear={onClear}
				trigger={
					<button
						type="button"
						className="flex items-center gap-1.5 pl-2.5 pr-2 cursor-pointer text-primary/80 hover:text-primary transition-colors"
					>
						<span className="opacity-70">{icon}</span>
						<span className="font-medium text-muted-foreground">{label}:</span>
						<span
							className="max-w-28 truncate font-medium text-foreground"
							title={selectedLabels}
						>
							{selectedLabels}
						</span>
						<ChevronDownIcon className="size-3 opacity-50" />
					</button>
				}
			/>

			<button
				type="button"
				onClick={onClear}
				className="flex cursor-pointer items-center border-l border-primary/20 px-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
				aria-label="Eliminar filtro"
			>
				<XIcon className="size-3" />
			</button>
		</div>
	);
}
