"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemForm } from "@/components/forms/item-form";
import { deleteItem } from "@/app/actions/items";
import type { Item } from "@/lib/db/schema";

type Props = {
  items: Item[];
};

// Always render currency with Thai-formatted THB symbols per spec.
const priceFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
});

function formatWht(value: string | null, none: string): string {
  if (!value) return none;
  // Drop trailing ".00" for display.
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `${num}%`;
}

export function ItemsClient({ items }: Props) {
  const t = useTranslations("Items");
  const tCommon = useTranslations("Common");

  const [editTarget, setEditTarget] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [pending, startTransition] = useTransition();

  const closeForms = () => {
    setCreating(false);
    setEditTarget(null);
  };

  const onDeleteConfirmed = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startTransition(async () => {
      await deleteItem(id);
      setDeleteTarget(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          <span className="ml-2">{t("addButton")}</span>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-background p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.unit")}</TableHead>
                <TableHead className="text-right">
                  {t("table.unitPrice")}
                </TableHead>
                <TableHead>{t("table.vat")}</TableHead>
                <TableHead>{t("table.wht")}</TableHead>
                <TableHead>{t("table.active")}</TableHead>
                <TableHead className="w-32 text-right">
                  {t("table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.name}</TableCell>
                  <TableCell>{it.unit}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {priceFormatter.format(Number(it.unitPrice))}
                  </TableCell>
                  <TableCell>
                    {it.vatApplicable ? tCommon("yes") : tCommon("no")}
                  </TableCell>
                  <TableCell>
                    {formatWht(it.whtRate, t("fields.whtNone"))}
                  </TableCell>
                  <TableCell>
                    {it.isActive ? tCommon("yes") : tCommon("no")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditTarget(it)}
                        aria-label={tCommon("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(it)}
                        aria-label={tCommon("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={creating || editTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeForms();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? t("editTitle") : t("createTitle")}
            </DialogTitle>
          </DialogHeader>
          <ItemForm
            key={editTarget?.id ?? "create"}
            initialValues={editTarget}
            onSuccess={closeForms}
            onCancel={closeForms}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm", { name: deleteTarget?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteConfirmed}
              disabled={pending}
            >
              {pending ? tCommon("deleting") : tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
