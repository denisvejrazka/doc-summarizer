from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
llm = "gemini-2.5-flash-lite"
embedding_model = "gemini-embedding-2-preview"
client = genai.Client(api_key=api_key)


async def get_summary(processed_text):
    response = await client.aio.models.generate_content_stream(
        model= llm,
        config=types.GenerateContentConfig(
            temperature=0.1,
            system_instruction="You are a professional assistant, that helps summarizing text.",
            max_output_tokens=512
        ),
        contents=[
            "Write a concise summary of the following text in approximately 100 words. Make sure to always finish your sentences completely and do not end abruptly:",
            processed_text
        ]
    )

    async def text_generator():
        async for chunk in response:
            if chunk.text is not None:
                yield chunk.text
    return text_generator()


async def standard_search(user_prompt, processed_text):
    response = await client.aio.models.generate_content_stream(
        model= llm,
        config=types.GenerateContentConfig(
            temperature=0.1,
            system_instruction="You are a professional assistant. Answer questions based ONLY on the provided text. If the information is not in the text, say you don't know. Do not use outside knowledge",
            max_output_tokens=1024
        ),
        contents=[
            f"Question: {user_prompt}",
            f"Document Context: {processed_text}"
        ]
    )

    async def text_generator():
        async for chunk in response:
            if chunk.text is not None:
                yield chunk.text

    return text_generator()


async def get_tokens(processed_text):
    tokens = await client.aio.models.count_tokens(
        model=llm,
        contents=processed_text
    )

    return tokens.total_tokens


async def pro_search(user_prompt):
    pass


async def embed(text: str, task_type: str) -> list[float]:
    result = await client.aio.models.embed_content(
        model=embedding_model,
        contents=text,
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=768
        )
    )
    return result.embeddings[0].values
