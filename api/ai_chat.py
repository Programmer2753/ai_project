from fastapi import FastAPI
from pydantic import BaseModel
import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

class AIRequest(BaseModel):
    message: str
    notes: list[str]

@app.post("/api/ai-chat")
async def ai_chat(req: AIRequest):
    context = "Заметки пользователя:\n"
    for note in req.notes:
        context += f"- {note}\n"

    prompt = f"{context}\nВопрос: {req.message}\nОтветь кратко и по теме."

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return {
        "answer": response.choices[0].message.content
    }