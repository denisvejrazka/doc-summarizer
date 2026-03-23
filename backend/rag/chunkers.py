from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from langchain_core.documents import Document

text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)

headers_to_split_on = [
    ("#", "h1"),
    ("##", "h2"),
    ("###", "h3"),
]
markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)


def chunk_txt(text: str) -> list[Document]:
    return [Document(page_content=t) for t in text_splitter.split_text(text)]


def chunk_md(text: str) -> list[Document]:
    header_chunks = markdown_splitter.split_text(text)
    return text_splitter.split_documents(header_chunks)