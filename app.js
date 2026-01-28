const chat = document.getElementById('chat');
const input = document.getElementById('message');
const sendBtn = document.getElementById('send');

function addMessage(text, cls) {
  const div = document.createElement('div');
  // ОШИБКА БЫЛА ЗДЕСЬ: div.className = msg ${cls};
  // ИСПРАВЛЕНИЕ (добавили обратные кавычки ` `):
  div.className = `msg ${cls}`; 
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ... остальной код без изменений ...
// Убедись, что fetch делает запрос именно на '/api/ai_chat', как мы исправили в Python.

sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';

  const res = await fetch('/api/ai_chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: text,
      notes: []
    })
  });

  const data = await res.json();
  addMessage(data.answer, 'ai');
};