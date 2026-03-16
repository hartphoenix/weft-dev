// Shared types for log-viewer server and client

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
}

export interface SessionSummary {
  id: string;
  sessionId: string;
  projectId: string;
  timestamp: string;
  cwd?: string;
  gitBranch?: string;
  turns: number;
  metaAgents: string[];
  hasMetaLog: boolean;
  metaLogPath?: string;
  transcriptPath: string;
  injections?: number;
  embeddingQueries?: number; // stub — not yet implemented
}

export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result" | "thinking";
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string | ContentBlock[];
  thinking?: string;
}

export interface Turn {
  type: "user" | "assistant";
  timestamp: string;
  uuid?: string;
  content: ContentBlock[];
  model?: string;
}

export interface ToolResultPair {
  toolUseId: string;
  name: string;
  input: unknown;
  result: string | ContentBlock[];
}

export interface MetaEntry {
  type: "observation" | "observation_skipped" | "injection" | "error" | "session_header";
  timestamp: string;
  turn?: number;
  decision?: string;
  content?: string;
  injection_content?: string;
  model?: string;
  mode?: string;
  latency_ms?: number;
  total_latency_ms?: number;
  session_id?: string;
  cwd?: string;
  permission_mode?: string;
  last_assistant_message?: string;
  inference_metadata?: Record<string, unknown>;
  user_prompt?: string;
  full_response?: string;
  user_message?: string;
  model_name?: string;
  error?: string;
  stage?: string;
  system_prompt?: string;
  accumulator_in?: string;
  accumulator_out?: string;
  reason?: string;
  fingerprint?: string;
  context_window?: {
    transcript_turns_used?: number;
    user_turns?: number;
    notepad_files?: string[];
  };
  pipeline?: Record<string, unknown>;
}

export interface SessionDetail {
  sessionId: string;
  turns: Turn[];
  toolResults: Record<string, ToolResultPair>;
  meta: MetaEntry[];
}
