/**
 * useSectionAccordion — multi-open accordion state for CMS page editors.
 *
 * Each editor has a list of section keys (hero, welcome, services, …).
 * The hook tracks which sections are open as a Set, exposes helpers for
 * toggle / expand-all / collapse-all, and tracks the "focused" section
 * (the most recently opened one) so the live preview can highlight it.
 *
 * It also reads a `?section=<key>` query param from the URL on first
 * mount and auto-opens + focuses that section, enabling deep-linking
 * from the Activity Log or external links.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useSectionAccordion<K extends string>(allKeys: readonly K[], defaultOpen: K) {
  const [searchParams] = useSearchParams();
  const initialQuerySection = searchParams.get("section");

  const initialKey = useMemo<K>(() => {
    if (initialQuerySection && (allKeys as readonly string[]).includes(initialQuerySection)) {
      return initialQuerySection as K;
    }
    return defaultOpen;
  }, [initialQuerySection, allKeys, defaultOpen]);

  const [openSet, setOpenSet] = useState<Set<K>>(() => new Set<K>([initialKey]));
  const [focus, setFocus] = useState<K | null>(initialKey);

  useEffect(() => {
    if (!initialQuerySection || !(allKeys as readonly string[]).includes(initialQuerySection)) {
      return;
    }
    const key = initialQuerySection as K;
    setOpenSet((prev) => new Set(prev).add(key));
    setFocus(key);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`cms-editor-section-${key}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [initialQuerySection, allKeys]);

  const isOpen = useCallback((k: K) => openSet.has(k), [openSet]);

  const toggle = useCallback(
    (k: K) => {
      setOpenSet((prev) => {
        const next = new Set(prev);
        if (next.has(k)) {
          next.delete(k);
        } else {
          next.add(k);
        }
        return next;
      });
      setFocus((prev) => (openSet.has(k) ? (prev === k ? null : prev) : k));
    },
    [openSet],
  );

  const expandAll = useCallback(() => {
    setOpenSet(new Set(allKeys));
  }, [allKeys]);

  const collapseAll = useCallback(() => {
    setOpenSet(new Set());
    setFocus(null);
  }, []);

  const openCount = openSet.size;
  const allOpen = openCount === allKeys.length;
  const allClosed = openCount === 0;

  return {
    isOpen,
    toggle,
    expandAll,
    collapseAll,
    focus,
    openCount,
    allOpen,
    allClosed,
    total: allKeys.length,
  };
}
