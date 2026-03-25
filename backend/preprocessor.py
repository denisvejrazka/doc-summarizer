from fitz import open as fitz_open
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from models import Chunk, DocumentFile

text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)
markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[
    ("#", "h1"),
    ("##", "h2"),
    ("###", "h3"),
])


def remove_f_type_prefix(full_file_type: str):
    if "/" in full_file_type:
        return full_file_type.split('/', 1)[1]
    return full_file_type


def process_pdf(file_bytes: bytes) -> tuple[str, list[Chunk]]:
    doc = fitz_open(stream=file_bytes, filetype="pdf")
    full_text_parts = []
    chunks = []
    chunk_index = 0

    for page in doc:
        page_text = page.get_text()
        page_num = page.number + 1
        full_text_parts.append(page_text)

        for part in text_splitter.split_text(page_text):
            chunks.append(Chunk(
                content=part,
                chunk_index=chunk_index,
                metadata=f"page:{page_num}"
            ))
            chunk_index += 1

    doc.close()
    return "\n".join(full_text_parts), chunks


def process_md(text: str) -> tuple[str, list[Chunk]]:
    header_chunks = markdown_splitter.split_text(text)
    split_docs = text_splitter.split_documents(header_chunks)
    chunks = []

    for i, doc in enumerate(split_docs):
        header_level = next((k for k in ["h1", "h2", "h3"] if k in doc.metadata), None)
        header_value = doc.metadata.get(header_level) if header_level else None
        chunks.append(Chunk(
            content=doc.page_content,
            chunk_index=i,
            metadata=f"{header_level}:{header_value}" if header_level else None
        ))

    return text, chunks


def process_txt(text: str) -> tuple[str, list[Chunk]]:
    parts = text_splitter.split_text(text)
    return text, [Chunk(content=part, chunk_index=i) for i, part in enumerate(parts)]


def process_file(filename: str, file_bytes: bytes) -> DocumentFile:
    if filename.endswith(".pdf"):
        content, chunks = process_pdf(file_bytes)
        file_type = "pdf"
    elif filename.endswith(".md"):
        content, chunks = process_md(file_bytes.decode("utf-8"))
        file_type = "md"
    elif filename.endswith(".txt"):
        content, chunks = process_txt(file_bytes.decode("utf-8"))
        file_type = "txt"
    else:
        raise ValueError(f"Unsupported file type: {filename}")

    return DocumentFile(filename=filename, file_type=file_type, content=content, chunks=chunks)
