/**
 * Shared editor top-bar for every page-editor in the CMS.
 *
 * One component, two modes:
 *
 *  - "buffered" — for editors that keep changes in local state and commit
 *    them with an explicit "Opslaan & publiceren" click (Homepage, Menu,
 *    Extensions, Our Fames, About, Team, Contact, Site Settings, …).
 *    Shows the 4-state StatusPill (Concept · niet opgeslagen / Opslaan… /
 *    Zojuist opgeslagen / Live) plus "Ongedaan maken" and the primary save
 *    button.
 *
 *  - "auto-save" — for editors that persist per-row on the fly (Lookbook,
 *    FAQ, Reviews, Pages, Treatments, Pricing). Shows the same StatusPill
 *    (Opslaan… while any mutation is running, Live when idle) plus a short
 *    hint explaining that changes are saved automatically.
 *
 * Every editor uses this component so the terminology, positioning,
 * styling and status logic stay identical across the CMS. Any future
 * change to the top-bar lives in this one file.
 *
 * NOTE: this file is presentational only. It reads the save state that
 * each editor passes in and calls the callbacks the editor provides. It
 * NEVER performs its own database writes, cache invalidation or business
 * logic — the existing save/publish flow per editor stays unchanged.
 */

import type { ReactNode } from "react";
import { Dot, ExternalLink, Globe } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/cms/flow-mates/cms-ui";

export const LIVE_SITE_URL = "/";

/* -------------------------------------------------------------------------- */
/*  Status pill                                                                */
/* -------------------------------------------------------------------------- */

export type EditorStatus = "draft" | "saving" | "published";

