import io
import os
import json
import uuid
from typing import Any
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
import chromadb
from chromadb.utils import embedding_functions
from nomic import embed
import nomic.cli
import groq

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / '.env')
CHROMA_DIR = BASE_DIR / 'chroma'
COLLECTION_NAME = 'rag_explorer'
NOMIC_MODEL = 'nomic-embed-text-v1.5'
NOMIC_TASK = 'search_document'
GROQ_MODEL = 'openai/gpt-oss-120b'

app = FastAPI(title='RAG Explorer API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:4173'],
    allow_methods=['*'],
    allow_headers=['*'],
)

class QueryRequest(BaseModel):
    query: str
    top_k: int = 4

class UploadResponse(BaseModel):
    success: bool
    vector_records: list[dict[str, Any]]

class QueryResponse(BaseModel):
    answer: str
    retrieved_chunks: list[dict[str, Any]]


def create_chroma_client() -> chromadb.api.ClientAPI:
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def ensure_nomic_credentials() -> None:
    api_key = os.getenv('NOMIC_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail='NOMIC_API_KEY is not set in backend environment.')
    try:
        nomic.cli.login(api_key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Nomic authentication failed: {exc}')


def build_collection(client: chromadb.api.ClientAPI):
    try:
        return client.get_collection(name=COLLECTION_NAME)
    except Exception:
        return client.create_collection(name=COLLECTION_NAME, get_or_create=True)


@app.post('/api/upload', response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail='Only PDF uploads are supported.')

    pdf_bytes = await file.read()
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f'Failed to read PDF: {exc}')

    documents: list[str] = []
    metadatas: list[dict[str, Any]] = []
    ids: list[str] = []
    vector_records: list[dict[str, Any]] = []

    for page_index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ''
        cleaned = ' '.join(text.split())
        if not cleaned:
            continue

        # simple page-level chunks
        chunk_texts = []
        max_chunk_tokens = 3000
        raw_words = cleaned.split(' ')
        for start in range(0, len(raw_words), max_chunk_tokens):
            chunk = ' '.join(raw_words[start:start + max_chunk_tokens])
            if chunk:
                chunk_texts.append(chunk)

        for chunk_index, chunk in enumerate(chunk_texts, start=1):
            doc_id = str(uuid.uuid4())
            documents.append(chunk)
            metadatas.append({
                'source': file.filename,
                'page': page_index,
                'chunk_index': chunk_index,
                'chunk_id': doc_id,
            })
            ids.append(doc_id)
            vector_records.append({
                'id': doc_id,
                'text': chunk,
                'metadata': metadatas[-1],
                'vector_id': doc_id,
            })

    if not documents:
        raise HTTPException(status_code=400, detail='PDF contained no extractable text.')

    ensure_nomic_credentials()
    try:
        embed_response = embed.text(
            texts=documents,
            model=NOMIC_MODEL,
            task_type=NOMIC_TASK,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Nomic embedding failed: {exc}')

    # nomic.embed.text may return different shapes depending on version:
    # - older: {'data': [{'embedding': [...]}, ...]}
    # - newer: {'embeddings': [[...], [...]], ...}
    if isinstance(embed_response, dict) and 'data' in embed_response:
        embeddings = [item.embedding for item in embed_response['data']]
    elif isinstance(embed_response, dict) and 'embeddings' in embed_response:
        embeddings = embed_response['embeddings']
    else:
        raise HTTPException(status_code=500, detail='Unexpected Nomic embedding response format')
    client = create_chroma_client()
    collection = build_collection(client)
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings,
    )

    # attach embeddings to returned vector_records for UI preview
    for i, rec in enumerate(vector_records):
        try:
            rec['embedding'] = embeddings[i]
        except Exception:
            rec['embedding'] = []

    return {
        'success': True,
        'vector_records': vector_records,
        'pages': len(reader.pages),
        'num_chunks': len(vector_records),
    }


@app.post('/api/query', response_model=QueryResponse)
async def query_pdf(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail='Query text is required.')

    ensure_nomic_credentials()
    try:
        qresp = embed.text(
            texts=[request.query],
            model=NOMIC_MODEL,
            task_type='search_query',
        )
        if isinstance(qresp, dict) and 'data' in qresp:
            query_embed = qresp['data'][0].embedding
        elif isinstance(qresp, dict) and 'embeddings' in qresp:
            query_embed = qresp['embeddings'][0]
        else:
            raise Exception('Unexpected Nomic query response format')
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Nomic query embedding failed: {exc}')

    client = create_chroma_client()
    collection = build_collection(client)
    results = collection.query(
        query_embeddings=[query_embed],
        n_results=request.top_k,
        include=['documents', 'metadatas', 'distances'],
    )

    retrieved_chunks: list[dict[str, Any]] = []
    documents = results['documents'][0]
    metadatas = results['metadatas'][0]
    distances = results['distances'][0]

    for idx, (doc, metadata, distance) in enumerate(zip(documents, metadatas, distances), start=1):
        retrieved_chunks.append({
            'id': metadata.get('chunk_id', str(idx)),
            'text': doc,
            'metadata': metadata,
            'vector_id': metadata.get('chunk_id', str(idx)),
            'distance': distance,
        })

    prompt_lines = [
        'Use the retrieved document chunks to answer the question clearly and accurately.',
        'Question: ' + request.query,
        'Context:',
    ]
    for chunk in retrieved_chunks:
        prompt_lines.append(f"- Chunk {chunk['metadata'].get('chunk_index', idx)} (page {chunk['metadata'].get('page', '?')}): {chunk['text']}")
    prompt_lines.append('Answer:')
    prompt = '\n'.join(prompt_lines)

    try:
        groq_client = groq.Client(api_key=os.environ.get('GROQ_API_KEY'))
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {'role': 'system', 'content': 'You are a helpful assistant that answers questions using only provided document context.'},
                {'role': 'user', 'content': prompt},
            ],
        )
        answer = ''
        if completion.choices:
            choice = completion.choices[0]
            message = getattr(choice, 'message', None)
            if message is not None:
                answer = getattr(message, 'content', None) or (message.get('content') if isinstance(message, dict) else '')
            else:
                answer = ''
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Groq answer generation failed: {exc}')

    return {
        'answer': answer,
        'retrieved_chunks': retrieved_chunks,
    }
