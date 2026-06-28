import type { ExcelColumn } from "@/hooks/use-export-to-excel";
import type { MemberData } from "@/hooks/use-members-list";

const MONTH_NAMES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
] as const;

function formatDate(timestamp: number | null | undefined): string {
	if (!timestamp) return "";
	const date = new Date(timestamp);
	return `${date.getDate()} de ${
		MONTH_NAMES[date.getMonth() ?? 0]
	} ${date.getFullYear()}`;
}

export interface MemberExportContext {
	/** Map from sector id -> sector name. */
	sectorNameById: ReadonlyMap<string, string>;
}

export function buildMemberExportColumns(
	context: MemberExportContext,
): ExcelColumn<MemberData>[] {
	return [
		{ header: "Nombre", accessor: "fullName", width: 28 },
		{ header: "Teléfono", accessor: "phone", width: 16 },
		{ header: "Dirección", accessor: "address", width: 32 },
		{ header: "Email", accessor: "email", width: 28 },
		{
			header: "Edad",
			accessor: "age",
		},
		{
			header: "Hijos",
			accessor: "childrenCount",
		},
		{
			header: "Fecha primera visita",
			accessor: "firstVisitDate",
			width: 24,
			format: (value) => formatDate(value as number | null | undefined) || null,
		},
		{
			header: "Sector",
			accessor: "sectorId",
			width: 22,
			format: (value) => {
				if (!value) return "Sin sector";
				return context.sectorNameById.get(value as string) ?? "Sin sector";
			},
		},
		{
			header: "Invitado por",
			accessor: "invitedByName",
			width: 24,
		},
		{ header: "Notas", accessor: "notes", width: 40 },
	];
}
