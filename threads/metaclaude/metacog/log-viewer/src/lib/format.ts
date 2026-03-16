// Date formatting, tool emoji map, regex patterns

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format: "7:14p Mon Jun 4 26" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "p" : "a";
  h = h % 12 || 12;
  const day = DAYS[d.getDay()];
  const mon = MONTHS[d.getMonth()];
  const date = d.getDate();
  const yr = String(d.getFullYear()).slice(-2);
  return `${h}:${m}${ampm} ${day} ${mon} ${date} ${yr}`;
}

/** Format time only: "7:14:32p" */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  const ampm = h >= 12 ? "p" : "a";
  h = h % 12 || 12;
  return `${h}:${m}:${s}${ampm}`;
}

export const TOOL_EMOJI: Record<string, string> = {
  Read: "📖",
  Write: "✏️",
  Edit: "✏️",
  Bash: "💻",
  Glob: "🔍",
  Grep: "🔎",
  Agent: "🤖",
  WebSearch: "🌐",
  WebFetch: "🌐",
  Skill: "⚡",
  ToolSearch: "🔧",
  TaskCreate: "📋",
  TaskUpdate: "📋",
  TaskGet: "📋",
  TaskList: "📋",
  TaskOutput: "📋",
  TaskStop: "📋",
  TodoRead: "📋",
  TodoWrite: "📋",
  AskUserQuestion: "❓",
  EnterPlanMode: "🗺️",
  ExitPlanMode: "🗺️",
  NotebookEdit: "📓",
};

export function toolEmoji(name: string): string {
  if (TOOL_EMOJI[name]) return TOOL_EMOJI[name];
  if (name.startsWith("mcp__")) return "🔌";
  return "⚙️";
}

/** Match absolute file paths */
export const PATH_REGEX = /(?:\/[\w.@~-]+){2,}/g;

/** Match slash commands like /commit, /review-pr */
export const SLASH_CMD_REGEX = /(?:^|\s)(\/[a-z][\w-]*)/g;
