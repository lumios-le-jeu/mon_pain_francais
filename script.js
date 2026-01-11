// Data is now loaded globally via data.js in index.html

// State
let currentStepIndex = 0;
let userTargetWeight = 1700;
let timersState = {};
let intervalId = null;
let remainingTime = null;
let timerendTime = null; // Timestamp for timer persistence

// DOM Elements
const stepContainer = document.getElementById('step-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const weightInput = document.getElementById('bread-weight');
const progressDotsContainer = document.getElementById('progress-dots');

// Constants
const BASE_WEIGHT = recipeData.baseWeight;

// Initialization
function init() {
    // Setup listeners
    weightInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        if (val && val > 0) {
            userTargetWeight = val;
            saveState(); // Save on change
            renderCurrentStep();
        }
    });

    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    // Restore state from local storage
    loadState();

    // Initial render
    createProgressDots();
    renderCurrentStep();
    updateProgressDots(); // Ensure dots reflect loaded state
}

function saveState() {
    const state = {
        step: currentStepIndex,
        weight: userTargetWeight,
        timerEndTime: timerendTime // Save absolute timestamp
    };
    try {
        localStorage.setItem('breadAppState', JSON.stringify(state));
    } catch (e) {
        console.warn("Storage failed (Private Mode?):", e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('breadAppState');
        if (saved) {
            const state = JSON.parse(saved);
            currentStepIndex = state.step || 0;
            userTargetWeight = state.weight || 1700;
            if (weightInput) weightInput.value = userTargetWeight;

            // Timer Recovery
            if (state.timerEndTime) {
                const now = Date.now();
                const left = Math.ceil((state.timerEndTime - now) / 1000);

                if (left > 0) {
                    timerendTime = state.timerEndTime;
                    remainingTime = left;
                } else {
                    timerendTime = null;
                    remainingTime = 0; // Finished while away
                }
            }
        }
    } catch (e) {
        console.warn("Load state failed:", e);
    }
}

function resetApp() {
    if (confirm("Voulez-vous vraiment tout remettre à zéro ?")) {
        localStorage.removeItem('breadAppState');
        stopAlarm();
        location.reload();
    }
}

function createProgressDots() {
    progressDotsContainer.innerHTML = '';
    recipeData.steps.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (index === currentStepIndex) dot.classList.add('active');
        progressDotsContainer.appendChild(dot);
    });
}

function updateProgressDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.className = 'dot';
        dot.classList.remove('active', 'passed');
        if (index < currentStepIndex) dot.classList.add('passed');
        if (index === currentStepIndex) dot.classList.add('active');
    });
}

function navigate(direction) {
    // Always reset timer state when navigating
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    // Ensure audio/alarm are stopped
    toggleSilentKeeper(false);
    stopAlarm();

    timerendTime = null;
    remainingTime = null;
    saveState();

    const newIndex = currentStepIndex + direction;
    if (newIndex >= 0 && newIndex < recipeData.steps.length) {
        currentStepIndex = newIndex;
        currentImageIndex = 0; // Reset image carousel
        saveState();
        renderCurrentStep();
        updateProgressDots();
    }
}

