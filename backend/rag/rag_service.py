from sqlmodel import select, Session
from db_models import DocumentChunk

def retrieve_chunks(session: Session, document_id: int, query_embedding: list[float], top_k: int = 5) -> list[DocumentChunk]:
    results = session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.embedding.max_inner_product(query_embedding))
        .limit(top_k)
    )
    return results.all()
