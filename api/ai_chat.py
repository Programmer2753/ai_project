from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI # Groq использует тот же стандарт, что и OpenAI!
import os

# Подключаемся к Groq
client = OpenAI(
    base_url="https://api.groq.com/openai/v1", # Магия здесь
    api_key=os.getenv("OPENAI_API_KEY") # Сюда вставь ключ от Groq в Vercel
)

app = FastAPI()

class AIRequest(BaseModel):
    message: str
    notes: list[str]

@app.post("/api/ai_chat")
async def ai_chat(req: AIRequest):
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile", # Мощная бесплатная модель
            messages=[{"role": "user", "content": req.message}]
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        return {"answer": f"Ошибка: {str(e)}"}