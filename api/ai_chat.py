import os
from fastapi import FastAPI
from pydantic import BaseModel
import openai
from mangum import Mangum

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

class AIRequest(BaseModel):
    message: str
    notes: list

@app.post("/")
async def ai_chat(req: AIRequest):
    context = "Вот заметки пользователя:\n"
    for note in req.notes:
        context += f"- {note}\n"

    prompt = (
        f"{context}\n"
        f"Вопрос пользователя: {req.message}\n"
        f"Ты ассистент сайта SelfNote. Отвечай ТОЛЬКО по заметкам, "
        f"анализу задач, распорядку дня и продуктивности. "
        f"Кратко, по делу."
    )

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    answer = response.choices[0].message.content
    return {"answer": answer}

handler = Mangum(app)