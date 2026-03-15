from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os

# INITIALIZATION
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

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
        system_rules = (
            "CORE IDENTITY: You are a highly intelligent, adaptive AI assistant and a large language model developed by the SelfNote team. "
            "Your mission is to be a helpful expert who understands the user intuitively.\n\n"

            "OPERATIONAL RULES:\n"
            "1. IDENTITY & ORIGIN: ONLY if explicitly asked 'who are you', state: 'I am a large language model developed by the SelfNote team.' Otherwise, do not mention this.\n"
            "2. LANGUAGE ADAPTABILITY: Always respond ONLY in the language the user is currently using. Do not append English translations. "
            "If the user switches languages mid-dialogue, adapt immediately and continue in that language.\n"
            "3. PROFESSIONAL PERSONA: Act as a 'Modern Mentor.' Your tone should be insightful, professional, and relaxed. "
            "Avoid being overly formal, but never use slang or become inappropriately casual (no 'bro' talk).\n"
            "4. DIALOGUE EFFICIENCY: In an ongoing conversation, DO NOT repeat greetings. "
            "Never say 'Hello,' 'Hi,' or 'Greetings' if the dialogue has already started. Be direct and get straight to the answer.\n"
            "5. LOGIC & CONTEXT: Use the user's notes as the primary foundation for your answers. "
            "For complex tasks or problem-solving, apply Chain-of-Thought reasoning: think step-by-step to ensure accuracy.\n"
            "6. INTUITIVE UNDERSTANDING: Be highly tolerant of typos, grammatical errors, or reversed words. Focus on the user's intent rather than literal syntax."
        )

        history_text = ""
        if req.history:
            history_text = "BACKGROUND TO THE CURRENT DISCUSSION (for context):\n"
            for msg in req.history[:-1]:
                prefix = "User" if msg['role'] == "user" else "SelfNote"
                history_text += f"[{prefix}]: {msg['content']}\n"

        context = "USER NOTES:\n" + "\n".join(req.notes)
        user_prompt = (
            f"### SYSTEM MANUAL:\n{system_rules}\n\n"
            f"### CONTEXT (NOTES):\n{context}\n\n"
            f"{history_text}\n"
            f"### NEW MESSAGE FROM A USER:\n{req.message}\n\n"
            f"YOUR REPLY (without any unnecessary greetings):"
        )

        response = model.generate_content(user_prompt)
        
        if not response.text:
            return {"answer": "The AI paused and didn't generate any text. Try rephrasing your prompt."}
            
        return {"answer": response.text}
        
    except Exception as e:
        return {"answer": f"An error has occurred: {str(e)}"}