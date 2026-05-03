import { TableAggregate } from "@convex-dev/aggregate";
import type { Doc, Id } from "./_generated/dataModel";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

const UNASSIGNED_SECTOR = "__unassigned__";

export function roleBounds(role: Doc<"users">["role"]) {
	return {
		lower: { key: role, inclusive: true },
		upper: { key: role, inclusive: true },
	};
}

function memberSectorNamespace(doc: Pick<Doc<"members">, "sectorId">) {
	return doc.sectorId ?? UNASSIGNED_SECTOR;
}

function userSectorNamespace(doc: Pick<Doc<"users">, "sectorId">) {
	return doc.sectorId ?? UNASSIGNED_SECTOR;
}

export const membersByCreationTime = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: "members";
}>(components.membersByCreation, {
	sortKey: (doc) => doc._creationTime,
});

export const membersBySector = new TableAggregate<{
	Namespace: string;
	Key: number;
	DataModel: DataModel;
	TableName: "members";
}>(components.membersBySector, {
	namespace: memberSectorNamespace,
	sortKey: (doc) => doc._creationTime,
});

export const usersBySectorAndRole = new TableAggregate<{
	Namespace: string;
	Key: Doc<"users">["role"];
	DataModel: DataModel;
	TableName: "users";
}>(components.usersBySectorAndRole, {
	namespace: userSectorNamespace,
	sortKey: (doc) => doc.role,
});

export async function countLeadersInSector(
	ctx: Parameters<typeof usersBySectorAndRole.count>[0],
	sectorId: Id<"sectors">,
) {
	const [leaderCount, adminCount] = await Promise.all([
		usersBySectorAndRole.count(ctx, {
			namespace: sectorId,
			bounds: roleBounds("leader"),
		}),
		usersBySectorAndRole.count(ctx, {
			namespace: sectorId,
			bounds: roleBounds("admin"),
		}),
	]);

	return leaderCount + adminCount;
}
