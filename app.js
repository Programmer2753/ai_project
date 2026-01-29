const chat = document.getElementById('chat');
const input = document.getElementById('message');
const sendBtn = document.getElementById('send');

// Если у тебя есть система заметок, добавь их сюда, иначе оставляем пустой массив
let myNotes = []; 

// Функция для эффекта печати
function typeWriter(text, element, speed = 25) {
    let i = 0;
    element.innerHTML = ""; // Очищаем поле "Печатает..."
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
            
            // Прокрутка вниз к последнему символу
            chat.scrollTop = chat.scrollHeight;
        }
    }
    type();
}

// Обработчик кнопки
sendBtn.onclick = async () => {
    const userText = input.value.trim(); // Берем текст из инпута
    if (!userText) return;

    // 1. Добавляем сообщение пользователя
    appendMessage("user", userText);
    input.value = ""; // Очищаем поле ввода

    // 2. Создаем пустой контейнер для ответа ИИ
    const aiMessageElement = appendMessage("ai", "Печатает...");

    try {
        const response = await fetch('/api/ai_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Отправляем текст и наши заметки
            body: JSON.stringify({ message: userText, notes: myNotes })
        });

        if (!response.ok) throw new Error("Ошибка сервера");

        const data = await response.json();
        
        // 3. Запускаем эффект печати для ответа
        typeWriter(data.answer, aiMessageElement);

    } catch (error) {
        aiMessageElement.innerText = "Ошибка связи: " + error.message;
    }
};

// Вспомогательная функция для добавления блоков
function appendMessage(role, text) {
    const msgDiv = document.createElement("div");
    
    // Присваиваем классы 'msg' и либо 'user', либо 'ai' (как в нашем CSS)
    msgDiv.className = `msg ${role}`;
    
    // Создаем внутренний контейнер для текста
    msgDiv.innerHTML = `<span class="text-content">${text}</span>`;
    
    // Добавляем в основной контейнер чата
    chat.appendChild(msgDiv);
    
    // Автопрокрутка к новому сообщению
    chat.scrollTop = chat.scrollHeight;
    
    // Возвращаем элемент, куда будем "печатать"
    return msgDiv.querySelector(".text-content");
}

// Обработка нажатия Enter
input.addEventListener('keydown', (event) => {
    // Проверяем, что нажат именно Enter и НЕ нажат Shift
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Чтобы не было лишнего переноса строки в пустом поле
        sendBtn.click(); // Просто имитируем клик по кнопке "Отправить"
    }
});
