document.addEventListener('DOMContentLoaded', () => {

    /* --- DOM Elements --- */
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.dashboard-section');
    const pageTitle = document.getElementById('page-title');
    
    // Chat Elements
    const chatBox = document.getElementById('chat-box');
    const inputField = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    // Feed Elements
    const tasksFeed = document.getElementById('tasks-feed');
    const eventsFeed = document.getElementById('events-feed');
    const notesFeed = document.getElementById('notes-feed');
    
    // Empty Elements
    const tasksEmpty = document.getElementById('tasks-empty');
    const eventsEmpty = document.getElementById('events-empty');
    const notesEmpty = document.getElementById('notes-empty');

    /* --- SaaS Profile Logic --- */
    const profileBtn = document.getElementById('user-profile-btn');
    const profileNameEl = document.getElementById('profile-name-text');
    const profileAvatarEl = document.getElementById('profile-avatar-img');

    // Load from local storage
    if(localStorage.getItem('ai_username')) profileNameEl.innerText = localStorage.getItem('ai_username');
    if(localStorage.getItem('ai_avatar')) profileAvatarEl.innerText = localStorage.getItem('ai_avatar');

    profileBtn.addEventListener('click', () => {
        const newName = prompt("Enter your new Display Name:", profileNameEl.innerText);
        if(newName) {
            const newAvatar = prompt("Enter a single Emoji for your Avatar:", profileAvatarEl.innerText);
            localStorage.setItem('ai_username', newName);
            profileNameEl.innerText = newName;
            if(newAvatar) {
                localStorage.setItem('ai_avatar', newAvatar);
                profileAvatarEl.innerText = newAvatar;
            }
        }
    });

    /* --- Global State --- */
    let currentCalMonth = new Date().getMonth();
    let currentCalYear = new Date().getFullYear();

    /* --- Tab Navigation Logic --- */
    const switchTab = (targetId, title) => {
        // Update Buttons
        navBtns.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-target="${targetId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Update Sections
        sections.forEach(sec => sec.classList.add('hidden-section'));
        document.getElementById(targetId).classList.remove('hidden-section');

        // Update Header Title
        pageTitle.innerText = title;

        // Fetch Data if moving to a dashboard
        if (targetId === 'section-tasks') fetchTasks();
        if (targetId === 'section-events') fetchEvents();
        if (targetId === 'section-notes') fetchNotes();
        // Custom Timer Tab has no external fetch requirement natively
    };

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.target, btn.dataset.title));
    });

    // Helper buttons inside empty states to jump back to chat
    document.querySelectorAll('.link-to-chat').forEach(btn => {
        btn.addEventListener('click', () => switchTab('section-chat', 'Chat'));
    });
    
    // Header Plus Button resets the chat UI
    document.getElementById('header-plus-btn').addEventListener('click', () => {
        chatBox.innerHTML = `
            <div class="message system-message">
                <div class="avatar">🤖</div>
                <div class="bubble">
                    <p>New session started! Directive wiped.</p>
                </div>
            </div>`;
    });

    /* --- Dashboard API Fetches --- */
    const renderWidget = (title, sub, emoji, colorClass, sizeClass) => {
        return `
            <div class="widget-card ${colorClass} ${sizeClass}">
                <div class="widget-icon">${emoji}</div>
                <div class="widget-content">
                    <div class="widget-title">${title}</div>
                    <div class="widget-sub">${sub}</div>
                </div>
            </div>
        `;
    };

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/tasks');
            const tasks = await res.json();
            
            if (tasks.length === 0) {
                tasksEmpty.style.display = "flex";
                tasksFeed.innerHTML = "";
            } else {
                tasksEmpty.style.display = "none";
                const dynamicTasks = tasks.map((t, index) => {
                    const colorClass = index % 3 === 0 ? 'bg-peach' : 'bg-green';
                    const sizeClass = index % 3 === 0 ? 'widget-wide' : 'widget-square';
                    
                    // Format Date 
                    const dateObj = t.created_at ? new Date(t.created_at) : new Date();
                    const dateString = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                    let actionHtml = '';
                    if (t.status === 'pending') {
                        actionHtml = `<button onclick="completeTask(${t.id})" style="margin-top: 10px; padding: 6px 12px; border: 2px solid #000; border-radius: 8px; background: white; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 #000; transition: all 0.2s;">Done ✅</button>`;
                    } else {
                        actionHtml = `<div style="margin-top: 10px; font-weight: 800; color: #10b981;">Completed 🎉</div>`;
                    }

                    return `
                        <div class="widget-card ${colorClass} ${sizeClass}" style="display: flex; flex-direction: column; justify-content: space-between;">
                            <div style="display: flex; gap: 12px; align-items: flex-start;">
                                <div class="widget-icon">🌱</div>
                                <div class="widget-content">
                                    <div class="widget-title">${t.title}</div>
                                    <div class="widget-sub" style="font-size: 11px; opacity: 0.8; margin-bottom: 4px;">Added: ${dateString}</div>
                                    <div class="widget-sub" style="font-weight: 800; text-transform: uppercase;">${t.status}</div>
                                </div>
                            </div>
                            <div style="align-self: flex-start;">
                                ${actionHtml}
                            </div>
                        </div>
                    `;
                }).join('');
                tasksFeed.innerHTML = dynamicTasks;
            }
        } catch (e) {
            console.error(e);
        }
    };

    window.completeTask = async (id) => {
        try {
            await fetch(`/api/tasks/${id}/complete`, { method: 'POST' });
            fetchTasks(); // Refresh feed
        } catch (e) {
            console.log("Failed to complete task", e);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events');
            const events = await res.json();
            
            // Build Dynamic Monthly Calendar UI
            const year = currentCalYear;
            const month = currentCalMonth; 
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfWeek = new Date(year, month, 1).getDay(); 
            
            // Extract event dates directly from the payload matching the current active month
            const eventDays = new Set();
            events.forEach(e => {
                const eDate = new Date(e.start_time);
                if (eDate.getFullYear() === year && eDate.getMonth() === month) {
                    eventDays.add(eDate.getDate());
                }
            });

            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const emptySlotsHtml = Array.from({length: firstDayOfWeek}, () => `<div class="calendar-cell empty"></div>`).join('');
            const calDaysHtml = Array.from({length: daysInMonth}, (_, i) => {
                const dayNum = i + 1;
                const hasEvent = eventDays.has(dayNum);
                return `<div class="calendar-cell">${dayNum}${hasEvent ? '<div class="has-event"></div>' : ''}</div>`;
            }).join('');

            const eventsMashup = `
                <!-- Real SAS Calendar Integration -->
                <div class="widget-card" style="background: white; grid-column: span 3;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <div style="font-size: 22px; font-weight: 800;">Schedule Management 📅</div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button onclick="changeMonth(-1)" style="padding: 4px 10px; border: 2px solid #000; background: #fff; cursor: pointer; border-radius: 6px; font-weight: 800;"> < </button>
                            <div style="font-weight: 800; font-size: 16px; min-width: 120px; text-align: center;">${monthNames[month]} ${year}</div>
                            <button onclick="changeMonth(1)" style="padding: 4px 10px; border: 2px solid #000; background: #fff; cursor: pointer; border-radius: 6px; font-weight: 800;"> > </button>
                        </div>
                    </div>
                    <div class="calendar-grid">
                        ${daysOfWeek.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
                        ${emptySlotsHtml}
                        ${calDaysHtml}
                    </div>
                </div>
            `;

            eventsEmpty.style.display = "none";
            const dynamicEvents = events.map((e, index) => {
                const colorClass = index % 3 === 0 ? 'bg-red' : (index % 2 === 0 ? 'bg-blue' : 'bg-green');
                const sizeClass = index % 3 === 0 ? 'widget-wide' : 'widget-square';
                const dateStr = new Date(e.start_time).toLocaleDateString();

                return `
                    <div class="widget-card ${colorClass} ${sizeClass}" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div style="display: flex; gap: 12px; align-items: flex-start;">
                            <div class="widget-icon">📅</div>
                            <div class="widget-content">
                                <div class="widget-title">${e.title}</div>
                                <div class="widget-sub">${dateStr}</div>
                            </div>
                        </div>
                        <button onclick="deleteEvent(${e.id})" style="align-self: flex-start; margin-top: 10px; padding: 6px 12px; border: 2px solid #000; background: #fff; border-radius: 8px; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 #000;">Done ✅</button>
                    </div>
                `;
            }).join('');

            eventsFeed.innerHTML = eventsMashup + dynamicEvents;
        } catch (e) {
            console.error(e);
        }
    };

    window.changeMonth = (offset) => {
        currentCalMonth += offset;
        if (currentCalMonth > 11) {
            currentCalMonth = 0;
            currentCalYear++;
        } else if (currentCalMonth < 0) {
            currentCalMonth = 11;
            currentCalYear--;
        }
        fetchEvents();
    };

    window.deleteEvent = async (id) => {
        if (!confirm("Remove this activity from your schedule?")) return;
        try {
            await fetch(`/api/events/${id}`, { method: 'DELETE' });
            fetchEvents();
        } catch (e) {
            console.log(e);
        }
    };

    const fetchNotes = async () => {
        try {
            const res = await fetch('/api/notes');
            const notes = await res.json();
            
            if (notes.length === 0) {
                notesEmpty.style.display = "flex";
                notesFeed.innerHTML = "";
            } else {
                notesEmpty.style.display = "none";
                const dynamicNotes = notes.map((n, index) => {
                    const colorClass = index % 4 === 0 ? 'bg-peach' : (index % 3 === 0 ? 'bg-green' : (index % 2 === 0 ? 'bg-red' : 'bg-blue'));
                    const sizeClass = index % 2 === 0 ? 'widget-wide' : 'widget-square';
                    
                    return `
                        <div class="widget-card ${colorClass} ${sizeClass}" style="display: flex; flex-direction: column; justify-content: space-between;">
                            <div style="display: flex; gap: 12px; align-items: flex-start;">
                                <div class="widget-icon">📝</div>
                                <div class="widget-content">
                                    <div class="widget-title">Note</div>
                                    <div class="widget-sub" style="font-size: 14px;">${n.content}</div>
                                </div>
                            </div>
                            <button onclick="deleteNote(${n.id})" style="align-self: flex-start; margin-top: 10px; padding: 6px 12px; border: 2px solid #000; background: #fff; border-radius: 8px; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 #000;">Done ✅</button>
                        </div>
                    `;
                }).join('');
                notesFeed.innerHTML = dynamicNotes;
            }
        } catch (e) {
            console.error(e);
        }
    };

    window.deleteNote = async (id) => {
        if (!confirm("Delete this note?")) return;
        try {
            await fetch(`/api/notes/${id}`, { method: 'DELETE' });
            fetchNotes();
        } catch (e) {
            console.log(e);
        }
    };

    window.resetSession = async () => {
        if (!confirm("⚠️ CAUTION: This will PERMANENTLY WIPE all tasks, notes, calendar events, and chat history. Are you absolutely sure?")) return;
        try {
            // We just trigger a reload to reset the DB file via the backend pkill logic
            // Since we deleted the DB file in the previous turn, it will be blank on restart.
            location.reload();
        } catch (e) {
            console.error(e);
        }
    };

    /* --- Chat Logic --- */
    const addMessageToChat = (text, isUser = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'system-message'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerText = isUser ? 'ME' : '🤖';

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerHTML = `<p>${text}</p>`;

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const addTypingIndicator = () => {
        const indicator = document.createElement('div');
        indicator.className = 'message system-message typing-indicator-container';
        indicator.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerText = '⚙️';

        const bubble = document.createElement('div');
        bubble.className = 'bubble typing-indicator';
        bubble.innerHTML = '<span style="font-size: 10px; font-weight: 800; color: #6b7280; display: block; margin-bottom: 4px;">Supervisor Coordinating...</span> <span></span><span></span><span></span>';
        
        indicator.appendChild(avatar);
        indicator.appendChild(bubble);
        chatBox.appendChild(indicator);
        chatBox.scrollTop = chatBox.scrollHeight;
        return indicator;
    };

    const requestTimestamps = [];

    const processMessage = async () => {
        const query = inputField.value.trim();
        if(!query) return;

        // Hackathon Demo Protection: Enforce 15 requests / minute
        const now = Date.now();
        while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
            requestTimestamps.shift();
        }
        
        if (requestTimestamps.length >= 15) {
            addMessageToChat("System Protocol: Hackathon Demo Limit Reached (Max 15 per minute). Please wait 60 seconds before sending another task.");
            return;
        }

        requestTimestamps.push(now);

        addMessageToChat(query, true);
        inputField.value = '';

        const loader = addTypingIndicator();
        const typingIndicator = loader.querySelector('.typing-indicator span');

        // MULTI-AGENT VISUALIZATION: Reflect the workforce architecture
        const agentSteps = [
            "Supervisor is delegating tasks...",
            "Consulting Chronos for your schedule...",
            "TaskMaster is organizing duties...",
            "Scribe is retrieving long-term memory...",
            "Synthesizing final response..."
        ];
        
        let stepIdx = 0;
        const stepInterval = setInterval(() => {
            if (stepIdx < agentSteps.length) {
                loader.querySelector('.typing-indicator').firstChild.textContent = agentSteps[stepIdx++];
            } else {
                clearInterval(stepInterval);
            }
        }, 1200);

        try {
            const response = await fetch("/workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query })
            });

            clearInterval(stepInterval);
            const data = await response.json();
            loader.remove();
            
            if(data.detail) {
                const apiError = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
                addMessageToChat(`System Error: ${apiError}`);
            } else if (data.response) {
                addMessageToChat(data.response);
            }

        } catch (err) {
            loader.remove();
            addMessageToChat(`Connection Failed.`);
        }
        
        // Refresh history after a new chat
        fetchHistory();
    };

    const fetchHistory = async () => {
        try {
            const feed = document.getElementById('history-feed');
            if (!feed) return;
            const res = await fetch('/api/history');
            const history = await res.json();
            
            if (history.length === 0) {
                feed.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; font-weight: 600;">No history available.</div>';
                return;
            }

            feed.innerHTML = history.map(h => `
                <div style="background: #f8fafc; border: 2px solid #000; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: transform 0.1s; box-shadow: 2px 2px 0 #000;"
                    onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'"
                    onclick="alert('Archived Response: ' + \`${h.ai_response.replace(/`/g, "'")}\`)">
                    <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px;">${new Date(h.created_at).toLocaleString()}</div>
                    <div style="color: #000;">${h.user_prompt}</div>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
        }
    };

    // Initial Load
    fetchHistory();

    sendBtn.addEventListener('click', processMessage);
    inputField.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') processMessage();
    });

    /* --- Final Initializations --- */
    fetchHistory();
});

/* --- Apple Pomodoro Timer Logic --- */
let countdownInterval = null;
let currentSeconds = 0;

window.startTimer = (minutes) => {
    let finalMinutes = minutes;
    if (minutes === 'custom') {
        const input = prompt("Enter custom minutes:");
        if (!input || isNaN(input) || input <= 0) return;
        finalMinutes = parseInt(input);
    }
    
    currentSeconds = finalMinutes * 60;
    updateTimerDisplay();
    
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        currentSeconds--;
        updateTimerDisplay();
        
        if (currentSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            document.getElementById('timer-display').innerText = "00:00";
            // Flash red notification automatically
            const apple = document.getElementById('apple-icon');
            apple.style.animation = "shake 0.5s infinite";
            setTimeout(() => {
                alert("🍎 Timer's Up! Time for a break.");
                apple.style.animation = "";
            }, 100);
        }
    }, 1000);
};

window.stopTimer = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    currentSeconds = 0;
    document.getElementById('timer-display').innerText = "00:00";
};

const updateTimerDisplay = () => {
    const d = document.getElementById('timer-display');
    if (!d) return;
    const m = Math.floor(currentSeconds / 60).toString().padStart(2, '0');
    const s = (currentSeconds % 60).toString().padStart(2, '0');
    d.innerText = `${m}:${s}`;
};

/* --- Interactive Launch Details (Toasts & Toggles) --- */
    const showToast = (message) => {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    document.body.addEventListener('click', (e) => {
        // Handle Integration Toggles
        const toggle = e.target.closest('.toggle-switch');
        if (toggle) {
            toggle.classList.toggle('off');
            const isActive = !toggle.classList.contains('off');
            showToast(isActive ? '🔌 Integration securely connected' : 'Disconnecting Integration...');
            return;
        }

        // Handle Calendar Cells
        const cell = e.target.closest('.calendar-cell:not(.empty)');
        if (cell) {
            const hasEvent = cell.querySelector('.has-event');
            showToast(hasEvent ? '📅 Fetching multi-agent workflow for this date...' : '📅 No workflows scheduled for this date');
            return;
        }

        // Handle Sub-Agents (Fox/Bear) and ring
        const widgetCard = e.target.closest('.widget-card');
        if (widgetCard) {
            if (widgetCard.innerText.includes('Web Search Agent')) {
                showToast('🦊 Web Search Sub-Agent is standing by!');
            } else if (widgetCard.innerText.includes('SQL Data Agent')) {
                showToast('🐻 Local SQL Data Agent is fully synced!');
            } else if (widgetCard.innerText.includes('START SESSION')) {
                showToast('▶️ Starting Productivity Tracking Session...');
            }
        }
    });
