import json
import os
import re
import time

import httpx
from dotenv import load_dotenv

load_dotenv()

TIMEOUT = httpx.Timeout(45.0)
API_URL = "https://openrouter.ai/api/v1/chat/completions"


class LLMError(Exception):
    pass


def get_models() -> list[str]:
    return [m.strip() for m in os.getenv("MODELS", "").split(",") if m.strip()]


def extract_json(text: str) -> dict:
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("no JSON object in the reply")
    return json.loads(text[start : end + 1])


def _call(model: str, prompt: str, key: str) -> str:
    response = httpx.post(
        API_URL,
        headers={"Authorization": f"Bearer {key}", "X-Title": "ResumeFit"},
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 2000,
        },
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    message = response.json()["choices"][0]["message"]
    return message.get("content") or ""


def complete_json(prompt: str) -> tuple[dict, str]:
    key = os.getenv("OPENROUTER_API_KEY")
    models = get_models()
    if not key:
        raise LLMError("OPENROUTER_API_KEY is not set")
    if not models:
        raise LLMError("MODELS is not set")

    for model in models:
        for _attempt in (1, 2):
            try:
                return extract_json(_call(model, prompt, key)), model
            except httpx.HTTPStatusError as error:
                if error.response.status_code in (400, 401, 402, 403, 404, 429):
                    break
                time.sleep(1)
            except (httpx.HTTPError, KeyError, IndexError, ValueError):
                time.sleep(1)

    raise LLMError("AI models are unavailable right now. Try again later.")