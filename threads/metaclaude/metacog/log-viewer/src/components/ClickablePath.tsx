import { PATH_REGEX, SLASH_CMD_REGEX } from "../lib/format";

interface Props {
  text: string;
}

function revealInFinder(path: string) {
  fetch("/api/reveal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  }).catch(() => {
    // silently fail — non-critical
  });
}

/** Render text with clickable file paths and highlighted slash commands */
export function ClickablePath({ text }: Props) {
  if (!text) return null;

  // Find all matches and their positions
  type Segment = { type: "text" | "path" | "slash"; value: string };
  const segments: Segment[] = [];

  // Combine both regexes, process in order
  const allMatches: { start: number; end: number; type: "path" | "slash"; value: string }[] = [];

  // Reset regex state
  PATH_REGEX.lastIndex = 0;
  SLASH_CMD_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = PATH_REGEX.exec(text)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "path",
      value: match[0],
    });
  }

  while ((match = SLASH_CMD_REGEX.exec(text)) !== null) {
    // The regex captures leading whitespace, adjust
    const cmd = match[1];
    const cmdStart = match.index + match[0].indexOf(cmd);
    allMatches.push({
      start: cmdStart,
      end: cmdStart + cmd.length,
      type: "slash",
      value: cmd,
    });
  }

  // Sort by start position
  allMatches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches
  const filtered: typeof allMatches = [];
  let lastEnd = 0;
  for (const m of allMatches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  // Build segments
  let pos = 0;
  for (const m of filtered) {
    if (m.start > pos) {
      segments.push({ type: "text", value: text.slice(pos, m.start) });
    }
    segments.push({ type: m.type, value: m.value });
    pos = m.end;
  }
  if (pos < text.length) {
    segments.push({ type: "text", value: text.slice(pos) });
  }

  // If no special segments, just render plain text
  if (filtered.length === 0) {
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "path") {
          return (
            <span
              key={i}
              className="clickable-path"
              onClick={() => revealInFinder(seg.value)}
              title={`Reveal in Finder: ${seg.value}`}
            >
              {seg.value}
            </span>
          );
        }
        if (seg.type === "slash") {
          return (
            <span key={i} className="slash-cmd">
              {seg.value}
            </span>
          );
        }
        return <span key={i}>{seg.value}</span>;
      })}
    </>
  );
}
