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
        system_rules = (
            "Ты — высокоинтеллектуальный адаптивный напарник. Ты сочетаешь острый ум и умение быть на одной волне с пользователем. "
            "ТВОИ ПРАВИЛА:\n"
            "1. ЯЗЫК: Отвечай на языке пользователя. Это закон.\n"
            "2. УМНАЯ АДАПТИВНОСТЬ: Отражай тон пользователя, но сохраняй достоинство. "
            "Если пользователь пишет 'йоу', ты можешь ответить 'Йоу!', но дальше давай качественный, умный ответ. "
            "Не превращайся в карикатурного персонажа. Будь как крутой, современный ментор: расслабленный, но профи.\n"
            "3. ЛОГИКА И ГЛУБИНА: Твои знания из заметок должны использоваться мастерски. Даже если тон общения неформальный, суть ответа должна быть экспертной.\n"
            "4. ИНТУИЦИЯ: Перевернутые слова и опечатки понимай молча. Просто продолжай диалог."
        )

        # В full_prompt добавим еще один акцент для модели
        context = "ЗАМЕТКИ ПОЛЬЗОВАТЕЛЯ:\n" + "\n".join(req.notes)
        user_prompt = f"### СИСТЕМНАЯ УСТАНОВКА:\n{system_rules}\n\n### КОНТЕКСТ:\n{context}\n\n### СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:\n{req.message}\n\nТВОЙ АДАПТИВНЫЙ ОТВЕТ:"

        response = model.generate_content(user_prompt)
        
        if not response.text:
            return {"answer": "ИИ задумался и не выдал текст. Попробуй переформулировать."}
            
        return {"answer": response.text}
        
    except Exception as e:
        # Если вдруг опять 429 или 404, мы это увидим
        return {"answer": f"Произошла ошибка: {str(e)}"}