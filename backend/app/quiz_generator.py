import os
import json
from typing import Dict, List
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain.schema import HumanMessage

load_dotenv()

class QuizGenerator:
    def __init__(self):
        # Load API key
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")

        # Initialize Groq LLM
        self.llm = ChatGroq(
            api_key=api_key,
            model="llama-3.1-8b-instant",
            temperature=0.3
        )

        # Load prompt template
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompt_quiz.txt")

        with open(PROMPT_PATH, "r", encoding="utf-8") as f:
            self.prompt_template = f.read()

    def _clean_json(self, text: str) -> str:
        """Remove markdown code blocks if present"""
        text = text.strip()
        if text.startswith("```"):
            text = text.replace("```json", "").replace("```", "")
        return text.strip()

    def generate_quiz(self, article_data: Dict) -> List[Dict]:
        """Generate quiz questions using LLM"""
        try:
            prompt = self.prompt_template.format(
                article_content=article_data["article_text"],
                article_title=article_data["title"]
            )

            response = self.llm.invoke([
                HumanMessage(content=prompt)
            ])

            # Get response content (handle both string and object responses)
            if hasattr(response, 'content'):
                response_text = str(response.content)
            else:
                response_text = str(response)
            
            response_text = self._clean_json(response_text)
            
            # Try to extract JSON object from response
            start = response_text.find("{")
            end = response_text.rfind("}") + 1

            if start == -1 or end == 0:
                raise ValueError(f"No JSON object found in LLM response. Response preview: {response_text[:500]}")

            json_str = response_text[start:end]

            quiz_data = json.loads(json_str)

            if "quiz" not in quiz_data:
                raise ValueError(f"LLM response missing 'quiz' key. Response: {response_text[:500]}")

            return quiz_data["quiz"]

        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse quiz JSON: {e}. Response preview: {response_text[:500] if 'response_text' in locals() else 'N/A'}")
        except Exception as e:
            raise Exception(f"Quiz generation failed: {e}")

    def generate_related_topics(self, article_data: Dict) -> List[str]:
        """Generate related Wikipedia topics"""
        try:
            prompt = f"""
Suggest 5-7 related Wikipedia topics for the article "{article_data['title']}".

Article summary:
{article_data['summary']}

Respond with ONLY a valid JSON array, nothing else.
Example:
["Topic 1", "Topic 2", "Topic 3"]
"""

            response = self.llm.invoke([
                HumanMessage(content=prompt)
            ])

            response_text = self._clean_json(response.content)
            topics = json.loads(response_text)

            if not isinstance(topics, list):
                raise ValueError("Invalid related topics format")

            return topics[:7]

        except Exception:
            # Safe fallback
            return ["History", "Science", "Technology"]
