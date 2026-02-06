import { api } from "@convex/api";
import type { Doc } from "@convex/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import {
	type QueryKey,
	useInfiniteQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { PaginationResult } from "convex/server";
import { useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";

export type MemberData = Doc<"members">;
export type MembersListResponse = PaginationResult<MemberData>;

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
	queryKey: QueryKey;
}

const PAGE_SIZE = 25;

export function getMembersListQueryKey(search?: string): QueryKey {
	return ["infiniteMembers", { search: search || undefined }];
}

export function useMembersList(): UseMembersListReturn {
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [showJumpToTop, setShowJumpToTop] = useState(false);
	const queryClient = useQueryClient();

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const queryKey = useMemo(
		() => getMembersListQueryKey(debouncedSearch),
		[debouncedSearch],
	);
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
		error,
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

	const pages = data?.pages ?? [];
	const allMembers: MemberData[] = pages.flatMap((page) => page?.page ?? []);
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
