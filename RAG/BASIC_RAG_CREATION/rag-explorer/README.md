# RAG Explorer

A simple end-to-end RAG demo built with React frontend and FastAPI backend.

## Setup

1. Install Python dependencies:
   ```bash
   cd e:/TestingAcedamyGenAI/AI-Learning/RAG/BASIC_RAG_CREATION/rag-explorer/backend
   e:/TestingAcedamyGenAI/AI-Learning/.venv/Scripts/python.exe -m pip install -r requirements.txt
   ```

2. Install Node dependencies:
   ```bash
   cd e:/TestingAcedamyGenAI/AI-Learning/RAG/BASIC_RAG_CREATION/rag-explorer
   npm install
   ```

3. Create a `.env` file in `backend/` with these keys:
   ```ini
   NOMIC_API_KEY=your_nomic_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Run backend:
   ```bash
   cd e:/TestingAcedamyGenAI/AI-Learning/RAG/BASIC_RAG_CREATION/rag-explorer/backend
   e:/TestingAcedamyGenAI/AI-Learning/.venv/Scripts/python.exe -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

5. Run frontend:
   ```bash
   cd e:/TestingAcedamyGenAI/AI-Learning/RAG/BASIC_RAG_CREATION/rag-explorer
   npm run dev -- --host
   ```

6. Open the UI at `http://localhost:4173`.

## Features

- Upload a PRD PDF through the UI
- Split the PDF into chunks and embed each chunk with Nomic
- Store embeddings in a local ChromaDB instance
- Query the PDF and retrieve the top 4 chunks
- Generate a final answer using Groq + OpenGPT 120B
- Inspect vector database chunks in the `Vector Database` tab
