import Link from "next/link";
import type { ReactNode } from "react";

interface MarkdownDocumentProps {
  markdown: string;
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; text: string; language?: string }
  | { type: "table"; rows: string[][] }
  | { type: "quote"; text: string };

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const fence = line.match(/^```(\w+)?/);
    if (fence) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "code", language: fence[1], text: code.join("\n") });
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      i += 1;
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*\|/.test(lines[i + 1] ?? "")) {
      const rows: string[][] = [];
      rows.push(splitTableRow(line));
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", rows });
      continue;
    }

    const unordered = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (unordered || ordered) {
      const items: string[] = [];
      const isOrdered = Boolean(ordered);
      while (i < lines.length) {
        const current = lines[i] ?? "";
        const match = isOrdered ? current.match(/^\s*\d+\.\s+(.*)$/) : current.match(/^\s*[-*]\s+(.*)$/);
        if (!match) break;
        items.push(match[1]);
        i += 1;
      }
      blocks.push({ type: "list", ordered: isOrdered, items });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith(">") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(<strong key={`${token}-${match.index}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={`${token}-${match.index}`} className="rounded bg-muted px-1 py-0.5 text-xs">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const href = normalizeDocHref(link[2]);
        nodes.push(
          <Link key={`${token}-${match.index}`} href={href} className="text-primary underline-offset-4 hover:underline">
            {link[1]}
          </Link>,
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function normalizeDocHref(rawHref: string): string {
  if (rawHref.startsWith("http") || rawHref.startsWith("/") || rawHref.startsWith("mailto:")) return rawHref;
  const filename = rawHref.split("/").pop()?.replace(/\.md(#.*)?$/i, "") ?? rawHref;
  const slug = filename
    .replace(/#.*$/, "")
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `/docs/${slug}` : "/docs";
}

export function MarkdownDocument({ markdown }: MarkdownDocumentProps) {
  const blocks = parseMarkdown(markdown);

  return (
    <article className="space-y-5 text-sm leading-relaxed text-foreground">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const className = "scroll-mt-24 text-balance font-bold tracking-tight text-foreground";
          if (block.level <= 1) {
            return (
              <h2 key={index} className={className}>
                {renderInline(block.text)}
              </h2>
            );
          }
          if (block.level === 2) {
            return (
              <h3 key={index} className={className}>
                {renderInline(block.text)}
              </h3>
            );
          }
          if (block.level === 3) {
            return (
              <h4 key={index} className={className}>
                {renderInline(block.text)}
              </h4>
            );
          }
          return (
            <h5 key={index} className={className}>
              {renderInline(block.text)}
            </h5>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={index} className="text-muted-foreground">
              {renderInline(block.text)}
            </p>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote key={index} className="border-l-4 border-primary/50 bg-muted/40 p-4 text-muted-foreground">
              {renderInline(block.text)}
            </blockquote>
          );
        }

        if (block.type === "code") {
          return (
            <pre key={index} className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-xs">
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={index} className={block.ordered ? "list-decimal space-y-2 pl-5" : "list-disc space-y-2 pl-5"}>
              {block.items.map((item) => (
                <li key={item} className="text-muted-foreground">
                  {renderInline(item)}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <div key={index} className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  {block.rows[0]?.map((cell) => (
                    <th key={cell} className="border-b border-border px-3 py-2 font-semibold text-foreground">
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`} className="border-b border-border px-3 py-2 text-muted-foreground">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </article>
  );
}
