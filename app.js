const chat = document.getElementById('chat');
const input = document.getElementById('message');
const sendBtn = document.getElementById('send');

// Функция для эффекта печати
function typeWriter(text, element, speed = 25) {
    let i = 0;
    element.innerHTML = ""; // Очищаем поле перед началом
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
            
            // Автопрокрутка вниз, чтобы видеть новые буквы
            window.scrollTo(0, document.body.scrollHeight);
        }
    }
    type();
}

// Твой основной обработчик кнопки (примерная интеграция)
sendBtn.onclick = async () => {
    const message = userInput.value;
    if (!message) return;

    // 1. Добавляем сообщение пользователя в чат сразу
    appendMessage("Вы", message);
    userInput.value = "";

    // 2. Создаем пустой контейнер для ответа ИИ
    const aiMessageElement = appendMessage("ИИ", "Печатает...");

    try {
        const response = await fetch('/api/ai_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, notes: myNotes })
        });

        const data = await response.json();
        
        // 3. Вместо простого вывода запускаем эффект печати
        typeWriter(data.answer, aiMessageElement);

    } catch (error) {
        aiMessageElement.innerText = "Ошибка связи: " + error.message;
    }
};

// Вспомогательная функция для добавления блоков сообщений
function appendMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = sender === "Вы" ? "user-msg" : "ai-msg";
    msgDiv.innerHTML = `<strong>${sender}:</strong> <span class="text-content">${text}</span>`;
    chatBox.appendChild(msgDiv);
    
    // Возвращаем элемент, куда будем "печатать" текст
    return msgDiv.querySelector(".text-content");
}