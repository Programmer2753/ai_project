const chat = document.getElementById('chat');
const input = document.getElementById('message');
const sendBtn = document.getElementById('send');

// Если у тебя есть система заметок, добавь их сюда, иначе оставляем пустой массив
let myNotes = []; 

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

// 1. Автоматическое расширение textarea
input.addEventListener('input', function() {
    this.style.height = 'auto'; // Сбрасываем высоту
    this.style.height = (this.scrollHeight) + 'px'; // Ставим высоту по контенту
});

// 2. Улучшенная функция appendMessage для поддержки Markdown
function appendMessage(role, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${role}`;
    
    // Создаем контейнер для контента
    const contentSpan = document.createElement("span");
    contentSpan.className = "text-content";
    
    // Если это АИ, мы будем рендерить Markdown (позже)
    // А пока просто вставляем текст
    contentSpan.innerText = text;
    
    msgDiv.appendChild(contentSpan);
    chat.appendChild(msgDiv);
    chat.scrollTop = chat.scrollHeight;
    
    return contentSpan;
}

// 3. Обновляем typeWriter, чтобы она понимала разметку после печати
function typeWriter(text, element, speed = 15) {
    let i = 0;
    let currentText = "";
    
    function type() {
        if (i < text.length) {
            currentText += text.charAt(i);
            // Пока печатаем — выводим как текст, чтобы было быстро
            element.innerText = currentText; 
            i++;
            setTimeout(type, speed);
            chat.scrollTop = chat.scrollHeight;
        } else {
            // КОГДА ЗАКОНЧИЛ ПЕЧАТАТЬ: превращаем текст в красивый Markdown
            // Используем библиотеку marked для рендеринга
            element.innerHTML = marked.parse(currentText);
            
            // Если там есть формулы (опционально можно добавить рендер KaTeX здесь)
            // Но даже просто Markdown сделает жирный текст и заголовки человечными.
        }
    }
    type();
}

// Обработка нажатия Enter
input.addEventListener('keydown', (event) => {
    // Проверяем, что нажат именно Enter и НЕ нажат Shift
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Чтобы не было лишнего переноса строки в пустом поле
        sendBtn.click(); // Просто имитируем клик по кнопке "Отправить"
    }
});
