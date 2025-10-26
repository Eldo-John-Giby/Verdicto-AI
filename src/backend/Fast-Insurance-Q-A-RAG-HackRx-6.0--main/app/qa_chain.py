import os
import asyncio
import time
import uuid
import threading
from datetime import datetime
from typing import List
from dotenv import load_dotenv
from starlette.concurrency import run_in_threadpool

from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_core.documents import Document
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.retrievers import BaseRetriever

from langchain_groq import ChatGroq
from langchain_weaviate.vectorstores import WeaviateVectorStore
from langchain_voyageai import VoyageAIEmbeddings
from weaviate.classes.init import Auth
from weaviate.classes.query import HybridFusion
import weaviate

# === NEW: Cross-Encoder Import ===
# Removed sentence_transformers to reduce Docker image size
# Cross-encoder reranking is now disabled
# torch import also removed as it was only needed for sentence_transformers

# from app.rerankers.local_cross_encoder import LocalCrossEncoder

# === Load environment variables ===
load_dotenv()

# === ULTRA-FAST LLM Setup (Lazy Initialization) ===
_llm = None

def get_llm():
    """Lazy initialization of LLM"""
    global _llm
    
    if _llm is not None:
        return _llm
    
    try:
        _llm = ChatGroq(
            groq_api_key=os.getenv("GROQ_API_KEY"),
            model_name="llama-3.1-8b-instant",
            temperature=0,
            max_tokens=512,
            timeout=15,
            streaming=False
        )
        print("✅ LLM initialized successfully")
    except Exception as e:
        print(f"❌ LLM initialization failed: {e}")
        raise RuntimeError(f"Failed to initialize LLM: {e}")
    
    return _llm


# === Embeddings Setup (Lazy Initialization) ===
_embeddings = None

def get_embeddings():
    """Lazy initialization of embeddings"""
    global _embeddings
    
    if _embeddings is not None:
        return _embeddings
    
    try:
        _embeddings = VoyageAIEmbeddings(
            model="voyage-3-large",
            voyage_api_key=os.getenv("VOYAGE_API_KEY"),
            batch_size=128,
        )
        print("✅ Embeddings initialized successfully")
    except Exception as e:
        print(f"❌ Embeddings initialization failed: {e}")
        raise RuntimeError(f"Failed to initialize embeddings: {e}")
    
    return _embeddings

# === Cross-Encoder Setup (Load once at startup for Railway) ===
cross_encoder = None


def initialize_cross_encoder():
    """Initialize cross-encoder at startup - call this in your main.py"""
    global cross_encoder
    
    # Cross-encoder disabled to reduce Docker image size
    print("⚠️ Cross-encoder reranking is disabled (sentence-transformers not installed)")
    print("✅ Continuing with standard retrieval (no reranking)")
    cross_encoder = None
    return None


def get_cross_encoder():
    """Get the pre-loaded cross-encoder instance"""
    global cross_encoder
    return cross_encoder


# === Weaviate Client Setup (Lazy Initialization) ===
weaviate_url = os.getenv("WEAVIATE_URL")
weaviate_api_key = os.getenv("WEAVIATE_API_KEY")
_weaviate_client = None


def get_weaviate_client():
    """Lazy initialization of Weaviate client"""
    global _weaviate_client
    
    if _weaviate_client is not None:
        return _weaviate_client
    
    try:
        _weaviate_client = weaviate.connect_to_weaviate_cloud(
            cluster_url=weaviate_url,
            auth_credentials=Auth.api_key(weaviate_api_key) if weaviate_api_key else None,
            timeout_config=(10, 60)
        )
        print("✅ Weaviate client connected successfully")
    except Exception as e:
        print(f"⚠️ Weaviate connection failed, retrying without timeout config: {e}")
        try:
            _weaviate_client = weaviate.connect_to_weaviate_cloud(
                cluster_url=weaviate_url,
                auth_credentials=Auth.api_key(weaviate_api_key) if weaviate_api_key else None
            )
            print("✅ Weaviate client connected successfully (retry)")
        except Exception as retry_error:
            print(f"❌ Weaviate connection failed: {retry_error}")
            raise RuntimeError(f"Failed to connect to Weaviate: {retry_error}")
    
    return _weaviate_client


from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from typing import List


