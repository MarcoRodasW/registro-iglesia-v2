import type { VisibilityState } from "@tanstack/react-table";

export interface RoleVisibilityConfig {
	roles: Record<string, string[]>;
	allColumnIds: string[];
	alwaysVisible?: string[];
}

export function getColumnVisibilityForRole(
	role: string,
	config: RoleVisibilityConfig,
): VisibilityState {
	const visibleIds = new Set(config.roles[role] ?? []);
	const alwaysVisible = new Set(config.alwaysVisible ?? []);

	const visibility: VisibilityState = {};
	for (const id of config.allColumnIds) {
		visibility[id] = alwaysVisible.has(id) || visibleIds.has(id);
	}

	return visibility;
}

const STORAGE_VERSION = "v1";

function storageKey(tableId: string, role: string): string {
	return `${tableId}:columns:${STORAGE_VERSION}:${role}`;
}

export function loadColumnVisibility(
	tableId: string,
	role: string,
): VisibilityState | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const raw = localStorage.getItem(storageKey(tableId, role));
		if (!raw) return null;

		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
			return null;

		for (const value of Object.values(parsed as Record<string, unknown>)) {
			if (typeof value !== "boolean") return null;
		}

		return parsed as VisibilityState;
	} catch {
		return null;
	}
}

export function saveColumnVisibility(
	tableId: string,
	role: string,
	state: VisibilityState,
): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		localStorage.setItem(storageKey(tableId, role), JSON.stringify(state));
	} catch {
		return;
	}
}

export function resolveColumnVisibility(
	role: string,
	tableId: string,
	config: RoleVisibilityConfig,
): VisibilityState {
	const baseline = getColumnVisibilityForRole(role, config);
	const saved = loadColumnVisibility(tableId, role);
	const alwaysVisible = new Set(config.alwaysVisible ?? []);

	if (!saved) return baseline;

	const merged: VisibilityState = { ...baseline };
	for (const [columnId, isVisible] of Object.entries(saved)) {
		if (!(columnId in merged) || alwaysVisible.has(columnId)) {
			continue;
		}

		if (baseline[columnId] && !isVisible) {
			merged[columnId] = false;
		}
	}

	return merged;
}
