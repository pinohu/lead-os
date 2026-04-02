"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";

interface NicheResult {
  slug: string;
  label: string;
  icon: string;
  description: string;
  searchTerms: string[];
}

interface ServiceSearchProps {
  niches: NicheResult[];
  cityName: string;
  /** Placeholder shown in the input */
  placeholder?: string;
  /** Auto-focus when mounted */
  autoFocus?: boolean;
}

export function ServiceSearch({
  niches,
  cityName,
  placeholder,
  autoFocus = false,
}: ServiceSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // ── Filter niches by query ────────────────────────────────────
  const results = query.trim().length > 0
    ? niches.filter((n) => {
        const q = query.toLowerCase();
        return (
          n.label.toLowerCase().includes(q) ||
          n.slug.includes(q) ||
          n.searchTerms.some((t) => t.includes(q))
        );
      })
    : [];

  const showDropdown = open && query.trim().length > 0;

  // ── Close on outside click ────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // ── Keyboard navigation ───────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        window.location.href = `/${results[activeIndex].slug}`;
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [showDropdown, results, activeIndex]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* ── Search input ──────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder ?? `What do you need help with? (e.g. "plumber", "roof leak")`}
          className="w-full rounded-full border border-input bg-background py-4 pl-12 pr-4 text-base shadow-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-results"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
          aria-label={`Search for services in ${cityName}`}
        />
      </div>

      {/* ── Results dropdown ──────────────────────────────────── */}
      {showDropdown && (
        <ul
          ref={listRef}
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border bg-background shadow-xl"
        >
          {results.length > 0 ? (
            results.map((niche, i) => (
              <li key={niche.slug} id={`search-result-${i}`} role="option" aria-selected={i === activeIndex}>
                <Link
                  href={`/${niche.slug}`}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                    i === activeIndex ? "bg-accent" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
                    {niche.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{niche.label}</div>
                    <p className="truncate text-sm text-muted-foreground">
                      {niche.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No services match &ldquo;{query}&rdquo;. Try &ldquo;plumber&rdquo; or &ldquo;roof.&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
