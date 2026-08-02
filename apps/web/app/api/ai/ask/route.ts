import { getWorkspaceDashboard } from '@/lib/data/platform';
import { getWorkspaceContext } from '@/lib/session';
import { READ_TOOLS, anthropicProvider } from '@adsos/ai';

/**
 * Natural-language analyst. Answers over the normalized store using a read-only
 * tool surface, and always returns the underlying data the answer draws on so the
 * user can inspect it (copy rule sec 9). The model explains; it never invents metrics.
 */
export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return Response.json({ error: 'Not authenticated.' }, { status: 401 });

  const { question } = (await req.json().catch(() => ({}))) as { question?: string };
  if (!question) return Response.json({ error: 'Missing question.' }, { status: 400 });

  const data = await getWorkspaceDashboard(ctx);
  if (!data.anyConnected) {
    return Response.json({ answer: 'No account is connected yet, so there is nothing to analyze.', basis: [] });
  }

  const basis = {
    platforms: data.platforms.map((p) => ({ platform: p.platform, kpis: p.kpis })),
    openFindings: data.recs.length,
  };
  const provider = anthropicProvider();
  const answer = await provider.complete({
    messages: [
      {
        role: 'system',
        content:
          'You are a media-buying analyst. Answer ONLY from the provided data. Never invent a number. Be concise.',
      },
      { role: 'user', content: `Data:\n${JSON.stringify(basis, null, 2)}\n\nQuestion: ${question}` },
    ],
    tools: READ_TOOLS,
    maxTokens: 400,
  });

  return Response.json({ answer, basis });
}
