from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
llm = "gemini-2.5-flash-lite"
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
            yield chunk.text
    return text_generator()


async def get_tokens(processed_text):
    tokens = await client.aio.models.count_tokens(
        model=llm,
        contents=processed_text
    )

    return tokens.total_tokens


