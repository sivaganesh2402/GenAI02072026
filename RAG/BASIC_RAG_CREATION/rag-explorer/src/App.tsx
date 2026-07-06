import { useMemo, useState } from 'react';

type ChunkRecord = {
  id: string;
  text: string;
  metadata: Record<string, string | number>;
  embedding?: number[];
  vector_id?: string;
};

type QueryResult = {
  answer: string;
  retrieved_chunks: ChunkRecord[];
};

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

function App() {
  const [activeTab, setActiveTab] = useState<'rag' | 'db'>('rag');
  const [fileName, setFileName] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('Upload a PDF to start the RAG flow.');
  const [vectorRecords, setVectorRecords] = useState<ChunkRecord[]>([]);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [querying, setQuerying] = useState(false);
  const [pages, setPages] = useState<number | null>(null);
  const [numChunks, setNumChunks] = useState<number | null>(null);

  const canQuery = useMemo(() => uploadStatus === 'ready' && query.trim().length > 0, [uploadStatus, query]);

  const handleUpload = async (file: File) => {
    setUploadStatus('uploading');
    setMessage('Uploading PDF and building vector index...');
    setResult(null);
    setVectorRecords([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const contentType = response.headers.get('content-type') || '';
      let body: any = null;
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = { error: await response.text() };
      }
      if (!response.ok) {
        const errorMessage = body?.detail || body?.error || body?.message || response.statusText || 'Upload failed';
        throw new Error(errorMessage);
      }
      setUploadStatus('ready');
      setFileName(file.name);
      setMessage('PDF ingested and embedded successfully. Use the RAG tab to ask questions.');
      setVectorRecords(body.vector_records || []);
      setPages(body.pages ?? null);
      setNumChunks(body.num_chunks ?? null);
      setActiveTab('rag');
    } catch (error) {
      setUploadStatus('error');
      setMessage(`Upload failed: ${(error as Error).message}`);
    }
  };

  const handleQuery = async () => {
    if (!canQuery) return;
    setQuerying(true);
    setResult(null);
    setMessage('Retrieving the top 4 chunks and generating an answer...');

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: 4 }),
      });
      const contentType = response.headers.get('content-type') || '';
      let body: any = null;
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = { error: await response.text() };
      }
      if (!response.ok) {
        const errorMessage = body?.detail || body?.error || body?.message || response.statusText || 'Query failed';
        throw new Error(errorMessage);
      }
      setResult(body as QueryResult);
      setMessage('Answer generated from retrieved document context.');
    } catch (error) {
      setMessage(`Query failed: ${(error as Error).message}`);
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="title-block">
          <h1>RAG Explorer</h1>
          <p>Upload a PRD PDF, inspect embeddings, and ask questions with Groq + OpenGPT 120B.</p>
        </div>
        <div className="tab-row">
          <button type="button" className={activeTab === 'rag' ? 'active' : ''} onClick={() => setActiveTab('rag')}>
            RAG Flow
          </button>
          <button type="button" className={activeTab === 'db' ? 'active' : ''} onClick={() => setActiveTab('db')}>
            Vector Database
          </button>
        </div>
      </header>

      <div className="pipeline">
        <div className="step">1 · PDF<br/><span>load document</span></div>
        <div className="arrow">→</div>
        <div className="step">2 · Chunk<br/><span>split text</span></div>
        <div className="arrow">→</div>
        <div className="step">3 · Embed<br/><span>Nomic vectors</span></div>
        <div className="arrow">→</div>
        <div className="step">4 · Store<br/><span>ChromaDB</span></div>
        <div className="arrow">→</div>
        <div className="step">5 · Retrieve<br/><span>top-4</span></div>
        <div className="arrow">→</div>
        <div className="step">6 · Answer<br/><span>Groq LLM</span></div>
      </div>

      {activeTab === 'rag' ? (
        <main className="two-col">
          <aside className="left-panel">
          <div className="ingest card">
            <div className="ingest-header">
              <h2>1 · Ingestion</h2>
              <div className="ingest-actions">
                <button className="btn orange" onClick={() => { /* placeholder for folder ingest */ }}>Ingest folder</button>
                <button className="btn">Reset</button>
              </div>
            </div>

            <div className="source">
              <strong>Source folder:</strong> /local/uploads
            </div>

            <label className="drop-area">
              <input type="file" accept="application/pdf" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleUpload(file);
              }} />
              <div className="drop-inner">
                <p>Drop a PDF, .txt or .md here — or click to browse</p>
              </div>
            </label>

            <div className="stats-row">
              <div className="stat">
                <div className="stat-num">{pages ?? '—'}</div>
                <div className="stat-label">Pages</div>
              </div>
              <div className="stat">
                <div className="stat-num">{numChunks ?? vectorRecords.length}</div>
                <div className="stat-label">Chunks</div>
              </div>
              <div className="stat">
                <div className="stat-num">{vectorRecords[0]?.embedding?.length ?? 0}</div>
                <div className="stat-label">Embed dims</div>
              </div>
              <div className="stat">
                <div className="stat-num">{vectorRecords.length}</div>
                <div className="stat-label">Stored</div>
              </div>
            </div>

            <div className="embed-sample card">
              <strong>Sample embedding (first 8):</strong>
              <pre className="embed-preview">{JSON.stringify((vectorRecords[0]?.embedding ?? []).slice(0, 8))}</pre>
            </div>

            <div className="chunk-preview card">
              <strong>Chunk preview:</strong>
              {vectorRecords[0] ? (
                <div>
                  <div className="chunk-meta-row">chunk • {vectorRecords[0].text.length} chars</div>
                  <p className="chunk-text-small">{vectorRecords[0].text.slice(0, 400)}{vectorRecords[0].text.length > 400 ? '…' : ''}</p>
                </div>
              ) : (
                <p>No chunk to preview yet.</p>
              )}
            </div>
          </div>
        </aside>

        <section className="right-panel">
          <div className="ask card">
            <h3>2 · Ask the document</h3>
            <textarea
              value={query}
              placeholder="Can you tell me what is there in the document?"
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="ask-actions">
              <div className="suggestions">
                <button className="chip" onClick={() => setQuery('What is the goal of this PRD?')}>What is the goal of this PRD?</button>
                <button className="chip" onClick={() => setQuery('Who are the target users?')}>Who are the target users?</button>
              </div>
              <button className="btn orange" onClick={handleQuery} disabled={!canQuery || querying}>{querying ? 'Ask...' : 'Ask'}</button>
            </div>
          </div>

          {result && (
            <div className="answer card">
              <h2>Answer</h2>
              <div className="answer-body">{result.answer}</div>
              <div className="answer-meta">openai/gpt-oss-120b · {result.answer.length} tok</div>
            </div>
          )}
        </section>
      </main>
      ) : (
        <main className="vector-db">
          <section className="card">
            <h2>Vector Database</h2>
            <div className="status-box">
              <strong>Uploaded file:</strong> {fileName || 'None'}
              <br />
              <span>{message}</span>
            </div>

            <div className="vector-table">
              {vectorRecords.length === 0 ? (
                <p>No vectors available yet. Upload a PDF first.</p>
              ) : (
                vectorRecords.map((record) => (
                  <div key={record.id} className="vector-card">
                    <div className="vector-card-header">
                      <span>ID: {record.id}</span>
                      <span>Record: {record.vector_id || 'N/A'}</span>
                    </div>
                    <p className="chunk-text">{record.text}</p>
                    <div className="vector-metadata">
                      <div>
                        <strong>Source</strong><br />
                        {record.metadata.source || 'uploaded PDF'}
                      </div>
                      <div>
                        <strong>Page</strong><br />
                        {record.metadata.page || 'unknown'}
                      </div>
                      <div>
                        <strong>Chunk</strong><br />
                        {record.metadata.chunk_index ?? 'unknown'}
                      </div>
                    </div>
                    <details>
                      <summary>Embedding preview</summary>
                      <pre className="embed-preview">{JSON.stringify(record.embedding?.slice(0, 32) ?? [], null, 2)}</pre>
                    </details>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
