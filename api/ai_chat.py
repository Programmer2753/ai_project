from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os

# Настройка Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash') # Или gemini-1.5-pro для супер-мозгов

app = FastAPI()

class AIRequest(BaseModel):
    message: str
    notes: list[str]

@app.post("/api/ai_chat")
async def ai_chat(req: AIRequest):
    try:
        # Формируем контекст из заметок
        context = "Заметки пользователя:\n" + "\n".join(req.notes)
        full_prompt = f"{context}\n\nВопрос: {req.message}"
        
        response = model.generate_content(full_prompt)
        
        return {"answer": response.text}
    except Exception as e:
        return {"answer": f"Ошибка Gemini: {str(e)}"}