import { useCallback, useDeferredValue, useMemo, useState } from "react";
import type { MemberData } from "./use-members-list";

export type FilterKey = "registrationMonth" | "sectorId";

const UNASSIGNED_SECTOR_FILTER_VALUE = "__unassigned_sector__";

export interface FilterOption {
	label: string;
	value: string;
}

export interface FilterDefinition {
	key: FilterKey;
	label: string;
	getOptions: (
		members: MemberData[],
		context: { sectorNameById?: ReadonlyMap<string, string> },
	) => FilterOption[];
	apply: (member: MemberData, selectedValues: Set<string>) => boolean;
}

const MONTH_NAMES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
] as const;

function getMonthYearKey(timestamp: number): string {
	const date = new Date(timestamp);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthYearLabel(key: string): string {
	const [year, month] = key.split("-");
	const monthIndex = Number.parseInt(month ?? "1", 10) - 1;
	const monthName = MONTH_NAMES[monthIndex] ?? MONTH_NAMES[0];
	return `${monthName} ${year}`;
}

function getSectorOptionLabel(
	sectorId: string,
	sectorNameById?: ReadonlyMap<string, string>,
): string {
	const sectorName = sectorNameById?.get(sectorId);
	if (sectorName) {
		return sectorName;
	}

	return `Sector ${sectorId.slice(-4)}`;
}

export const FILTER_DEFINITIONS: FilterDefinition[] = [
	{
		key: "registrationMonth",
		label: "Mes de registro",
		getOptions: (members) => {
			const keySet = new Set<string>();
			for (const m of members) {
				if (m.firstVisitDate) {
					keySet.add(getMonthYearKey(m.firstVisitDate));
				}
			}
			return Array.from(keySet)
				.sort((a, b) => b.localeCompare(a))
				.map((key) => ({ value: key, label: getMonthYearLabel(key) }));
		},
		apply: (member, selectedValues) => {
			if (!member.firstVisitDate) return false;
			const key = getMonthYearKey(member.firstVisitDate);
			return selectedValues.has(key);
		},
	},
	{
		key: "sectorId",
		label: "Sector",
		getOptions: (members, context) => {
			const sectorIds = new Set<string>();
			let hasUnassignedMembers = false;

			for (const member of members) {
				if (!member.sectorId) {
					hasUnassignedMembers = true;
					continue;
				}

				sectorIds.add(member.sectorId);
			}

			const options = Array.from(sectorIds)
				.map((sectorId) => ({
					value: sectorId,
					label: getSectorOptionLabel(sectorId, context.sectorNameById),
				}))
				.sort((a, b) => a.label.localeCompare(b.label, "es"));

			if (hasUnassignedMembers) {
				options.push({
					value: UNASSIGNED_SECTOR_FILTER_VALUE,
					label: "Sin sector",
				});
			}

			return options;
		},
		apply: (member, selectedValues) => {
			if (!member.sectorId) {
				return selectedValues.has(UNASSIGNED_SECTOR_FILTER_VALUE);
			}

			return selectedValues.has(member.sectorId);
		},
	},
];

const FILTER_DEFINITIONS_BY_KEY = FILTER_DEFINITIONS.reduce(
	(result, definition) => {
		result[definition.key] = definition;
		return result;
	},
	{} as Record<FilterKey, FilterDefinition>,
);

export type ActiveFilters = Partial<Record<FilterKey, Set<string>>>;

export interface UseFiltersReturn {
	activeFilters: ActiveFilters;
	setFilter: (key: FilterKey, values: Set<string>) => void;
	clearFilter: (key: FilterKey) => void;
	clearAllFilters: () => void;
	hasActiveFilters: boolean;
	activeFilterCount: number;
}

export function useFilters(): UseFiltersReturn {
	const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

	const setFilter = useCallback((key: FilterKey, values: Set<string>) => {
		setActiveFilters((prev) => {
			if (values.size === 0) {
				if (!prev[key]) {
					return prev;
				}

				const next = { ...prev };
				delete next[key];
				return next;
			}

			return { ...prev, [key]: values };
		});
	}, []);

	const clearFilter = useCallback((key: FilterKey) => {
		setActiveFilters((prev) => {
			if (!prev[key]) {
				return prev;
			}

			const next = { ...prev };
			delete next[key];
			return next;
		});
	}, []);

	const clearAllFilters = useCallback(() => {
		setActiveFilters((prev) => {
			if (Object.keys(prev).length === 0) {
				return prev;
			}

			return {};
		});
	}, []);

	const activeFilterCount = useMemo(
		() =>
			Object.values(activeFilters).reduce(
				(count, filterValues) => count + (filterValues?.size ?? 0),
				0,
			),
		[activeFilters],
	);
	const hasActiveFilters = activeFilterCount > 0;

	return useMemo(
		() => ({
			activeFilters,
			setFilter,
			clearFilter,
			clearAllFilters,
			hasActiveFilters,
			activeFilterCount,
		}),
		[
			activeFilters,
			setFilter,
			clearFilter,
			clearAllFilters,
			hasActiveFilters,
			activeFilterCount,
		],
	);
}

export function applyFilters(
	members: MemberData[],
	activeFilters: ActiveFilters,
): MemberData[] {
	const activeEntries = Object.entries(activeFilters).filter(([, values]) =>
		Boolean(values && values.size > 0),
	) as [FilterKey, Set<string>][];

	if (activeEntries.length === 0) return members;

	return members.filter((member) =>
		activeEntries.every(([key, selectedValues]) => {
			return FILTER_DEFINITIONS_BY_KEY[key].apply(member, selectedValues);
		}),
	);
}

export function useFilterOptions(
	allMembers: MemberData[],
	sectorNameById?: ReadonlyMap<string, string>,
): Record<FilterKey, FilterOption[]> {
	const deferredMembers = useDeferredValue(allMembers);

	return useMemo(() => {
		const result = {} as Record<FilterKey, FilterOption[]>;
		for (const def of FILTER_DEFINITIONS) {
			result[def.key] = def.getOptions(deferredMembers, { sectorNameById });
		}
		return result;
	}, [deferredMembers, sectorNameById]);
}
