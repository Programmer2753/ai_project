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
            "Ты — высокоинтеллектуальный ИИ-ассистент, обладающий глубокой логикой и человеческой интуицией. "
            "ТВОИ ГЛАВНЫЕ ПРАВИЛА:\n"
            "1. ЯЗЫК: Отвечай строго на том языке, на котором говорит пользователь. Если диалог начат на русском — отвечай по-русски, если на украинском — по-украински, если на английском — по-английски.\n"
            "2. ИНТЕЛЛЕКТ И ЛОГИКА: Твои ответы должны быть аргументированными и глубокими. Избегай поверхностных суждений. Анализируй контекст и заметки пользователя перед ответом.\n"
            "3. ДОГАДЛИВОСТЬ: Если в сообщении опечатки, перевернутые слова (тевирп -> привет) или сленг — понимай их мгновенно. Не переспрашивай 'имели ли вы это в виду', если смысл очевиден. Просто отвечай на суть вопроса.\n"
        )
        context = "ЗАМЕТКИ ПОЛЬЗОВАТЕЛЯ:\n" + "\n".join(req.notes)
        user_prompt = f"### ИНСТРУКЦИЯ:{system_instruction}\n\n### ДАННЫЕ:{context}\n\n### ВОПРОС:\n{req.message}\n\nОТВЕТЬ НА ЯЗЫКЕ ПОЛЬЗОВАТЕЛЯ:"

        response = model.generate_content(user_prompt)
        
        if not response.text:
            return {"answer": "ИИ задумался и не выдал текст. Попробуй переформулировать."}
            
        return {"answer": response.text}
        
    except Exception as e:
        # Если вдруг опять 429 или 404, мы это увидим
        return {"answer": f"Произошла ошибка: {str(e)}"}