import { api } from "@convex/api";
import type { Doc } from "@convex/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPopup,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteSectorAlertProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sector: Doc<"sectors"> | null;
}

export function DeleteSectorAlert({
	open,
	onOpenChange,
	sector,
}: DeleteSectorAlertProps) {
	const queryClient = useQueryClient();

	const deleteSectorMutation = useConvexMutation(api.sectors.deleteSector);
	const deleteSector = useMutation({
		mutationFn: deleteSectorMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: convexQuery(api.sectors.listSectors, {}).queryKey,
			});
		},
	});

	const handleConfirmDelete = () => {
		if (!sector?._id) return;
		deleteSector.mutate({ sectorId: sector._id });
		onOpenChange(false);
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogPopup>
				<AlertDialogHeader>
					<AlertDialogTitle>Eliminar sector</AlertDialogTitle>
					<AlertDialogDescription>
						¿Estás seguro de que deseas eliminar el sector{" "}
						<span className="font-semibold text-foreground">
							{sector?.name}
						</span>
						? Esta acción no se puede deshacer.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose render={<Button variant="outline" />}>
						Cancelar
					</AlertDialogClose>
					<Button variant="destructive" onClick={handleConfirmDelete}>
						Eliminar
					</Button>
				</AlertDialogFooter>
			</AlertDialogPopup>
		</AlertDialog>
	);
}
