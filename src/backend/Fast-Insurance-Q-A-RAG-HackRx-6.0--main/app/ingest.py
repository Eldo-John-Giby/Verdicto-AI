"""
=====================
⚠️DEPRECIATED FILE ⚠️
=====================

Not part of the main program anymore
"""

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


def ingest_pdf(pdf_path, persist_directory="chroma_db"):
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = splitter.split_documents(pages)

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = Chroma.from_documents(docs, embeddings, persist_directory=persist_directory)
    db.persist()

    print(f"Ingested and stored embeddings for {pdf_path} in {persist_directory}")


if __name__ == "__main__":
    ingest_pdf("land_laws.pdf")
