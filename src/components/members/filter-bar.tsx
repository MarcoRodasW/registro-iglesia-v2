import { CalendarIcon, FilterIcon, MapPinIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Menu,
	MenuGroup,
	MenuGroupLabel,
	MenuItem,
	MenuPopup,
	MenuSeparator,
	MenuSub,
	MenuSubPopup,
	MenuSubTrigger,
	MenuTrigger,
} from "@/components/ui/menu";
import { Separator } from "@/components/ui/separator";
import {
	FILTER_DEFINITIONS,
	type FilterKey,
	type FilterOption,
	type UseFiltersReturn,
} from "@/hooks/use-member-filters";

const FILTER_ICONS: Record<FilterKey, ReactNode> = {
	registrationMonth: <CalendarIcon className="size-3.5" />,
	sectorId: <MapPinIcon className="size-3.5" />,
};

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

	const activeFilterCount = filters.activeFilterCount;

	return (
		<div className="flex min-w-0 items-center gap-2">
			<Menu>
				<MenuTrigger
					render={
						<Button
							variant={activeFilterCount > 0 ? "default" : "outline"}
							size="sm"
							className="max-w-full gap-1.5"
						>
							<FilterIcon className="size-3.5" />
							<span>Filtros</span>
							{activeFilterCount > 0 && (
								<span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
									{activeFilterCount}
								</span>
							)}
						</Button>
					}
				/>
				<MenuPopup align="end" sideOffset={8} className="w-72">
					<MenuGroup>
						<MenuGroupLabel>Filtrar miembros</MenuGroupLabel>
						{FILTER_DEFINITIONS.map((definition) => {
							const selectedValues =
								activeFilters[definition.key] ?? new Set<string>();
							const options = filterOptions[definition.key];

							return (
								<MenuSub key={definition.key}>
									<MenuSubTrigger>
										<span className="opacity-70">
											{FILTER_ICONS[definition.key]}
										</span>
										<span className="flex-1 truncate">{definition.label}</span>
										{selectedValues.size > 0 && (
											<span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-foreground">
												{selectedValues.size}
											</span>
										)}
									</MenuSubTrigger>
									<MenuSubPopup className="w-64">
										<div className="px-2 py-1.5">
											<p className="text-xs font-medium text-muted-foreground">
												Selecciona uno o varios
											</p>
										</div>
										<MenuSeparator />
										{options.length === 0 ? (
											<div className="px-2 py-2 text-xs text-muted-foreground">
												Sin opciones disponibles
											</div>
										) : (
											options.map((option) => {
												const checked = selectedValues.has(option.value);
												return (
													<MenuItem
														key={option.value}
														onClick={() => {
															setFilter(
																definition.key,
																toggleValueSelection(
																	selectedValues,
																	option.value,
																),
															);
														}}
														closeOnClick={false}
													>
														<Checkbox
															checked={checked}
															className="pointer-events-none size-3.5"
														/>
														<span className="truncate text-xs">
															{option.label}
														</span>
													</MenuItem>
												);
											})
										)}
										{selectedValues.size > 0 && (
											<>
												<MenuSeparator />
												<MenuItem onClick={() => clearFilter(definition.key)}>
													<XIcon className="size-3.5" />
													Limpiar este filtro
												</MenuItem>
											</>
										)}
									</MenuSubPopup>
								</MenuSub>
							);
						})}
						{activeFilterCount > 0 && (
							<>
								<MenuSeparator />
								<MenuItem onClick={clearAllFilters}>
									<XIcon className="size-3.5" />
									Limpiar todos los filtros
								</MenuItem>
							</>
						)}
					</MenuGroup>
				</MenuPopup>
			</Menu>

			{activeFilterCount > 0 && (
				<>
					<Separator orientation="vertical" className="h-5" />
					<button
						type="button"
						onClick={clearAllFilters}
						className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-xs transition-colors"
					>
						<XIcon className="size-3" />
						Limpiar filtros
					</button>
				</>
			)}
		</div>
	);
}
