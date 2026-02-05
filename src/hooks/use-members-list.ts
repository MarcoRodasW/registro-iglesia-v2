import { api } from "@convex/api";
import type { Doc } from "@convex/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import {
	type QueryKey,
	useInfiniteQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { PaginationResult } from "convex/server";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

// ============================================================================
// Types - Using Convex generated types
// ============================================================================

/** Member document type - inferred from Convex schema */
export type MemberData = Doc<"members">;

/** Pagination response type - using Convex's PaginationResult */
export type MembersListResponse = PaginationResult<MemberData>;

export interface UseMembersListReturn {
	members: MemberData[];
	totalCount: number;
	isLoading: boolean;
	isFetchingNextPage: boolean;
	hasNextPage: boolean;
	fetchNextPage: () => void;
	error: Error | null;
	// Search functionality
	search: string;
	setSearch: (value: string) => void;
	debouncedSearch: string;
	// UI state
	showJumpToTop: boolean;
	handleJumpToTop: () => void;
	// Ref for intersection observer
	loadMoreRef: (node?: Element | null) => void;
	// Total counts
	totalLoaded: number;
	// Query key for invalidation
	queryKey: QueryKey;
}

const PAGE_SIZE = 25;

/** Query key factory for members list queries */
export function getMembersListQueryKey(search?: string): QueryKey {
	return convexQuery(api.members.list, {
		paginationOpts: { numItems: PAGE_SIZE, cursor: null },
		search: search || undefined,
	}).queryKey;
}

// ============================================================================
// Hook
// ============================================================================

export function useMembersList(): UseMembersListReturn {
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [showJumpToTop, setShowJumpToTop] = useState(false);
	const queryClient = useQueryClient();

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	// Build query key using convexQuery for consistency
	const queryKey = getMembersListQueryKey(debouncedSearch);

	// Infinite scroll query
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
		error,
		refetch,
	} = useInfiniteQuery({
		queryKey,
		queryFn: async ({ pageParam }) => {
			const result = await queryClient.fetchQuery(
				convexQuery(api.members.list, {
					paginationOpts: {
						numItems: PAGE_SIZE,
						cursor: pageParam as string | null,
					},
					search: debouncedSearch || undefined,
				}),
			);
			return result as MembersListResponse;
		},
		getNextPageParam: (lastPage: MembersListResponse) => {
			if (!lastPage || lastPage.isDone) return undefined;
			return lastPage.continueCursor;
		},
		initialPageParam: null as string | null,
	});

	// Reset query when search changes
	useEffect(() => {
		if (debouncedSearch !== undefined) {
			refetch();
		}
	}, [debouncedSearch, refetch]);

	// Flatten all pages
	const pages = data?.pages ?? [];
	const allMembers: MemberData[] = pages.flatMap((page) => page?.page ?? []);

	// Intersection observer for auto-loading
	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0,
		rootMargin: "100px",
	});

	// Since Convex paginated results don't include total count,
	// we estimate based on current loaded count plus one more page if there's more
	const totalLoaded = allMembers.length;
	const totalCount = hasNextPage ? totalLoaded + PAGE_SIZE : totalLoaded;

	// Auto-load first page when in view and search is empty
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

	// Track scroll position for Jump to Top button
	useEffect(() => {
		const handleScroll = () => {
			setShowJumpToTop(window.scrollY > 300);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleJumpToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return {
		members: allMembers,
		totalCount,
		isLoading,
		isFetchingNextPage,
		hasNextPage: hasNextPage ?? false,
		fetchNextPage,
		error: isError ? error : null,
		search,
		setSearch,
		debouncedSearch,
		showJumpToTop,
		handleJumpToTop,
		loadMoreRef,
		totalLoaded,
		queryKey,
	};
}
