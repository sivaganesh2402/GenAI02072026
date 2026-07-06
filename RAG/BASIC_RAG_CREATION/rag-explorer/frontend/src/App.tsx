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
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Upload failed');
      setUploadStatus('ready');
      setFileName(file.name);
      setMessage('PDF ingested and embedded successfully. Use the RAG tab to ask questions.');
      setVectorRecords(body.vector_records || []);
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
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Query failed');
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
        <div>
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

      <main>
        {activeTab === 'rag' ? (
          <section className="panel">
            <div className="upload-block">
              <label className="upload-label">
                Select PRD PDF
                <input type="file" accept="application/pdf" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleUpload(file);
                }} />
              </label>
              <div className="status-box">
                <strong>Status:</strong> {uploadStatus}
                <br />
                <span>{message}</span>
              </div>
            </div>

            <div className="query-block">
              <textarea
                value={query}
                placeholder="Ask something about the uploaded PRD..."
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="button" onClick={handleQuery} disabled={!canQuery || querying}>
                {querying ? 'Generating answer...' : 'Ask question'}
              </button>
            </div>

            {result && (
              <div className="result-card">
                <h2>Answer</h2>
                <p>{result.answer}</p>
                <h3>Retrieved chunks</h3>
                <ol>
                  {result.retrieved_chunks.map((chunk) => (
                    <li key={chunk.id}>
                      <strong>{chunk.metadata.chunk_index ? `Chunk ${chunk.metadata.chunk_index}` : chunk.id}</strong>
                      <p>{chunk.text}</p>
                      <pre className="chunk-meta">{JSON.stringify(chunk.metadata, null, 2)}</pre>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        ) : (
          <section className="panel">
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
                      <pre>{JSON.stringify(record.embedding?.slice(0, 12) ?? [], null, 2)}</pre>
                    </details>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
