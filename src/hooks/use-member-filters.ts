import { useCallback, useDeferredValue, useMemo, useState } from "react";
import type { MemberData } from "./use-members-list";

export type FilterKey = "registrationMonth";

export interface FilterOption {
	label: string;
	value: string;
}

export interface FilterDefinition {
	key: FilterKey;
	label: string;
	getOptions: (members: MemberData[]) => FilterOption[];
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
): Record<FilterKey, FilterOption[]> {
	const deferredMembers = useDeferredValue(allMembers);

	return useMemo(() => {
		const result = {} as Record<FilterKey, FilterOption[]>;
		for (const def of FILTER_DEFINITIONS) {
			result[def.key] = def.getOptions(deferredMembers);
		}
		return result;
	}, [deferredMembers]);
}
