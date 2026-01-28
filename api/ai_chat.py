from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI  # Импортируем новый клиент
import os

# Инициализация клиента (автоматически берет ключ из переменных окружения)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

class AIRequest(BaseModel):
    message: str
    notes: list[str]

# Исправили путь на ai_chat (как в JS)
@app.post("/api/ai_chat")
async def ai_chat(req: AIRequest):
    context = "Заметки пользователя:\n"
    for note in req.notes:
        context += f"- {note}\n"

    prompt = f"{context}\nВопрос: {req.message}\nОтветь кратко и по теме."

    # Новый синтаксис OpenAI v1+
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return {
        "answer": response.choices[0].message.content
    }