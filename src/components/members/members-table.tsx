import {
  ArrowUp,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type MemberData, useMembersList } from "@/hooks/use-members-list";
import { EditMemberDialog } from "./edit-member-dialog";
import { DeleteMemberDialog } from "./delete-member-dialog";

// ============================================================================
// Members Table Component
// ============================================================================

export function MembersTable() {
  const {
    members,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    search,
    setSearch,
    showJumpToTop,
    handleJumpToTop,
    loadMoreRef,
    totalLoaded,
  } = useMembersList();

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Listado de Miembros</CardTitle>
          <InputGroup className="w-full sm:w-64">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && totalLoaded === 0 ? (
          <TableSkeleton />
        ) : members.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Dirección
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Edad</TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Hijos
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <MemberRow key={member._id} member={member} />
                  ))}
                  {isFetchingNextPage && <TableSkeletonRows />}
                </TableBody>
              </Table>
            </div>

            {/* Load More Button & Counter */}
            <div className="flex flex-col items-center gap-4 mt-6">
              <p className="text-sm text-muted-foreground">
                Mostrando {totalLoaded} de {totalCount} miembros
              </p>

              {hasNextPage ? (
                <Button
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  size="default"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Spinner className="size-4 mr-2" />
                      Cargando...
                    </>
                  ) : (
                    "Cargar más miembros"
                  )}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay más miembros para cargar
                </p>
              )}
            </div>

            {/* Intersection observer sentinel for initial load */}
            <div ref={loadMoreRef} className="h-4" />
          </>
        )}
      </CardContent>

      {/* Jump to Top Button */}
      {showJumpToTop && (
        <Button
          onClick={handleJumpToTop}
          variant="secondary"
          size="icon"
          className="fixed bottom-4 right-4 shadow-lg z-50"
          aria-label="Volver arriba"
        >
          <ArrowUp className="size-4" />
        </Button>
      )}
    </Card>
  );
}

// ============================================================================
// Member Row Component
// ============================================================================

interface MemberRowProps {
  member: MemberData;
}

function MemberRow({ member }: MemberRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{member.fullName}</TableCell>
        <TableCell>{member.phone}</TableCell>
        <TableCell className="hidden md:table-cell">{member.address}</TableCell>
        <TableCell className="hidden lg:table-cell">
          {member.email || "-"}
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {member.age ?? "-"}
        </TableCell>
        <TableCell className="hidden xl:table-cell">
          {member.childrenCount ?? "-"}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setEditOpen(true)}
              aria-label="Editar"
            >
              <PencilIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setDeleteOpen(true)}
              aria-label="Eliminar"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <EditMemberDialog
        member={member}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteMemberDialog
        member={member}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

// ============================================================================
// State Components
// ============================================================================

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no unique id
        <Skeleton key={`table-skeleton-${i}`} className="h-12 w-full" />
      ))}
    </div>
  );
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no unique id
        <TableRow key={`skeleton-row-${i}`}>
          <TableCell colSpan={7}>
            <Skeleton className="h-10 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon />
        </EmptyMedia>
        <EmptyTitle>
          {search ? "No se encontraron miembros" : "Sin miembros registrados"}
        </EmptyTitle>
        <EmptyDescription>
          {search
            ? `No hay miembros que coincidan con "${search}"`
            : "Comienza agregando miembros usando el botón de arriba"}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
