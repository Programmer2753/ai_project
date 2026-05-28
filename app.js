const chat = document.getElementById('chat');
const input = document.getElementById('message');
const sendBtn = document.getElementById('send');

let isGenerating = false;
let controller;
let stopTypewriter = false;

const SEND_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const STOP_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
const chatContainer = document.querySelector('.chat');

let chatHistory = [];

function smartScroll() {
    const threshold = 100;
    const distanceToBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
    
    if (distanceToBottom < threshold) {
        chat.scrollTo({
            top: chat.scrollHeight,
            behavior: 'instant'
        });
    }
}

function appendMessage(role, text) {
    const chatContainer = document.querySelector('.chat');
    if (chatContainer && chatContainer.classList.contains('is-empty')) {
        chatContainer.classList.remove('is-empty');
    }

    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${role}`;
    
    const contentDiv = document.createElement("div"); 
    contentDiv.className = "text-content";
    contentDiv.innerHTML = text; 
    
    msgDiv.appendChild(contentDiv);
    chat.appendChild(msgDiv);

    setTimeout(() => {
        chat.scrollTop = chat.scrollHeight;
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 10);
    
    return contentDiv;
}

let typingTimeoutId = null;

function typeWriter(text, element, speed = 15) {
    let i = 0;
    element.innerHTML = "";

    if (typingTimeoutId) clearTimeout(typingTimeoutId);

    function type() {
        if (stopTypewriter) {
            element.innerHTML += " [Stopped]";
            finalize();
            return;
        }

        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            smartScroll();
            typingTimeoutId = setTimeout(type, speed);
        } else {
            renderContent(element, text);
            finalize();
        }
    }
    type();
}

function finalize() {
    isGenerating = false;
    stopTypewriter = false;
    sendBtn.innerHTML = SEND_SVG;
    sendBtn.disabled = false;
    sendBtn.style.backgroundColor = "#007bff"; 
}

sendBtn.onclick = async () => {
    if (isGenerating) {
        if (controller) controller.abort();
        stopTypewriter = true;
        finalize(); 
        return;
    }

    const userText = input.value.trim();
    if (!userText) return;

    chatHistory.push({ role: "user", content: userText });
    if (chatHistory.length > 10) chatHistory.shift();

    isGenerating = true;
    sendBtn.innerHTML = STOP_SVG;
    sendBtn.style.backgroundColor = "#ff4d4d"; 
    
    controller = new AbortController();
    appendMessage("user", userText);
    input.value = "";
    input.style.height = '45px';

    const aiMessageElement = appendMessage("ai", '<div class="typing-indicator" id="current-loader"><span></span><span></span><span></span><span class="thinking-text" id="thinking-status">Cadoff AI thinking...</span></div>');

    let statusInterval; 
    const statuses = ["Analyzing prompt...", "Looking for logical connections...", "Generating a reply..."];
    let statusIdx = 0;

    statusInterval = setInterval(() => {
        const statusEl = document.getElementById('thinking-status');
        if (statusEl) {
            statusEl.innerText = statuses[statusIdx % statuses.length];
            statusIdx++;
        }
    }, 2000);

    try {
        const response = await fetch('/api/ai_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userText, 
                notes: myNotes, 
                history: chatHistory 
            }),
            signal: controller.signal
        });

        if (!response.ok) throw new Error("Server error");

        const data = await response.json();

        clearInterval(statusInterval);
        aiMessageElement.innerHTML = ""; 

        if (!stopTypewriter) {
            chatHistory.push({ role: "model", content: data.answer });
            typeWriter(data.answer.trim(), aiMessageElement);
        }

    } catch (error) {
        clearInterval(statusInterval);
        if (error.name === 'AbortError') {
            aiMessageElement.innerText = "Generation stopped.";
        } else {
            aiMessageElement.innerText = "Error: " + error.message;
        }
    } finally {
        clearInterval(statusInterval);
        finalize();
    }
};

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
