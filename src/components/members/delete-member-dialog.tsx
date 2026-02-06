import type { Doc } from "@convex/dataModel";

import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMemberMutations } from "@/hooks/use-member-mutations";

interface DeleteMemberDialogProps {
	member: Doc<"members">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteMemberDialog({
	member,
	open,
	onOpenChange,
}: DeleteMemberDialogProps) {
	const { deleteMember, isDeleting } = useMemberMutations();

	const handleDelete = async () => {
		try {
			await deleteMember.mutateAsync({ id: member._id });
			onOpenChange(false);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Eliminar miembro</AlertDialogTitle>
					<AlertDialogDescription>
						¿Estás seguro de que deseas eliminar a{" "}
						<strong>{member.fullName}</strong>? Esta acción no se puede
						deshacer.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose render={<Button variant="outline" />}>
						Cancelar
					</AlertDialogClose>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting && <Spinner className="size-4 mr-2" />}
						Eliminar
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
