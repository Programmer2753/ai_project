const chat = document.getElementById('chat');
const input = document.getElementById('message');
const sendBtn = document.getElementById('send');

let myNotes = []; // Твои заметки
let isGenerating = false;
let controller; // Для отмены запроса
let stopTypewriter = false;

// Иконки
const SEND_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const STOP_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
const chatContainer = document.querySelector('.chat');

let chatHistory = [];

// Исправленный умный скролл
function smartScroll() {
    const threshold = 100; // Чувствительность
    // Если разница между высотой контента и текущим скроллом невелика — скроллим
    const distanceToBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
    
    if (distanceToBottom < threshold) {
        chat.scrollTo({
            top: chat.scrollHeight,
            behavior: 'instant' // Для печати лучше instant, чтобы не дергалось
        });
    }
}

function appendMessage(role, text) {
    // Если это самое первое сообщение в сессии
    if (chatContainer.classList.contains('is-empty')) {
        chatContainer.classList.remove('is-empty');
    }

    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${role}`;
    const contentSpan = document.createElement("span");
    contentSpan.className = "text-content";
    contentSpan.innerText = text;
    msgDiv.appendChild(contentSpan);
    chat.appendChild(msgDiv);
    
    // Скроллим только после того, как DOM обновился
    setTimeout(() => {
        chat.scrollTop = chat.scrollHeight;
    }, 10);
    
    return contentSpan;
}

let typingTimeoutId = null; // Храним ID таймера, чтобы убить его жестко

function typeWriter(text, element, speed = 15) {
    let i = 0;
    element.innerHTML = ""; // Гарантированная очистка
    
    // Если была предыдущая печать — убиваем её насмерть
    if (typingTimeoutId) clearTimeout(typingTimeoutId);

    function type() {
        // Если вдруг мы решили остановить печать извне
        if (stopTypewriter) {
            element.innerHTML += " [Остановлено]";
            finalize();
            return;
        }

        if (i < text.length) {
            element.innerHTML += text.charAt(i); // Используем innerHTML для корректной работы
            i++;
            smartScroll();
            // Сохраняем ID таймера
            typingTimeoutId = setTimeout(type, speed);
        } else {
            renderContent(element, text); // Рендерим Markdown в конце
            finalize();
        }
    }
    type();
}

// ... (функции smartScroll и appendMessage остаются без изменений) ...

function finalize() {
    isGenerating = false;
    stopTypewriter = false;
    sendBtn.innerHTML = SEND_SVG;
    sendBtn.disabled = false; // На всякий случай включаем кнопку обратно
    // Убеждаемся, что цвет фона тоже вернулся
    sendBtn.style.backgroundColor = "#007bff"; 
}

sendBtn.onclick = async () => {
    if (isGenerating) {
        if (controller) controller.abort();
        stopTypewriter = true;
        finalize(); // МГНОВЕННО возвращаем кнопку в рабочее состояние
        return;
    }

    const userText = input.value.trim();

    chatHistory.push({ role: "user", content: userText });

    // Ограничиваем историю (например, последние 10 сообщений), чтобы не перегружать ИИ
    if (chatHistory.length > 10) chatHistory.shift();

    if (!userText) return;

    isGenerating = true;
    sendBtn.innerHTML = STOP_SVG;
    sendBtn.style.backgroundColor = "#ff4d4d"; // Красный цвет во время генерации
    
    controller = new AbortController();
    appendMessage("user", userText);
    input.value = "";
    input.style.height = 'auto';
    
    const aiMessageElement = appendMessage("ai", "Печатает...");

    try {
        const response = await fetch('/api/ai_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText, notes: myNotes, history: chatHistory }),
            signal: controller.signal
        });

        if (!response.ok) throw new Error("Ошибка сервера");

        const data = await response.json();
        
        // Если пока сервер отвечал, мы не нажали "Стоп"
        if (!stopTypewriter) {
            chatHistory.push({ role: "model", content: data.answer });
            typeWriter(data.answer, aiMessageElement);
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            aiMessageElement.innerText = "Генерация остановлена.";
        } else {
            aiMessageElement.innerText = "Ошибка: " + error.message;
        }

    } finally {
        finalize();
    }
};

// --- СЛУШАТЕЛИ СОБЫТИЙ ---

input.addEventListener('input', function() {
    this.style.height = 'auto';
    const newHeight = Math.min(this.scrollHeight, 150);
    this.style.height = newHeight + 'px';

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
    });
});

input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendBtn.click();
    }
});

function renderContent(element, text) {
    element.innerHTML = marked.parse(text);
    renderMathInElement(element, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
        ],
        throwOnError: false
    });
}
