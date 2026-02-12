import json
from typing import Any, Dict, List

import requests

from config import Config


class OpenAIServiceError(Exception):
    pass


class OpenAIService:
    def __init__(self) -> None:
        self.api_key = Config.OPENAI_API_KEY
        self.base_url = Config.OPENAI_API_BASE.rstrip("/")
        self.model = Config.OPENAI_MODEL

    def _build_prompt(self, parsed_files: List[Dict[str, str]], summary: Dict[str, int]) -> str:
        return (
            "You are a senior software engineer performing a pull request review. "
            "Analyze the following code diff and return JSON only with these top-level keys: "
            "summary, security, performance, code_quality, best_practices. "
            "For each category except summary, return an array of findings with keys: "
            "title, description, severity, file_path, line, suggestion. "
            "Focus on security vulnerabilities, code smells, performance improvements, and best practices.\n\n"
            f"Diff summary: {json.dumps(summary)}\n"
            f"Diff files: {json.dumps(parsed_files)}"
        )

    def analyze_pull_request(self, parsed_files: List[Dict[str, str]], summary: Dict[str, int]) -> Dict[str, Any]:
        if not self.api_key:
            raise OpenAIServiceError("OPENAI_API_KEY is not configured")

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are an expert code reviewer."},
                {"role": "user", "content": self._build_prompt(parsed_files, summary)},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=60,
        )

        if response.status_code >= 400:
            raise OpenAIServiceError(
                f"OpenAI API request failed ({response.status_code}): {response.text}"
            )

        try:
            content = response.json()["choices"][0]["message"]["content"]
            return json.loads(content)
        except (KeyError, json.JSONDecodeError, TypeError) as exc:
            raise OpenAIServiceError("Invalid response format from OpenAI API") from exc
