// Serwer MCP SomaLog — Vercel Function (Node). Owija publiczne REST API SomaLog jako narzędzia MCP,
// żeby agenci AI mogli dodawać wpisy, pytać Logana i odczytywać dane bez znajomości HTTP.
//
// Transport: Streamable HTTP w trybie BEZSTANOWYM (sessionIdGenerator: undefined) — bez Redisa.
// Autoryzacja: klient MCP przekazuje osobisty token API SomaLog w nagłówku `Authorization: Bearer`.
// Funkcja przekazuje ten token dalej do REST API (to ono waliduje token i izoluje dane per user).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import type { IncomingMessage, ServerResponse } from "node:http";

const API_BASE = process.env.SOMALOG_API_BASE ?? "";
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

const metric = (label: string, dir: string) =>
  z.number().int().min(0).max(100).optional().describe(`${label}, 0–100 (${dir})`);

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };
const ok = (text: string): ToolResult => ({ content: [{ type: "text", text }] });
const err = (text: string): ToolResult => ({ content: [{ type: "text", text }], isError: true });

// Buduje serwer MCP z narzędziami zamkniętymi na tokenie z bieżącego requestu.
function buildServer(token: string): McpServer {
  const server = new McpServer(
    { name: "somalog", version: "1.0.0" },
    { instructions: "Narzędzia SomaLog: dziennik regeneracji (metryki 0–100) i trener AI „Logan”. Metryki: sen/energia/motywacja (wyżej=lepiej), zmęczenie/DOMS/stres (niżej=lepiej)." },
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    apikey: ANON_KEY,
    "Content-Type": "application/json",
  };

  async function call(path: string, init: RequestInit): Promise<ToolResult> {
    if (!token) return err("Brak tokenu. Skonfiguruj nagłówek Authorization: Bearer <token SomaLog> w kliencie MCP.");
    if (!API_BASE) return err("Serwer MCP nie ma skonfigurowanego SOMALOG_API_BASE.");
    try {
      const res = await fetch(`${API_BASE}${path}`, { ...init, headers: authHeaders });
      const text = await res.text();
      if (res.ok) return ok(text);
      if (res.status === 429) {
        return err(`Przekroczono dzienny limit zapytań do Logana — spróbuj ponownie jutro. ${text}`);
      }
      return err(`Błąd API (${res.status}): ${text}`);
    } catch (e) {
      return err(`Nie udało się połączyć z API SomaLog: ${String(e)}`);
    }
  }

  server.registerTool(
    "create_entry",
    {
      title: "Dodaj / zaktualizuj wpis",
      description:
        "Dodaje wpis SomaLog na dany dzień lub scala z istniejącym (aktualizuje tylko podane pola). " +
        "Domyślnie dziś (strefa Europe/Warsaw). Podaj co najmniej jeden parametr lub notatkę.",
      inputSchema: {
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Dzień YYYY-MM-DD; domyślnie dziś"),
        sleep: metric("Sen", "wyżej = lepiej"),
        energy: metric("Energia", "wyżej = lepiej"),
        motivation: metric("Motywacja", "wyżej = lepiej"),
        fatigue: metric("Zmęczenie", "niżej = lepiej"),
        doms: metric("Bolesność mięśni (DOMS)", "niżej = lepiej"),
        stress: metric("Stres", "niżej = lepiej"),
        note: z.string().optional().describe("Notatka tekstowa do dnia"),
      },
    },
    async (args) => call("/entries", { method: "POST", body: JSON.stringify(args) }),
  );

  server.registerTool(
    "ask_logan",
    {
      title: "Zapytaj trenera Logana",
      description:
        "Zadaje pytanie trenerowi regeneracji „Logan” i zwraca jego odpowiedź. Bezstanowe. " +
        "Opcjonalny dzień jest wykorzystany jako kontekst (domyślnie dziś).",
      inputSchema: {
        question: z.string().min(1).describe("Pytanie do Logana"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Dzień kontekstu YYYY-MM-DD; domyślnie dziś"),
      },
    },
    async ({ question, date }) => call("/ask", { method: "POST", body: JSON.stringify({ question, date }) }),
  );

  server.registerTool(
    "get_entry",
    {
      title: "Odczytaj wpis dnia",
      description: "Zwraca wpis SomaLog na wskazany dzień (domyślnie dziś) lub null, gdy brak wpisu.",
      inputSchema: {
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Dzień YYYY-MM-DD; domyślnie dziś"),
      },
    },
    async ({ date }) => {
      const qs = date ? `?date=${encodeURIComponent(date)}` : "";
      return call(`/entries${qs}`, { method: "GET" });
    },
  );

  return server;
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  // Bezstanowy Streamable HTTP obsługuje JSON-RPC przez POST; GET/DELETE (SSE/sesje) nie są wspierane.
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Metoda niedozwolona. Serwer MCP działa bezstanowo (POST)." },
      id: null,
    }));
    return;
  }

  const auth = (req.headers["authorization"] as string | undefined) ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim() ?? "";

  const server = buildServer(token);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32603, message: `Błąd serwera MCP: ${String(e)}` },
        id: null,
      }));
    }
  }
}
