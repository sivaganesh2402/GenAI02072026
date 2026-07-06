I want you to create a simple **RAG Explorer** application.

The source file will be uploaded through the UI. It will be a PDF containing the Product Requirements Document (PRD) for vwo.com.

Your task is to build a React-based UI that demonstrates how the ingestion and retrieval process works.

The application should do the following:
1. Read the PDF file uploaded through the UI. The uploaded file will be a Product Requirements Document (PRD) for vwo.com. Do not read the file from the data/data folder.
2. Split the PDF content into chunks.
3. Generate embeddings for those chunks using the **Nomic Embed** embedding model.
4. Store the embeddings automatically in a local **ChromaDB** instance.
5. Provide a query interface where I can ask questions related to the PDF.
6. For every query, retrieve and display the **top 4 relevant chunks** fetched from the document.
7. Use **Groq** as the LLM provider, with the **OpenGPT 120B** model, to generate the final answer based on the retrieved chunks.
8. The UI should clearly showcase the complete RAG flow: PDF ingestion, chunking, embedding, storage, retrieval, and answer generation.

9. create an additional tab in the UI called "Vector Database" (or "Embeddings"). This tab should display how the uploaded document is split into chunks and how each chunk is stored in the vector database. For every chunk, show:
a. Chunk ID
b. Chunk text
c. Embedding vector (or the first few dimensions with an option to expand)
d. Metadata (source file, page number, chunk index, etc.)
e. The vector database record/ID

This view is intended for educational purposes so I can understand how embeddings are created and stored for each chunk.

The goal of this application is to demonstrate how a basic RAG pipeline works end-to-end using a local vector database and a React frontend.