function calculateAmount(baseAmount) {
    // Scaling formula: (Target / Base) * IngredientAmount
    const ratio = userTargetWeight / BASE_WEIGHT;
    return Math.round(baseAmount * ratio);
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Helper to manage carousel state locally in DOM or global? 
// Simple global or per-render var is easiest since we re-render on step change.
let currentImageIndex = 0;
// Reset when step changes.
// We need to hook into navigate() to reset this.

function nextImage(max) {
    currentImageIndex++;
    if (currentImageIndex >= max) currentImageIndex = 0;
    renderCurrentStep(); // Simple re-render to update view
}

function prevImage(max) {
    currentImageIndex--;
    if (currentImageIndex < 0) currentImageIndex = max - 1;
    renderCurrentStep();
}

function renderCurrentStep() {
    const step = getStepData(currentStepIndex); // Use dynamic getter

    // Update Buttons
    prevBtn.disabled = currentStepIndex === 0;
    nextBtn.disabled = currentStepIndex === recipeData.steps.length - 1;
    nextBtn.textContent = (currentStepIndex === recipeData.steps.length - 1) ? "Terminé" : "Suivant";

    // Clear Container
    stepContainer.innerHTML = '';

    // Card
    const card = document.createElement('div');
    card.className = 'step-card';

    // Images Display
    let images = [];
    if (step.images && step.images.length > 0) {
        images = step.images;
    } else if (step.image) {
        images = [step.image];
    }

    // Safety check for index
    if (currentImageIndex >= images.length) currentImageIndex = 0;
    if (images.length > 0 && currentImageIndex < 0) currentImageIndex = 0;

    // Image Container with Carousel
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'step-image-container';

    // If Admin, add upload button overlay or below? 
    // User wants "Displayed large".
    // Let's put the Admin Upload button below text or top right absolute.
    // Let's keep it simple: Add button via text link or overlay.

    if (images.length === 0) {
        imgWrapper.innerHTML = `
            <div class="image-placeholder">
                <div>📷</div>
                <span>Pas de photo</span>
            </div>
        `;
    } else {
        const carousel = document.createElement('div');
        carousel.className = 'carousel-container';

        // Single Active Image
        const src = images[currentImageIndex];
        const slide = document.createElement('div');
        slide.className = 'carousel-slide active';
        slide.innerHTML = `
            <img src="${src}" onerror="this.parentElement.innerHTML = '<div class=\'image-placeholder\'><span>Image non disponible</span></div>'" />
        `;
        carousel.appendChild(slide);

        // Navigation
        if (images.length > 1) {
            const prev = document.createElement('button');
            prev.className = 'carousel-nav carousel-prev';
            prev.innerHTML = '‹';
            prev.onclick = () => prevImage(images.length);

            const next = document.createElement('button');
            next.className = 'carousel-nav carousel-next';
            next.innerHTML = '›';
            next.onclick = () => nextImage(images.length);

            carousel.appendChild(prev);
            carousel.appendChild(next);

            // Dots
            const dots = document.createElement('div');
            dots.className = 'carousel-dots';
            images.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.className = `c-dot ${idx === currentImageIndex ? 'active' : ''}`;
                // dot.onclick = () => { currentImageIndex = idx; renderCurrentStep(); };
                dots.appendChild(dot);
            });
            carousel.appendChild(dots);
        }

        imgWrapper.appendChild(carousel);
    }
    card.appendChild(imgWrapper);

    // Admin Upload Control & Thumbnails
    if (isAdmin) {
        const adminControls = document.createElement('div');
        adminControls.className = 'admin-controls';
        adminControls.style.marginTop = '0';
        adminControls.style.borderTopLeftRadius = '0';
        adminControls.style.borderTopRightRadius = '0';

        let thumbsHTML = '';
        if (images.length > 0) {
            thumbsHTML = `<div class="admin-thumbs" style="display:flex; gap:5px; overflow-x:auto; margin-top:10px; padding-bottom:5px;">`;
            images.forEach((img, idx) => {
                thumbsHTML += `
                    <div style="position:relative; width:50px; height:50px; flex:0 0 50px; border:${idx === currentImageIndex ? '2px solid var(--primary-color)' : '1px solid #555'}; border-radius:4px; overflow:hidden;">
                        <img src="${img}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="currentImageIndex=${idx}; renderCurrentStep();">
                        <button style="position:absolute; top:0; right:0; background:red; color:white; border:none; width:15px; height:15px; font-size:10px; cursor:pointer;" onclick="event.stopPropagation(); removeStepImage(${currentStepIndex}, ${idx})">×</button>
                    </div>
                 `;
            });
            thumbsHTML += `</div>`;
        }

        adminControls.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.8rem; opacity:0.7;">Photo ${currentImageIndex + 1}/${Math.max(1, images.length)}</span>
                <label class="upload-btn" style="font-size:0.8rem; padding:4px 8px;">
                    + Ajouter une photo
                    <input type="file" style="display:none" onchange="handleFileUpload(this.files[0])">
                </label>
            </div>
            ${thumbsHTML}
         `;
        card.appendChild(adminControls);
    }

    // Content Content
    const content = document.createElement('div');
    content.className = 'step-content';

    // Title
    const title = document.createElement('h2');
    title.className = 'step-title editable-field';
    title.textContent = step.title;
    if (isAdmin) {
        title.contentEditable = true;
        title.onblur = (e) => saveCustomStep(currentStepIndex, 'title', e.target.innerText);
    }
    content.appendChild(title);

    // Ingredients
    if (step.ingredients && step.ingredients.length > 0) {
        const ingBox = document.createElement('div');
        ingBox.className = 'ingredients-box';
        const h4 = document.createElement('h4');
        h4.textContent = `Ingrédients (pour ${userTargetWeight}g)`;
        ingBox.appendChild(h4);

        step.ingredients.forEach(ing => {
            const row = document.createElement('div');
            row.className = 'ingredient-row';
            const scaledAmount = calculateAmount(ing.amount);
            row.innerHTML = `<span>${ing.name}</span> <span>${scaledAmount} ${ing.unit}</span>`;
            ingBox.appendChild(row);
        });
        content.appendChild(ingBox);
    }

    // Instructions
    // Handling array of instructions is hard with contentEditable.
    // Admin Mode: View as individual editable paragraphs.
    const ul = document.createElement('ul');
    ul.className = 'instructions';
    step.instructions.forEach((text, i) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.className = 'editable-field';
        span.textContent = text;
        if (isAdmin) {
            span.contentEditable = true;
            span.onblur = (e) => {
                // Update specific instruction line
                if (!customRecipeData) customRecipeData = JSON.parse(JSON.stringify(recipeData));
                customRecipeData.steps[currentStepIndex].instructions[i] = e.target.innerText;
                localStorage.setItem('breadAppCustomData', JSON.stringify(customRecipeData));
            };
        }
        li.appendChild(span);
        ul.appendChild(li);
    });
    content.appendChild(ul);

    // Add instruction button for admin?
    if (isAdmin) {
        const addInstBtn = document.createElement('button');
        addInstBtn.textContent = "+ Ajouter instruction";
        addInstBtn.className = "reset-app-btn";
        addInstBtn.onclick = () => {
            if (!customRecipeData) customRecipeData = JSON.parse(JSON.stringify(recipeData));
            customRecipeData.steps[currentStepIndex].instructions.push("Nouvelle instruction...");
            localStorage.setItem('breadAppCustomData', JSON.stringify(customRecipeData));
            renderCurrentStep();
        };
        content.appendChild(addInstBtn);
    }

    // Timer
    if (step.timer && step.timer > 0) {
        const timerBox = document.createElement('div');
        timerBox.className = 'timer-box';

        let displayTime = remainingTime || step.timer;
        if (remainingTime === 0 && timerendTime) displayTime = 0;
        if (remainingTime === null) displayTime = step.timer;

        const display = document.createElement('div');
        display.className = 'timer-display';
        display.id = 'timer-display';
        display.textContent = formatTime(displayTime);

        const controls = document.createElement('div');
        controls.className = 'timer-controls';

        const startBtn = document.createElement('button');
        startBtn.className = 'btn-timer';
        startBtn.textContent = 'Démarrer';
        startBtn.onclick = () => toggleTimer(startBtn, step.timer);

        if (timerendTime && remainingTime > 0) {
            startBtn.click();
        } else if (timerendTime && remainingTime === 0) {
            startBtn.textContent = 'ALERTE - Arrêter';
            startBtn.classList.add('alarm-active');
            startAlarm();
            if (Notification && Notification.permission === "granted") {
                new Notification("Mon Pain Français", { body: "Le temps est écoulé (pendant votre absence) !" });
            }
        }

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn-timer';
        resetBtn.textContent = 'Reset';
        resetBtn.onclick = () => resetTimer(startBtn, step.timer);

        controls.appendChild(startBtn);
        controls.appendChild(resetBtn);

        timerBox.appendChild(display);
        timerBox.appendChild(controls);
        content.appendChild(timerBox);
    }

    card.appendChild(content);
    stepContainer.appendChild(card);
}

// Alarm Logic
let audioCtx;
let alarmInterval;

// Mobile Audio Fix: "Keep-Alive" Strategy
// We play a silent sound continuously while the timer runs.
// This prevents the browser from sleeping the tab or killing the AudioContext.
let silentOscData = null; // { osc, gain }

// Phase 3: The "Scheduler" Strategy
// We define the siren sound graph *once* and just control its volume timeline.
// This allows the alarm to trigger even if the CPU/JS is completely frozen by the OS.

function toggleSilentKeeper(shouldPlay) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Resume if needed
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.warn(e));
        }

        if (shouldPlay) {
            if (silentOscData) return;

            // 1. Create Main Oscillator (The Sound)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            // 2. Create LFO (The "Wobble" Siren Effect) - No JS loop needed!
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();

            // Siren Configuration
            osc.frequency.value = 880; // Base tone
            osc.type = 'sine';

            lfo.frequency.value = 4; // Wobble speed (4Hz)
            lfo.type = 'square';     // Harsh wobble
            lfoGain.gain.value = 200; // Modulation depth (+/- 200Hz)

            // Connect LFO -> Modulate Main Frequency
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            // Connect Main -> Output
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            // Start Silently
            gain.gain.value = 0.0001; // Practically silent, keeps hardware active

            osc.start();
            lfo.start();

            silentOscData = { osc, gain, lfo, lfoGain };
            console.log("Audio Chain Started (Silent Mode)");

        } else {
            // Stop everything
            if (silentOscData) {
                try {
                    silentOscData.osc.stop();
                    silentOscData.lfo.stop();
                    // Disconnect to clean up
                    silentOscData.osc.disconnect();
                    silentOscData.lfo.disconnect();
                    silentOscData.lfoGain.disconnect();
                    silentOscData.gain.disconnect();
                } catch (e) { }
                silentOscData = null;

                // Cancel any future alarm schedules if stopping early!
                if (audioCtx && silentOscData && silentOscData.gain) {
                    silentOscData.gain.gain.cancelScheduledValues(0);
                }
            }
        }
    } catch (e) {
        console.error("Audio Keeper Error", e);
    }
}

// Function to Schedule the volume jump in the future
// This sends the command to the Hardware immediately.
function scheduleAlarmEvent(secondsFromNow) {
    if (!silentOscData || !audioCtx) return;

    const now = audioCtx.currentTime;
    const triggerTime = now + secondsFromNow;

    console.log("Scheduling alarm for:", triggerTime);

    // Secure the timeline: Stay silent until target time
    silentOscData.gain.gain.setValueAtTime(0.0001, now);
    silentOscData.gain.gain.setValueAtTime(0.0001, triggerTime - 0.1);

    // BAM! Volume up at target time. 
    // The hardware will execute this even if Phone is Locked.
    silentOscData.gain.gain.linearRampToValueAtTime(1, triggerTime);
}

function startAlarm() {
    // Redundant now, but kept for logic consistency if triggered manually
    if (silentOscData) {
        silentOscData.gain.gain.cancelScheduledValues(0);
        silentOscData.gain.gain.value = 1;
    }
}
// END Phase 3 Audio Engine


// Ensure audio is unlocked on first touch just in case
document.addEventListener('touchstart', function () {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { }
}, { once: true });
document.addEventListener('click', function () {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { }
}, { once: true });


function playBeep() {
    // Ensure context exists
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // ... existing beep logic
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

// Siren Logic (Double Beep)
function scheduleBeepPattern(osc, gainNode, startTime) {
    // Beep 1
    osc.frequency.setValueAtTime(880, startTime);
    osc.frequency.linearRampToValueAtTime(880, startTime + 0.2);
    gainNode.gain.setValueAtTime(1, startTime);
    gainNode.gain.setValueAtTime(0, startTime + 0.2);

    // Beep 2
    osc.frequency.setValueAtTime(1200, startTime + 0.3);
    osc.frequency.linearRampToValueAtTime(1200, startTime + 0.5);
    gainNode.gain.setValueAtTime(1, startTime + 0.3);
    gainNode.gain.setValueAtTime(0, startTime + 0.5);
}

function startAlarm() {
    // Strategy: Immediate Loud Noise (Simpler is better for background)
    if (silentOscData && silentOscData.osc && silentOscData.gain) {
        console.log("Hijacking silent oscillator for alarm...");
        const { osc, gain } = silentOscData;

        // Immediate Override (No scheduling)
        gain.gain.cancelScheduledValues(0);
        osc.frequency.cancelScheduledValues(0);

        gain.gain.value = 1; // Max volume immediately

        // Siren Logic via setInterval (JavaScript thread is kept alive by oscillator)
        let toggle = false;
        const sirenLoop = () => {
            if (!silentOscData) return; // Stopped
            // Alternating frequency 880Hz <-> 1200Hz
            osc.frequency.value = toggle ? 1200 : 880;
            toggle = !toggle;
        };
        sirenLoop(); // First beep
        alarmInterval = setInterval(sirenLoop, 500); // Toggle every 500ms

    } else {
        // Fallback: Create new oscillator (Standard)
        playBeep();
        alarmInterval = setInterval(playBeep, 1000);
    }
}

function stopAlarm() {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }

    // Stop the hijacked silent oscillator if it was used
    if (silentOscData) {
        try {
            // Ramp down to silence instead of stop, or just kill it
            // Better to kill it to stop the noise
            silentOscData.osc.stop();
            silentOscData.osc.disconnect();
            silentOscData.gain.disconnect();
        } catch (e) { }
        silentOscData = null;
    }

    if (audioCtx) {
        // audioCtx.suspend(); 
        // Keep context alive? No, usually fine to iterate.
    }
}

function toggleTimer(btn, initialDuration) {
    // If alarm is ringing (btn says "Arrêter")
    if (btn.classList.contains('alarm-active')) {
        stopAlarm();
        toggleSilentKeeper(false); // Stop Keep-Alive
        btn.classList.remove('alarm-active');
        btn.textContent = 'Terminé';
        timerendTime = null;
        saveState();
        return;
    }

    if (intervalId) {
        // Pause
        clearInterval(intervalId);
        intervalId = null;

        // Cancel the scheduled scream!
        if (silentOscData && silentOscData.gain) {
            silentOscData.gain.gain.cancelScheduledValues(0);
            silentOscData.gain.gain.value = 0.0001; // Back to silence
        }

        toggleSilentKeeper(false); // Stop Keep-Alive
        timerendTime = null;
        saveState();
        btn.textContent = 'Reprendre';
    } else {
        // Start
        toggleSilentKeeper(true); // Start Audio Engine (Silent)

        // SCHEDULING: Tell the audio hardware NOW when to scream later.
        // This is robust against JS freezing.
        if (remainingTime || initialDuration) {
            const duration = remainingTime ? remainingTime : parseInt(initialDuration);
            scheduleAlarmEvent(duration);
        }

        try {
            if (typeof Notification !== 'undefined' && Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission().catch(e => console.log("Notif error", e));
            }
        } catch (e) {
            console.warn("Notifications not supported or blocked", e);
        }

        if (!remainingTime) remainingTime = parseInt(initialDuration);

        if (!timerendTime) {
            timerendTime = Date.now() + (remainingTime * 1000);
            saveState();
        }

        btn.textContent = 'Pause';
        intervalId = setInterval(() => {
            // Force Audio Resume on every tick (Anti-Sleep for iOS)
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => { });
            }

            const now = Date.now();
            const left = Math.ceil((timerendTime - now) / 1000);
            remainingTime = left;

            if (document.getElementById('timer-display')) {
                // If negative, show 00:00 or stay at 0
                const showTime = remainingTime > 0 ? remainingTime : 0;
                document.getElementById('timer-display').textContent = formatTime(showTime);
            }

            if (remainingTime <= 0) {
                clearInterval(intervalId);
                intervalId = null;
                // Do NOT stop silent keeper here; we hijack it for the alarm
                // toggleSilentKeeper(false); 

                btn.textContent = 'ALERTE - Arrêter';
                btn.classList.add('alarm-active');
                startAlarm();

                if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
                    new Notification("Mon Pain Français", { body: "Le minuteur est terminé !" });
                }

                timerendTime = null;
                saveState();
            }
        }, 1000);
    }
}

function resetTimer(startBtn, initialDuration) {
    clearInterval(intervalId);
    intervalId = null;
    toggleSilentKeeper(false); // Stop Keep-Alive
    timerendTime = null;
    remainingTime = initialDuration;
    saveState();

    if (document.getElementById('timer-display'))
        document.getElementById('timer-display').textContent = formatTime(remainingTime);

    startBtn.textContent = 'Démarrer';
    startBtn.classList.remove('alarm-active');
    stopAlarm();
}

// Start
// Start
// init(); // Removed strict call, will rely on end of file

let isAdmin = false;
let customRecipeData = null; // Overrides

function loadCustomData() {
    const saved = localStorage.getItem('breadAppCustomData');
    if (saved) {
        try {
            customRecipeData = JSON.parse(saved);
            // Merge logic: currently simple, we just use customData if present for steps
            // Ideally we shallow merge to keep structure if code updates.
            // For now, let's assume customData is the full source of truth if exists.
        } catch (e) { console.error("Bad custom data", e); }
    }
}

function getStepData(index) {
    if (customRecipeData && customRecipeData.steps && customRecipeData.steps[index]) {
        return customRecipeData.steps[index];
    }
    return recipeData.steps[index];
}

// GitHub API Configuration
const REPO_OWNER = 'lumios-le-jeu';
const REPO_NAME = 'mon_pain_francais';
const FILE_PATH = 'data.js';

// Helper for UTF-8 Base64 encoding
function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

async function pushToGitHub() {
    const token = localStorage.getItem('githubToken');
    if (!token) {
        alert("Veuillez d'abord entrer votre Token GitHub dans le champ prévu !");
        return;
    }

    // 1. Prepare Content
    let dataToExport = recipeData;
    if (customRecipeData) {
        dataToExport = customRecipeData;
    }
    const fileContent = `const recipeData = ${JSON.stringify(dataToExport, null, 4)};`;
    const contentEncoded = utf8_to_b64(fileContent);

    const btn = document.getElementById('admin-save-btn');
    const originalText = btn.textContent;
    btn.textContent = "⏳ Envoi en cours...";
    btn.disabled = true;

    try {
        // 2. Get current file SHA (required for update)
        const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const getResponse = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!getResponse.ok) throw new Error("Impossible de récupérer les infos du fichier sur GitHub.");
        const fileData = await getResponse.json();
        const sha = fileData.sha;

        // 3. Push Update (PUT)
        const putBody = {
            message: `Update recipe data via Admin UI (${new Date().toLocaleString()})`,
            content: contentEncoded,
            sha: sha
        };

        const putResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(putBody)
        });

        if (!putResponse.ok) throw new Error("Erreur lors de l'envoi vers GitHub.");

        alert("✅ Succès ! Les modifications sont en ligne sur GitHub.");

    } catch (e) {
        console.error(e);
        alert("❌ Erreur : " + e.message + "\nVérifiez votre Token et votre connexion.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function verifyGithubToken(token) {
    if (!token) return false;
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${token}` }
        });
        return response.ok;
    } catch (e) {
        return false;
    }
}

