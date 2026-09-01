/**
 * SectionAccordionToolbar — tiny "X of Y open" strip with Alles openen /
 * Alles sluiten buttons. Renders above the list of section cards in every
 * CMS page editor.
 */
import { ChevronsDownUp, ChevronsUpDown, PencilLine } from "lucide-react";

export function SectionAccordionToolbar({
  openCount,
  total,
  allOpen,
  allClosed,
  onExpandAll,
  onCollapseAll,
  onQuickEdit,
}: {
  openCount: number;
  total: number;
  allOpen: boolean;
  allClosed: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onQuickEdit?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
        {openCount} van {total} open
      </span>
      <div className="flex items-center gap-1">
        {onQuickEdit && (
          <button
            type="button"
            onClick={onQuickEdit}
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-neutral-800"
          >
            <PencilLine className="h-3 w-3" />
            Snel bewerken
          </button>
        )}
        <button
          type="button"
          onClick={onExpandAll}
          disabled={allOpen}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronsUpDown className="h-3 w-3" />
          Alles openen
        </button>
        <button
          type="button"
          onClick={onCollapseAll}
          disabled={allClosed}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronsDownUp className="h-3 w-3" />
          Alles sluiten
        </button>
      </div>
    </div>
  );
}
