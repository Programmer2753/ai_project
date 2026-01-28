from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os

# Настройка ключа
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Выбираем модель Pro для высокого качества ответов
# (Можно попробовать 'gemini-1.5-pro-latest' для самой свежей версии)
model = genai.GenerativeModel('gemini-1.5-pro')

app = FastAPI()

class AIRequest(BaseModel):
    message: str
    notes: list[str]

@app.post("/api/ai_chat")
async def ai_chat(req: AIRequest):
    try:
        # Формируем промпт так, чтобы ИИ использовал твои заметки
        context = "Твои знания (заметки пользователя):\n" + "\n".join(req.notes)
        full_prompt = f"{context}\n\nВопрос пользователя: {req.message}\nОтвечай вдумчиво и подробно."

        response = model.generate_content(full_prompt)
        
        return {"answer": response.text}
    except Exception as e:
        # Если Pro-модель вдруг выдаст 404 (зависит от региона/ключа), 
        # здесь мы увидим конкретную причину.
        return {"answer": f"Ошибка (модель Pro): {str(e)}"}