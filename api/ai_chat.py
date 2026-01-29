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
            "Ты — проницательный и лаконичный ИИ-ассистент, обладающий интуицией Gemini. "
            "ТВОИ ПРАВИЛА:\n"
            "1. БУДЬ ДОГАДЛИВЫМ: Если пользователь пишет странное или перевернутое слово (например, 'тевирп'), "
            "сначала проверь, не является ли это простым 'привет' или опечаткой. Не выдумывай сложные значения, если есть простое объяснение.\n"
            "2. БУДЬ КРАТКИМ: Не пиши огромные лекции, если тебя об этом не просили. Отвечай в стиле живого общения.\n"
            "3. БЕЗ ЗАНУДСТВА: Не читай нотации о вежливости и не анализируй коннотации слов, если вопрос был простым.\n"
            "4. КОНТЕКСТ: Твои знания ограничены заметками пользователя. Используй их естественно.\n"
            "5. СТИЛЬ: Твой стиль — современный, дружелюбный и человечный."
        )
        context = "ЗАМЕТКИ ПОЛЬЗОВАТЕЛЯ:\n" + "\n".join(req.notes)
        user_prompt = f"### ИНСТРУКЦИЯ СИСТЕМЫ:{system_instruction}\n\n### ДАННЫЕ:{context}\n\n### ВОПРОС:\n{req.message}"

        response = model.generate_content(user_prompt)
        
        if not response.text:
            return {"answer": "ИИ задумался и не выдал текст. Попробуй переформулировать."}
            
        return {"answer": response.text}
        
    except Exception as e:
        # Если вдруг опять 429 или 404, мы это увидим
        return {"answer": f"Произошла ошибка: {str(e)}"}