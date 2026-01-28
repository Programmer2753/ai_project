from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

class AIRequest(BaseModel):
    message: str
    notes: list[str]

# Используем просто "/", так как Vercel уже направил запрос в этот файл
# по адресу /api/ai_chat
@app.post("/api/ai_chat")
async def ai_chat(req: AIRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": req.message}]
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        return {"answer": f"Ошибка на стороне сервера: {str(e)}"}