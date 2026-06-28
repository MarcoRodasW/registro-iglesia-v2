import type { VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { FileDownIcon } from "lucide-react";
import { useMemo } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import {
	type ExcelColumn,
	useExportToExcel,
} from "@/hooks/use-export-to-excel";

export interface ExportExcelButtonProps<T> {
	/** Rows to export. Re-evaluated on each click, no caching required. */
	data: T[];
	/** Columns describing how each row maps to cells. */
	columns: ExcelColumn<T>[];
	/** Base file name (without extension). */
	fileName: string;
	/** Sheet name. */
	sheetName?: string;
	/** Optional label shown next to the icon (hidden on small screens when truthy). */
	label?: string;
	/** Button variant/size passed through to the coss-ui Button. */
	variant?: VariantProps<typeof buttonVariants>["variant"];
	size?: VariantProps<typeof buttonVariants>["size"];
	/** Override the default icon. */
	icon?: LucideIcon;
	/** Disable the button (e.g. when there is no data). */
	disabled?: boolean;
	/** Optional className for extra styling. */
	className?: string;
}

export function ExportExcelButton<T>({
	data,
	columns,
	fileName,
	sheetName = "Datos",
	label = "Exportar Excel",
	variant = "outline",
	size = "sm",
	icon: Icon = FileDownIcon,
	disabled = false,
	className,
}: ExportExcelButtonProps<T>) {
	const memoizedColumns = useMemo(() => columns, [columns]);
	const { exportToExcel, isExporting } = useExportToExcel<T>({
		sheetName,
		fileName,
		columns: memoizedColumns,
	});

	const handleExport = () => {
		if (data.length === 0 || isExporting) return;
		void exportToExcel(data);
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleExport}
			disabled={disabled || isExporting || data.length === 0}
			className={className}
		>
			<Icon className="size-4" />
			<span className="hidden sm:inline">{label}</span>
		</Button>
	);
}
