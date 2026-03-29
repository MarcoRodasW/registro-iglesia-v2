import { api } from "@convex/api";
import type { Doc } from "@convex/dataModel";
import { usePaginatedQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";

export type MemberData = Doc<"members">;
export interface UseMembersListReturn {
	members: MemberData[];
	totalCount: number;
	isLoading: boolean;
	isFetchingNextPage: boolean;
	hasNextPage: boolean;
	fetchNextPage: () => void;
	error: Error | null;
	search: string;
	setSearch: (value: string) => void;
	debouncedSearch: string;
	showJumpToTop: boolean;
	handleJumpToTop: () => void;
	loadMoreRef: (node?: Element | null) => void;
	totalLoaded: number;
}

const PAGE_SIZE = 25;

export function useMembersList(): UseMembersListReturn {
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [showJumpToTop, setShowJumpToTop] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const queryArgs = useMemo(
		() => ({ search: debouncedSearch || undefined }),
		[debouncedSearch],
	);
	const { results, status, loadMore } = usePaginatedQuery(
		api.members.list,
		queryArgs,
		{ initialNumItems: PAGE_SIZE },
	);

	const isLoading = status === "LoadingFirstPage";
	const isFetchingNextPage = status === "LoadingMore";
	const hasNextPage = status === "CanLoadMore";
	const fetchNextPage = useCallback(() => {
		loadMore(PAGE_SIZE);
	}, [loadMore]);

	const allMembers = results ?? [];
	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0,
		rootMargin: "100px",
	});

	const totalLoaded = allMembers.length;
	const totalCount = hasNextPage ? totalLoaded + PAGE_SIZE : totalLoaded;
	useEffect(() => {
		if (
			inView &&
			!debouncedSearch &&
			totalLoaded === 0 &&
			hasNextPage &&
			!isFetchingNextPage
		) {
			fetchNextPage();
		}
	}, [
		inView,
		debouncedSearch,
		totalLoaded,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	]);

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
		members: allMembers,
		totalCount,
		isLoading,
		isFetchingNextPage,
		hasNextPage: hasNextPage ?? false,
		fetchNextPage,
		error: null,
		search,
		setSearch,
		debouncedSearch,
		showJumpToTop,
		handleJumpToTop,
		loadMoreRef,
		totalLoaded,
	};
}
