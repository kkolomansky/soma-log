import { useRoute } from '../lib/nav';
import DocsLayout from './docs/DocsLayout';
import DocsApi, { NAV_API } from './docs/DocsApi';
import DocsMcp, { NAV_MCP } from './docs/DocsMcp';

// Router dokumentacji: /docs → API, /docs/mcp → MCP. Wspólna powłoka (górny pasek + pasek boczny).
export default function Docs({ session }) {
  const path = useRoute();
  const isMcp = path.startsWith('/docs/mcp');

  return isMcp ? (
    <DocsLayout active="mcp" nav={NAV_MCP} session={session}>
      <DocsMcp />
    </DocsLayout>
  ) : (
    <DocsLayout active="api" nav={NAV_API} session={session}>
      <DocsApi />
    </DocsLayout>
  );
}