export function EditorStatusPill({
  state,
  flash = false,
}: {
  state: EditorStatus;
  flash?: boolean;
}) {
  const cfg = {
    draft: {
      dot: "bg-amber-500 animate-pulse",
      text: "Concept · niet opgeslagen",
      color: "text-amber-700",
    },
    saving: {
      dot: "bg-sky-500 animate-pulse",
      text: "Opslaan…",
      color: "text-sky-700",
    },
    published: {
      dot: flash ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-emerald-500",
      text: flash ? "Zojuist opgeslagen" : "Live",
      color: "text-emerald-700",
    },
  }[state];
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-neutral-50 px-2.5 py-1 ring-1 ring-neutral-200/70">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full transition-all duration-300 ${cfg.dot}`}
      />
      <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${cfg.color}`}>
        {cfg.text}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared "Bekijk website" link                                               */
/* -------------------------------------------------------------------------- */

export function ViewSiteButton({
  href = LIVE_SITE_URL,
  label = "Bekijk website",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98]"
    >
      <Globe className="h-3.5 w-3.5" />
      {label}
      <ExternalLink className="h-3 w-3 text-neutral-400" />
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/*  Relative "opgeslagen X geleden" helper                                     */
/* -------------------------------------------------------------------------- */

export function formatRelative(d: Date): string {
  const diff = Math.max(0, Date.now() - d.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 30) return "zojuist";
  if (s < 60) return `${s}s geleden`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}u geleden`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* -------------------------------------------------------------------------- */
/*  Language coupling chip                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every editor edits ONE content set: the Dutch source. The English site
 * reuses the same structure and media and only swaps translated text, so
 * there is no separate English CMS to keep in sync.
 */
export function LanguageCoupledChip() {
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Top-bar                                                                    */
/* -------------------------------------------------------------------------- */

type BufferedProps = {
  mode: "buffered";
  /** True when the buffered state differs from the persisted state. */
  dirty: boolean;
  /** True while the save mutation is running. */
  saving: boolean;
  /** Set right after a successful save for a brief highlight animation. */
  savedFlash: boolean;
  /** Timestamp of the last successful save. */
  lastSavedAt: Date | null;
  /** Revert buffered edits to the persisted state. */
  onUndo?: () => void;
  /** Commit the buffered edits. */
  onSave: () => void;
  /** Extra guard, e.g. still loading initial data. */
  disabled?: boolean;
  /** Optional "X/Y zichtbaar" chip. */
  visibleCount?: number;
  totalCount?: number;
  /** Extra chips / info nodes rendered next to the status pill. */
  extraInfo?: ReactNode;
  /** Extra buttons rendered before the primary save button. */
  extraActions?: ReactNode;
};

type AutoSaveProps = {
  mode: "auto-save";
  /** True when any per-row mutation on the page is running. */
  saving?: boolean;
  /** Timestamp of the most recent successful mutation. */
  lastSavedAt?: Date | null;
  /** Short line explaining the auto-save behaviour (Dutch). */
  hint?: string;
  /** Extra chips / info nodes rendered next to the status pill. */
  extraInfo?: ReactNode;
  /** Extra buttons on the right side (e.g. "Toevoegen"). */
  extraActions?: ReactNode;
};

export type EditorTopBarProps = BufferedProps | AutoSaveProps;

const DEFAULT_AUTOSAVE_HINT = "Wijzigingen worden per item direct opgeslagen";

export function EditorTopBar(props: EditorTopBarProps) {
  if (props.mode === "buffered") {
    const {
      dirty,
      saving,
      savedFlash,
      lastSavedAt,
      onUndo,
      onSave,
      disabled,
      visibleCount,
      totalCount,
      extraInfo,
      extraActions,
    } = props;
    const state: EditorStatus = saving ? "saving" : dirty ? "draft" : "published";
    return (
      <div className="sticky top-[var(--cms-editor-sticky-top,0px)] z-20 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200/70 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-xs text-neutral-500">
          <EditorStatusPill state={state} flash={savedFlash} />
          {typeof visibleCount === "number" && typeof totalCount === "number" && (
            <>
              <Dot className="hidden h-3 w-3 text-neutral-300 sm:inline" />
              <span className="hidden sm:inline">
                {visibleCount}/{totalCount} zichtbaar
              </span>
            </>
          )}
          {lastSavedAt && (
            <>
              <Dot className="hidden h-3 w-3 text-neutral-300 md:inline" />
              <span className="hidden md:inline text-neutral-400">
                Opgeslagen {formatRelative(lastSavedAt)}
              </span>
            </>
          )}
          <Dot className="hidden h-3 w-3 text-neutral-300 lg:inline" />
          <span className="hidden lg:inline text-neutral-400">⌘S</span>
          <LanguageCoupledChip />
          {extraInfo}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {extraActions}
          {dirty && onUndo && (
            <GhostButton type="button" onClick={onUndo}>
              Ongedaan maken
            </GhostButton>
          )}
          {(dirty || saving) && (
            <PrimaryButton type="button" onClick={onSave} disabled={saving || Boolean(disabled)}>
              {saving ? "Bezig met opslaan…" : "Opslaan & publiceren"}
            </PrimaryButton>
          )}
        </div>
      </div>
    );
  }

  const {
    saving = false,
    lastSavedAt,
    hint = DEFAULT_AUTOSAVE_HINT,
    extraInfo,
    extraActions,
  } = props;
  const state: EditorStatus = saving ? "saving" : "published";
  return (
    <div className="sticky top-[var(--cms-editor-sticky-top,0px)] z-20 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200/70 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-xs text-neutral-500">
        <EditorStatusPill state={state} flash={false} />
        <Dot className="hidden h-3 w-3 text-neutral-300 sm:inline" />
        <span className="hidden sm:inline text-neutral-500">{hint}</span>
        <LanguageCoupledChip />
        {lastSavedAt && (
          <>
            <Dot className="hidden h-3 w-3 text-neutral-300 md:inline" />
            <span className="hidden md:inline text-neutral-400">
              Opgeslagen {formatRelative(lastSavedAt)}
            </span>
          </>
        )}
        {extraInfo}
      </div>
      {extraActions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{extraActions}</div>
      )}
    </div>
  );
}

export default EditorTopBar;
