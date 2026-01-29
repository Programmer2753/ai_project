from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os

# Инициализация
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Выбираем стабильную и умную модель из твоего списка
MODEL_NAME = 'models/gemma-3-12b-it'

app = FastAPI()

model = genai.GenerativeModel(
    model_name=MODEL_NAME,
    system_instruction="Ты — продвинутый ИИ-помощник. Твоя задача — анализировать заметки пользователя и давать максимально глубокие, логичные и аргументированные ответы. Перед тем как ответить, проанализируй контекст."
)

class AIRequest(BaseModel):
    message: str
    notes: list[str]

@app.post("/api/ai_chat")
async def ai_chat(req: AIRequest):
    try:
        # Настраиваем "мозги" модели через системную инструкцию
        # Контекст из заметок
        context = "ЗАМЕТКИ ПОЛЬЗОВАТЕЛЯ ДЛЯ АНАЛИЗА:\n" + "\n".join(req.notes)
        user_prompt = f"{context}\n\nВОПРОС: {req.message}"

        response = model.generate_content(user_prompt)
        
        if not response.text:
            return {"answer": "ИИ задумался и не выдал текст. Попробуй переформулировать."}
            
        return {"answer": response.text}
        
    except Exception as e:
        # Если вдруг опять 429 или 404, мы это увидим
        return {"answer": f"Произошла ошибка: {str(e)}"}