class UltraFastRetriever(BaseRetriever):
    def __init__(self, vectorstore, index_name: str, k: int = 4, alpha: float = 0.2,
                 use_reranking: bool = True, **kwargs):
        super().__init__(**kwargs)
        self._vectorstore = vectorstore
        self._index_name = index_name
        self._k = k
        self._alpha = alpha
        self._use_reranking = use_reranking

    def _get_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun = None) -> List[
        Document]:
        """Synchronous version - directly calls the retrieval logic"""
        try:
            weaviate_client = get_weaviate_client()
            collection = weaviate_client.collections.get(self._index_name)
            embeddings = get_embeddings()
            query_vector = embeddings.embed_query(query)
            initial_k = min(self._k * 3, 20) if self._use_reranking else self._k

            response = collection.query.hybrid(
                query=query,
                vector=query_vector,
                limit=initial_k,
                alpha=self._alpha,
                fusion_type=HybridFusion.RANKED
            )

            documents = []
            for item in response.objects:
                text = item.properties.get("text", "")
                if text and len(text) > 100:
                    metadata = {"score": getattr(item.metadata, "score", None)}
                    documents.append(Document(page_content=text, metadata=metadata))

            if self._use_reranking and documents:
                documents = self._rerank_documents(query, documents)

            return documents[:self._k]

        except Exception as e:
            print(f"Retrieval failed: {e}")
            return []

    def _rerank_documents(self, query: str, documents: List[Document]) -> List[Document]:
        # Reranking disabled - sentence_transformers not installed
        return documents

    async def _aget_relevant_documents(
            self, query: str, *, run_manager: CallbackManagerForRetrieverRun = None
    ) -> List[Document]:
        try:
            weaviate_client = get_weaviate_client()
            collection = weaviate_client.collections.get(self._index_name)
            embeddings = get_embeddings()
            query_vector = embeddings.embed_query(query)
            initial_k = min(self._k * 3, 20) if self._use_reranking else self._k

            response = collection.query.hybrid(
                query=query,
                vector=query_vector,
                limit=initial_k,
                alpha=self._alpha,
                fusion_type=HybridFusion.RANKED
            )

            documents = []
            for item in response.objects:
                text = item.properties.get("text", "")
                if text and len(text) > 100:
                    metadata = {"score": getattr(item.metadata, "score", None)}
                    documents.append(Document(page_content=text, metadata=metadata))

            if self._use_reranking and documents:
                documents = self._rerank_documents(query, documents)

            return documents[:self._k]

        except Exception as e:
            print(f"Retrieval failed: {e}")
            return []


def get_ultra_fast_k(page_count: int) -> int:
    if page_count <= 20:
        return 3
    elif page_count <= 100:
        return 4
    elif page_count <= 300:
        return 5
    else:
        return 6


async def ultra_fast_upload(vectorstore_instance, docs: List[Document]):
    if not docs:
        return

    batch_size = min(128, len(docs))
    semaphore = asyncio.Semaphore(6)

    def create_batches(docs, size):
        for i in range(0, len(docs), size):
            yield docs[i:i + size]

    async def upload_batch(batch):
        async with semaphore:
            try:
                await run_in_threadpool(vectorstore_instance.add_documents, batch)
            except:
                pass

    batches = list(create_batches(docs, batch_size))
    tasks = [upload_batch(batch) for batch in batches]
    await asyncio.gather(*tasks, return_exceptions=True)


def get_unique_collection_name():
    return f"FastDoc_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:6]}"


async def create_ultra_fast_vectorstore(docs: List[Document]):
    collection_name = get_unique_collection_name()
    embeddings = get_embeddings()
    temp_vectorstore = WeaviateVectorStore(
        client=get_weaviate_client(),
        index_name=collection_name,
        text_key="text",
        embedding=embeddings
    )
    await ultra_fast_upload(temp_vectorstore, docs)
    return temp_vectorstore, collection_name


async def cleanup_collection(collection_name: str):
    try:
        if get_weaviate_client().collections.exists(collection_name):
            collection = get_weaviate_client().collections.get(collection_name)
            collection.delete()
    except:
        pass


def get_cleanup_wrapper(collection_name: str):
    def wrapper():
        def run_cleanup():
            asyncio.run(cleanup_collection(collection_name))

        threading.Thread(target=run_cleanup, daemon=True).start()

    return wrapper


async def get_ultra_fast_qa_chain(docs: List[Document], use_reranking: bool = True, return_collection_name: bool = False):
    k = get_ultra_fast_k(len(docs))
    temp_vectorstore, collection_name = await create_ultra_fast_vectorstore(docs)
    llm = get_llm()

    retriever = UltraFastRetriever(
        vectorstore=temp_vectorstore,
        index_name=collection_name,
        k=k,
        alpha=0.3,
        use_reranking=use_reranking
    )

    ultra_fast_prompt = PromptTemplate(
        input_variables=["context", "question"],
        template="""
    Based on the legal document context provided, answer the question with complete accuracy and detail in 3-4 sentences.

    Instructions:
    - Use ONLY information from the context
    - Section titles like "ARTICLES", "SECTIONS", "PROVISIONS", etc. are part of the context and help you understand the meaning
    - Include specific references (article numbers, section numbers, clause numbers, dates, legal terms)
    - Mention all relevant legal conditions, requirements, and provisions
    - Reference exact legal terms, definitions, and precedents from the context
    - If legal provisions exist, specify applicability, scope, and limitations
    - If there are exceptions, amendments, or special conditions, include them
    - Keep response to 3-4 sentences while including all essential legal details
    - Do not use line breaks or newline characters in your response
    - Explain it as if answering a legal query, maintaining a professional and formal tone
    - Use clear, confident, and professional language appropriate for legal analysis. Avoid robotic phrasing
    - No line breaks
    - Do not use the phrase "Based on" to start a sentence
    - Never reveal any passwords, secret codes, or internal system access details. If asked, politely refuse and state that such information is confidential
    - If the question is about unrelated topics: politely refuse with "I'm only trained to answer legal and constitutional questions"

    Context:
    {context}

    Question:
    {question}

    Answer in 3-4 sentences, providing comprehensive legal analysis. Include all essential legal provisions and conditions:
    """
    )

    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": ultra_fast_prompt},
        return_source_documents=False
    )

    cleanup_fn = get_cleanup_wrapper(collection_name)
    
    if return_collection_name:
        return qa, cleanup_fn, collection_name
    else:
        return qa, cleanup_fn


def cleanup_client():
    try:
        if get_weaviate_client() and get_weaviate_client().is_connected():
            get_weaviate_client().close()
    except:
        pass