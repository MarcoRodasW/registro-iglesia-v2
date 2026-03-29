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

export type MemberData = Doc<"members">;
export interface UseMembersListReturn {
	members: MemberData[];
	totalCount: number;
	isLoading: boolean;
	error: Error | null;
	search: string;
	setSearch: (value: string) => void;
	showJumpToTop: boolean;
	handleJumpToTop: () => void;
	filteredCount: number;
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

	const members = useMemo(
		() =>
			normalizedSearch
				? allMembers.filter((member) =>
						member.fullName.toLowerCase().includes(normalizedSearch),
					)
				: allMembers,
		[allMembers, normalizedSearch],
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

	return {
		members,
		totalCount,
		isLoading,
		error: error ?? null,
		search,
		setSearch,
		showJumpToTop,
		handleJumpToTop,
		filteredCount,
	};
}
