import type { Table as TanStackTable } from "@tanstack/react-table";
import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Menu,
	MenuCheckboxItem,
	MenuGroup,
	MenuGroupLabel,
	MenuPopup,
	MenuSeparator,
	MenuTrigger,
} from "@/components/ui/menu";

interface ColumnVisibilityDropdownProps<TData> {
	table: TanStackTable<TData>;
	columnLabels?: Record<string, string>;
}

export function ColumnVisibilityDropdown<TData>({
	table,
	columnLabels = {},
}: ColumnVisibilityDropdownProps<TData>) {
	const hideableColumns = table
		.getAllLeafColumns()
		.filter((column) => column.getCanHide());

	if (hideableColumns.length === 0) return null;

	return (
		<Menu>
			<MenuTrigger
				render={
					<Button variant="outline" size="sm">
						<SlidersHorizontalIcon className="size-4" />
						<span className="hidden sm:inline">Columnas</span>
					</Button>
				}
			/>
			<MenuPopup align="end" sideOffset={8} className="w-48">
				<MenuGroup>
					<MenuGroupLabel>Columnas visibles</MenuGroupLabel>
					<MenuSeparator />
					{hideableColumns.map((column) => (
						<MenuCheckboxItem
							key={column.id}
							checked={column.getIsVisible()}
							onCheckedChange={(checked) =>
								column.toggleVisibility(checked === true)
							}
							closeOnClick={false}
						>
							{columnLabels[column.id] ?? column.id}
						</MenuCheckboxItem>
					))}
				</MenuGroup>
			</MenuPopup>
		</Menu>
	);
}
