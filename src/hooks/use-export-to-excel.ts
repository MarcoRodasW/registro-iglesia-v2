import ExcelJS from "exceljs";
import { useCallback, useState } from "react";

export interface ExcelColumn<T> {
	/** Property name (or function) used to read the value from each row. */
	accessor: keyof T | ((row: T) => unknown);
	/** Header text shown on the sheet's first row. */
	header: string;
	/** Column width in characters. auto if omitted. */
	width?: number;
	/** Optional transform applied to the value before writing the cell. */
	format?: (value: unknown, row: T) => string | number | Date | null;
}

export interface UseExportToExcelOptions<T> {
	/** Sheet name inside the workbook. */
	sheetName?: string;
	/** Base file name (without extension). `.xlsx` is appended. */
	fileName: string;
	/** Columns describing how each row maps to cells. */
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
				const workbook = new ExcelJS.Workbook();
				const sheet = workbook.addWorksheet(sheetName);

				sheet.columns = columns.map((column) => ({
					header: column.header,
					key: column.header,
					width: column.width,
				}));

				// Header style
				sheet.getRow(1).font = { bold: true };

				for (const row of rows) {
					const values = columns.map((column) => {
						const raw = readValue(row, column.accessor);
						const value = column.format
							? column.format(raw, row)
							: (raw ?? null);
						return value;
					});
					sheet.addRow(values);
				}

				// Auto width for columns without explicit width
				for (const column of sheet.columns) {
					if (column.width) continue;
					let maxLength = column.header?.length ?? 0;
					sheet.eachRow((row, rowNumber) => {
						if (rowNumber === 1) return;
						const cell = row.getCell(column.key as string);
						const length = cell.value ? String(cell.value).length : 0;
						maxLength = Math.max(maxLength, length);
					});
					column.width = Math.min(Math.max(maxLength + 2, 10), 40);
				}

				const buffer = await workbook.xlsx.writeBuffer();
				const blob = new Blob([buffer], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				});
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `${fileName}.xlsx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
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
