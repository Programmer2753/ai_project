from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os

# Инициализация
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Указываем полный путь к модели. Для качества берем 1.5 Pro.
# Если gemini-1.5-pro не сработает, попробуй gemini-1.5-pro-002 (самая стабильная)
MODEL_NAME = 'models/gemini-1.5-pro' 

app = FastAPI()

class AIRequest(BaseModel):
    message: str
    notes: list[str]

@app.post("/api/ai_chat")
async def ai_chat(req: AIRequest):
    try:
        # Создаем модель внутри функции для чистоты запроса
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        
        # Контекст из заметок
        context = "Заметки пользователя:\n" + "\n".join(req.notes)
        full_prompt = f"{context}\n\nВопрос: {req.message}\nОтвечай вдумчиво."

        # Вызываем генерацию
        response = model.generate_content(full_prompt)
        
        if not response.text:
            return {"answer": "ИИ вернул пустой ответ. Возможно, запрос заблокирован фильтрами безопасности."}
            
        return {"answer": response.text}
    except Exception as e:
        # Если снова 404, выведем список доступных моделей прямо в чат!
        try:
            available_models = [m.name for m in genai.list_models()]
            return {"answer": f"Ошибка: {str(e)}. Доступные тебе модели: {', '.join(available_models)}"}
        except:
            return {"answer": f"Критическая ошибка: {str(e)}"}