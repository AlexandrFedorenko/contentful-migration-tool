export interface SseMessage {
    id?: string;
    event: string;
    data: unknown;
}

/**
 * Read a text/event-stream response body and invoke `onMessage` for every complete
 * event. Handles events split across network chunks, `id:`/`event:` fields and
 * comment lines. Returns the id of the last event seen (for resuming).
 */
export async function readSseStream(
    response: Response,
    onMessage: (message: SseMessage) => void
): Promise<string | undefined> {
    if (!response.body) throw new Error('Empty response');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastId: string | undefined;

    const dispatch = (block: string) => {
        let id: string | undefined;
        let event = 'message';
        const data: string[] = [];
        for (const line of block.split('\n')) {
            if (!line || line.startsWith(':')) continue;
            const idx = line.indexOf(':');
            const field = idx === -1 ? line : line.slice(0, idx);
            const value = idx === -1 ? '' : line.slice(idx + 1).replace(/^ /, '');
            if (field === 'data') data.push(value);
            else if (field === 'id') id = value;
            else if (field === 'event') event = value;
        }
        if (id) lastId = id;
        if (data.length === 0) return;
        let parsed: unknown = data.join('\n');
        try {
            parsed = JSON.parse(parsed as string);
        } catch {
            /* plain text payload */
        }
        onMessage({ id, event, data: parsed });
    };

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n?/g, '\n');
        let sep: number;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
            dispatch(buffer.slice(0, sep));
            buffer = buffer.slice(sep + 2);
        }
    }
    if (buffer.trim()) dispatch(buffer);
    return lastId;
}

/**
 * Open a job stream (POST that starts the job, or GET /api/jobs/:id/events) and keep
 * reading, reconnecting with Last-Event-ID if the connection drops before the job ends.
 */
export async function followJobStream(
    start: () => Promise<Response>,
    onData: (data: unknown) => void,
    opts: { maxReconnects?: number } = {}
): Promise<{ status?: string; error?: string; result?: unknown }> {
    let response = await start();
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const detail = Array.isArray(body.details) && body.details[0]?.message ? `: ${body.details[0].message}` : '';
        throw new Error(`${body.error || body.message || `Request failed (HTTP ${response.status})`}${detail}`);
    }
    const jobId = response.headers.get('X-Job-Id');
    let end: { status?: string; error?: string; result?: unknown } | null = null;
    let lastId: string | undefined;

    for (let attempt = 0; ; attempt++) {
        try {
            lastId = (await readSseStream(response, (m) => {
                if (m.event === 'end') end = m.data as typeof end;
                else onData(m.data);
            })) ?? lastId;
        } catch {
            /* network error: fall through to reconnect */
        }
        if (end || !jobId || attempt >= (opts.maxReconnects ?? 20)) break;
        await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 10_000)));
        response = await fetch(`/api/jobs/${jobId}/events`, {
            headers: lastId ? { 'Last-Event-ID': lastId } : {},
        });
        if (!response.ok) break;
    }
    return end ?? { status: 'UNKNOWN', error: 'Lost connection to the operation. Check its status in your activity log.' };
}
