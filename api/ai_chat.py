from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os

# Инициализация
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Выбираем стабильную и умную модель из твоего списка
MODEL_NAME = 'models/gemma-3-27b-it'

app = FastAPI()

model = genai.GenerativeModel(model_name=MODEL_NAME)

class AIRequest(BaseModel):
    message: str
    notes: list[str]

@app.post("/api/ai_chat")
async def ai_chat(req: AIRequest):
    try:
        # Настраиваем "мозги" модели через системную инструкцию
        # Контекст из заметок
        system_instruction = (
            "Ты — дружелюбный и умный ИИ-ассистент. "
            "Твоя цель — помогать пользователю, основываясь на его заметках. "
            "Отвечай вежливо, развернуто и на русском языке. "
            "Используй форматирование Markdown для списков и жирного текста."
        )
        context = "ВОТ ТВОИ ЗНАНИЯ (ЗАМЕТКИ ПОЛЬЗОВАТЕЛЯ):\n" + "\n".join(req.notes)
        user_prompt = f"{system_instruction}\n\n{context}\n\nВОПРОС: {req.message}"

        response = model.generate_content(user_prompt)
        
        if not response.text:
            return {"answer": "ИИ задумался и не выдал текст. Попробуй переформулировать."}
            
        return {"answer": response.text}
        
    except Exception as e:
        # Если вдруг опять 429 или 404, мы это увидим
        return {"answer": f"Произошла ошибка: {str(e)}"}