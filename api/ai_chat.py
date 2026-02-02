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
    history: list[dict]

@app.post("/api/ai_chat")
async def ai_chat(req: AIRequest):
    try:
        # Настраиваем "мозги" модели через системную инструкцию
        # Контекст из заметок
        system_rules = (
            "Ты — высокоинтеллектуальный адаптивный напарник, большая языковая модель, разработанная командой SelfNote. "
            "Твоя цель — быть полезным экспертом, который понимает пользователя с полуслова.\n\n"
            "ТВОИ ЖЕСТКИЕ ПРАВИЛА:\n"
            "1. ИДЕНТИЧНОСТЬ: На вопросы о твоем происхождении отвечай: 'Я — большая языковая модель, разработанная командой SelfNote'.\n"
            "2. ЯЗЫК: Отвечай на языке пользователя.\n"
            "3. ПРОФЕССИОНАЛЬНАЯ АДАПТИВНОСТЬ: Подстраивайся под тон, но не копируй сленг буквально. "
            "Будь как современный ментор: расслабленный, но профи. Избегай панибратства.\n"
            "4. ДИНАМИКА ДИАЛОГА: Если диалог уже идет, НЕ НУЖНО здороваться в каждом сообщении. "
            "Не пиши 'Привет', 'Здравствуйте' или 'Йоу', если вы уже общаетесь. Просто отвечай на вопрос.\n" # <-- ВОТ ЭТО ВАЖНО
            "5. ГЛУБИНА: Используй заметки пользователя как фундамент. В задачах рассуждай пошагово.\n"
            "6. ИНТУИЦИЯ: Игнорируй опечатки и понимай перевернутые слова мгновенно."
        )

        history_text = ""
        if req.history:
            history_text = "ИСТОРИЯ ТЕКУЩЕГО ДИАЛОГА (для контекста):\n"
            for msg in req.history[:-1]:
                prefix = "Пользователь" if msg['role'] == "user" else "SelfNote"
                history_text += f"[{prefix}]: {msg['content']}\n"

        # В user_prompt добавим еще один акцент для модели
        context = "ЗАМЕТКИ ПОЛЬЗОВАТЕЛЯ:\n" + "\n".join(req.notes)
        user_prompt = (
            f"### ИНСТРУКЦИЯ СИСТЕМЫ:\n{system_rules}\n\n"
            f"### КОНТЕКСТ (ЗАМЕТКИ):\n{context}\n\n"
            f"{history_text}\n" # История теперь четко отделена
            f"### НОВОЕ СООБЩЕНИЕ ОТ ПОЛЬЗОВАТЕЛЯ:\n{req.message}\n\n"
            f"ТВОЙ ОТВЕТ (без лишних приветствий):"
        )

        response = model.generate_content(user_prompt)
        
        if not response.text:
            return {"answer": "ИИ задумался и не выдал текст. Попробуй переформулировать."}
            
        return {"answer": response.text}
        
    except Exception as e:
        # Если вдруг опять 429 или 404, мы это увидим
        return {"answer": f"Произошла ошибка: {str(e)}"}