function toggleAdmin() {
    if (isAdmin) {
        isAdmin = false;
        document.body.classList.remove('admin-enabled');

        // Remove UI Elements
        const controls = document.getElementById('admin-global-controls');
        if (controls) controls.remove();

        alert("Mode Admin Désactivé");
        renderCurrentStep();
    } else {
        const code = prompt("Code d'accès administrateur :");
        if (code === "Francois") {
            isAdmin = true;
            document.body.classList.add('admin-enabled');

            // Create Admin Container
            const container = document.createElement('div');
            container.id = 'admin-global-controls';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                align-items: flex-end;
            `;

            // Token Input
            const tokenInput = document.createElement('input');
            tokenInput.type = 'password';
            tokenInput.placeholder = 'Collez votre Token GitHub ici';
            tokenInput.title = 'Collez le token pour valider';
            tokenInput.value = localStorage.getItem('githubToken') || '';
            tokenInput.style.cssText = `
                padding: 8px;
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.8);
                color: white;
                width: 200px;
                transition: border-color 0.3s;
            `;

            // Save Button
            const saveBtn = document.createElement('button');
            saveBtn.id = 'admin-save-btn';
            saveBtn.textContent = "Token requis pour publier";
            saveBtn.disabled = true; // Disabled by default
            saveBtn.style.cssText = `
                background: #95a5a6; /* Grey initially */
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 30px;
                font-weight: bold;
                cursor: not-allowed;
                box-shadow: none;
                transition: all 0.3s;
            `;
            saveBtn.onclick = pushToGitHub;

            // Validator Logic
            let debounceTimer;
            const validate = async (token) => {
                if (!token) {
                    saveBtn.style.background = '#95a5a6';
                    saveBtn.textContent = "Token requis";
                    saveBtn.disabled = true;
                    saveBtn.style.cursor = 'not-allowed';
                    return;
                }

                saveBtn.textContent = "⏳ Vérification...";

                const isValid = await verifyGithubToken(token);
                if (isValid) {
                    saveBtn.style.background = '#2ecc71';
                    saveBtn.textContent = "☁️ PUBLIER SUR GITHUB";
                    saveBtn.disabled = false;
                    saveBtn.style.cursor = 'pointer';
                    saveBtn.style.boxShadow = '0 4px 15px rgba(46, 204, 113, 0.4)';
                    tokenInput.style.borderColor = '#2ecc71';
                } else {
                    saveBtn.style.background = '#e74c3c';
                    saveBtn.textContent = "Token Invalide";
                    saveBtn.disabled = true;
                    saveBtn.style.cursor = 'not-allowed';
                    tokenInput.style.borderColor = '#e74c3c';
                }
            };

            // Input Listener
            tokenInput.oninput = (e) => {
                const val = e.target.value.trim();
                localStorage.setItem('githubToken', val);
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => validate(val), 800); // Debounce check
            };

            container.appendChild(tokenInput);
            container.appendChild(saveBtn);
            document.body.appendChild(container);

            // Initial Check if token exists
            if (tokenInput.value) {
                validate(tokenInput.value);
            }

            alert("Mode Admin Activé.\nSi votre Token est valide, le bouton de publication deviendra vert.");
            renderCurrentStep();
        } else {
            alert("Code incorrect.");
        }
    }
}

function saveCustomStep(index, field, value) {
    if (!customRecipeData) {
        // Clone original info deep copy
        customRecipeData = JSON.parse(JSON.stringify(recipeData));
    }

    // Update
    if (field === 'instructions') {
        // Value is innerText, split by lines? Or just block?
        // Our renderer expects array. 
        // For simplicity let's assume user edits one block locally, 
        // but converting UL text back to array is tricky if we make the UL editable.
        // Better: make each LI editable?
        // Let's defer instruction complex editing.
        // Implementing simple title edit first.
        customRecipeData.steps[index][field] = value;
    } else {
        customRecipeData.steps[index][field] = value;
    }

    localStorage.setItem('breadAppCustomData', JSON.stringify(customRecipeData));
}

function addStepImage(index, base64) {
    if (!customRecipeData) customRecipeData = JSON.parse(JSON.stringify(recipeData));

    const step = customRecipeData.steps[index];
    if (!step.images) step.images = [];
    // If there was a single image, push it first?
    if (step.image && step.images.length === 0) step.images.push(step.image);

    step.images.push(base64);
    // Update main image to be the last one added? Or just use images array logic in render
    step.image = base64; // Fallback for legacy

    localStorage.setItem('breadAppCustomData', JSON.stringify(customRecipeData));
    renderCurrentStep();
}

function removeStepImage(stepIndex, imgIndex) {
    if (!customRecipeData) customRecipeData = JSON.parse(JSON.stringify(recipeData));
    const step = customRecipeData.steps[stepIndex];
    if (step.images) {
        step.images.splice(imgIndex, 1);
        // Reset legacy main image
        step.image = step.images.length > 0 ? step.images[0] : "";
        localStorage.setItem('breadAppCustomData', JSON.stringify(customRecipeData));
        renderCurrentStep();
    }
}

// Compress Image Logic
function handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Resize logic
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG 0.7
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            addStepImage(currentStepIndex, dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Attach global listener for file input
const globalFileInput = document.getElementById('global-file-input');
if (globalFileInput) {
    globalFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
            e.target.value = ''; // Reset
        }
    });
}

// Update Render Function to use getStepData and Admin UI
// We MUST overwrite the previous renderCurrentStep completely to include admin logic.

window.toggleAdmin = toggleAdmin; // Expose to global scope for HTML button

// Need to update renderCurrentStep to support:
// 1. Multiple images
// 2. Editable Content
// 3. Admin Controls (Upload)

// Overwriting renderCurrentStep implies replacing it. 
// I will insert it here. But wait, I'm appending to the file?
// Replace tool usage needs to TARGET the existing renderCurrentStep.
// Let's modify the previous `renderCurrentStep` in the existing file blocks.
// I will place `init()` at the end.

loadCustomData();
init();

