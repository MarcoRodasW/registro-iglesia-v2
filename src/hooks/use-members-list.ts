import { api } from "@convex/api";
import type { Doc } from "@convex/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import {
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	type UseFiltersReturn,
	applyFilters,
	useFilterOptions,
	useFilters,
} from "./use-member-filters";

export type MemberData = Doc<"members">;
export interface UseMembersListReturn {
	members: MemberData[];
	allMembers: MemberData[];
	totalCount: number;
	isLoading: boolean;
	error: Error | null;
	search: string;
	setSearch: (value: string) => void;
	showJumpToTop: boolean;
	handleJumpToTop: () => void;
	filteredCount: number;
	filters: UseFiltersReturn;
	filterOptions: ReturnType<typeof useFilterOptions>;
}

export function useMembersList(): UseMembersListReturn {
	const [search, setSearch] = useState("");
	const [showJumpToTop, setShowJumpToTop] = useState(false);
	const deferredSearch = useDeferredValue(search);
	const normalizedSearch = deferredSearch.trim().toLowerCase();

	const {
		data: allMembers = [],
		isLoading,
		error,
	} = useQuery(convexQuery(api.members.list, {}));

	const filters = useFilters();
	const filterOptions = useFilterOptions(allMembers);

	const membersMatchingSearch = useMemo(() => {
		if (!normalizedSearch) {
			return allMembers;
		}

		return allMembers.filter((member) =>
			member.fullName.toLowerCase().includes(normalizedSearch),
		);
	}, [allMembers, normalizedSearch]);

	const members = useMemo(
		() => applyFilters(membersMatchingSearch, filters.activeFilters),
		[membersMatchingSearch, filters.activeFilters],
	);

	const totalCount = allMembers.length;
	const filteredCount = members.length;

	useEffect(() => {
		const handleScroll = () => {
			setShowJumpToTop(window.scrollY > 300);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleJumpToTop = useCallback(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	return useMemo(
		() => ({
			members,
			allMembers,
			totalCount,
			isLoading,
			error: error ?? null,
			search,
			setSearch,
			showJumpToTop,
			handleJumpToTop,
			filteredCount,
			filters,
			filterOptions,
		}),
		[
			members,
			allMembers,
			totalCount,
			isLoading,
			error,
			search,
			showJumpToTop,
			handleJumpToTop,
			filteredCount,
			filters,
			filterOptions,
		],
	);
}
