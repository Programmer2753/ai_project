const chat = document.getElementById('chat');
const input = document.getElementById('message');
const sendBtn = document.getElementById('send');

let isGenerating = false; // Флаг генерации
let controller; // Для отмены запроса fetch
let stopTypewriter = false; // Для остановки цикла печати

// Иконки (Твой "секси" стиль)
const SEND_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const STOP_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;

// Функция умного скролла
function smartScroll() {
    const threshold = 150; // Расстояние от низа в пикселях
    const isAtBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < threshold;
    
    if (isAtBottom) {
        chat.scrollTop = chat.scrollHeight;
    }
}

// Эффект печати с поддержкой остановки
function typeWriter(text, element, speed = 15) {
    let i = 0;
    let currentText = "";
    stopTypewriter = false; 

    function type() {
        if (stopTypewriter) {
            renderContent(element, currentText + " [Остановлено]");
            finalizeGeneration();
            return;
        }

        if (i < text.length) {
            currentText += text.charAt(i);
            element.innerText = currentText; 
            i++;
            smartScroll(); // Используем умный скролл вместо принудительного
            setTimeout(type, speed);
        } else {
            renderContent(element, currentText);
            finalizeGeneration();
        }
    }
    type();
}

// Завершение процесса генерации
function finalizeGeneration() {
    isGenerating = false;
    sendBtn.innerHTML = SEND_SVG;
    input.focus();
}

// Функция рендеринга (Markdown + Math)
function renderContent(element, text) {
    element.innerHTML = marked.parse(text);
    if (window.renderMathInElement) {
        renderMathInElement(element, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ],
            throwOnError: false
        });
    }
}

// Обработчик кнопки
sendBtn.onclick = async () => {
    // Если уже идет генерация — останавливаем
    if (isGenerating) {
        if (controller) controller.abort(); // Отмена fetch
        stopTypewriter = true; // Остановка анимации текста
        return;
    }

    const userText = input.value.trim();
    if (!userText) return;

    // Включаем режим генерации
    isGenerating = true;
    sendBtn.innerHTML = STOP_SVG;
    controller = new AbortController();

    appendMessage("user", userText);
    
    input.value = "";
    input.style.height = 'auto';
    
    const aiMessageElement = appendMessage("ai", "...");

    try {
        const response = await fetch('/api/ai_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText }),
            signal: controller.signal // Привязываем сигнал отмены
        });

        if (!response.ok) throw new Error("Ошибка сервера");

        const data = await response.json();
        typeWriter(data.answer, aiMessageElement);

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("Запрос отменен пользователем");
        } else {
            aiMessageElement.innerText = "Ошибка: " + error.message;
            finalizeGeneration();
        }
    }
};

// Вспомогательная функция (уже была у тебя)
function appendMessage(role, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${role}`;
    const contentSpan = document.createElement("span");
    contentSpan.className = "text-content";
    contentSpan.innerText = text;
    msgDiv.appendChild(contentSpan);
    chat.appendChild(msgDiv);
    smartScroll(); 
    return contentSpan;
}

// Обработка Enter и авто-высота (добавь к остальным слушателям)
input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});