import { Skeleton } from "@/components/ui/skeleton";

export function MembersTableSkeleton() {
	return (
		<div className="p-4 space-y-3">
			{Array.from({ length: 5 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
				<div key={i} className="flex gap-4">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-40" />
				</div>
			))}
		</div>
	);
}

export function LeadersListSkeleton() {
	return (
		<div className="p-4 space-y-3">
			{Array.from({ length: 4 }).map((_, index) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
					key={`leader-skeleton-${index}`}
					className="flex items-center gap-3"
				>
					<Skeleton className="size-7 rounded-full" />
					<div className="space-y-1.5 flex-1">
						<Skeleton className="h-3 w-32" />
						<Skeleton className="h-3 w-44" />
					</div>
				</div>
			))}
		</div>
	);
}
