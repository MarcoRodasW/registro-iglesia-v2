import {
	flexRender,
	type Row,
	type Table as TanStackTable,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ColumnMeta = {
	headerClassName?: string;
	cellClassName?: string;
};

interface DataTableProps<TData> {
	table: TanStackTable<TData>;
	footerRows?: ReactNode;
	onRowClick?: (row: Row<TData>) => void;
}

export function DataTable<TData>({
	table,
	footerRows,
	onRowClick,
}: DataTableProps<TData>) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead
									key={header.id}
									className={
										(header.column.columnDef.meta as ColumnMeta | undefined)
											?.headerClassName
									}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows.map((row) => (
						<TableRow
							key={row.id}
							onClick={onRowClick ? () => onRowClick(row) : undefined}
							className={cn(onRowClick && "cursor-pointer")}
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={cell.id}
									className={
										(cell.column.columnDef.meta as ColumnMeta | undefined)
											?.cellClassName
									}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
					{footerRows}
				</TableBody>
			</Table>
		</div>
	);
}
