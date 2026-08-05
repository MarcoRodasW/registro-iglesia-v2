import { useCallback, useState } from "react";

export interface ExcelColumn<T> {
	accessor: keyof T | ((row: T) => unknown);
	header: string;
	width?: number;
	format?: (value: unknown, row: T) => string | number | Date | null;
}

export interface UseExportToExcelOptions<T> {
	sheetName?: string;
	fileName: string;
	columns: ExcelColumn<T>[];
}

function readValue<T>(row: T, accessor: ExcelColumn<T>["accessor"]): unknown {
	if (typeof accessor === "function") return accessor(row);
	return row[accessor];
}

export function useExportToExcel<T>({
	sheetName = "Datos",
	fileName,
	columns,
}: UseExportToExcelOptions<T>) {
	const [isExporting, setIsExporting] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const exportToExcel = useCallback(
		async (rows: T[]) => {
			setIsExporting(true);
			setError(null);
			try {
				const XLSX = await import("xlsx");
				const data = rows.map((row) =>
					columns.map((column) => {
						const raw = readValue(row, column.accessor);
						return column.format ? column.format(raw, row) : (raw ?? null);
					}),
				);

				const ws = XLSX.utils.aoa_to_sheet([
					columns.map((c) => c.header),
					...data,
				]);

				ws["!cols"] = columns.map((column) => ({
					wch: column.width ?? 15,
				}));

				const wb = XLSX.utils.book_new();
				wb.Props = {
					Language: "es",
				};
				XLSX.utils.book_append_sheet(wb, ws, sheetName);
				XLSX.writeFile(wb, `${fileName}.xlsx`);
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)));
			} finally {
				setIsExporting(false);
			}
		},
		[sheetName, fileName, columns],
	);

	return { exportToExcel, isExporting, error } as const;
}
