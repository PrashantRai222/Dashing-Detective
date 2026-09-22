console.log("Dashing Detective — The Midnight Protocol Engine Loaded!");

/* ==========================================================
   1. WEB AUDIO API SYNTHESIZER (Atmosphere, Rain, Stings)
   ========================================================== */
let audioCtx = null;
let rainNode = null;
let droneNode = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function startAmbientSoundtrack() {
    if (!gamestate.audioEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // 1. Synthesized Rain Ambient (Pink/Brown noise filter)
        if (!rainNode) {
            const bufferSize = ctx.sampleRate * 2;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99 * b0 + white * 0.05;
                b1 = 0.95 * b1 + white * 0.08;
                b2 = 0.90 * b2 + white * 0.12;
                output[i] = (b0 + b1 + b2) * 0.15;
            }

            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            const rainFilter = ctx.createBiquadFilter();
            rainFilter.type = 'lowpass';
            rainFilter.frequency.value = 1000;

            const rainGain = ctx.createGain();
            rainGain.gain.value = 0.04; // Gentle ambient rain

            noiseSource.connect(rainFilter);
            rainFilter.connect(rainGain);
            rainGain.connect(ctx.destination);

            noiseSource.start();
            rainNode = { source: noiseSource, gain: rainGain };
        }

        // 2. Suspense Low Cello Drone (F Minor / Suspense)
        if (!droneNode) {
            const osc = ctx.createOscillator();
            const droneGain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(65.41, ctx.currentTime); // C2 low drone

            droneGain.gain.setValueAtTime(0.03, ctx.currentTime);

            osc.connect(droneGain);
            droneGain.connect(ctx.destination);
            osc.start();
            droneNode = { osc, gain: droneGain };
        }
    } catch (e) {
        console.warn("Ambient audio init:", e);
    }
}

function stopAmbientSoundtrack() {
    try {
        if (rainNode) {
            rainNode.source.stop();
            rainNode = null;
        }
        if (droneNode) {
            droneNode.osc.stop();
            droneNode = null;
        }
    } catch (e) {}
}

function playTone(freq, type, duration, gainVal = 0.15) {
    if (!gamestate.audioEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
}

function playChime() {
    playTone(587.33, 'sine', 0.25, 0.15); // D5
    setTimeout(() => playTone(880.00, 'sine', 0.4, 0.2), 120); // A5
}

function playTypewriter() {
    playTone(1800 + Math.random() * 400, 'triangle', 0.025, 0.03);
}

function playHeartbeat(bpm = 80) {
    if (!gamestate.audioEnabled) return;
    const freq = bpm > 110 ? 440 : 280;
    playTone(freq, 'sine', 0.08, 0.12);
}

function playTableSlam() {
    if (!gamestate.audioEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        // Deep punchy table impact thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
}

function playDramaticCIDSting() {
    if (!gamestate.audioEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        // Iconic C.I.D. style brass & timpani sting ("Dhum-tana-na!")
        [110, 138.59, 164.81].forEach(f => playTone(f, 'sawtooth', 0.6, 0.3));
        setTimeout(() => {
            [220, 277.18, 329.63, 440].forEach(f => playTone(f, 'sawtooth', 1.2, 0.25));
        }, 160);
    } catch (e) {}
}

function playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((note, idx) => {
        setTimeout(() => playTone(note, 'sine', 0.4, 0.2), idx * 130);
    });
}

function playBuzz() {
    playTone(140, 'sawtooth', 0.3, 0.25);
    setTimeout(() => playTone(110, 'sawtooth', 0.35, 0.3), 120);
}

function toggleAudio() {
    gamestate.audioEnabled = !gamestate.audioEnabled;
    const btn = document.getElementById('audio-toggle-btn');
    if (btn) {
        btn.textContent = gamestate.audioEnabled ? "🔊 Audio: ON" : "🔇 Audio: OFF";
    }
    if (gamestate.audioEnabled) {
        startAmbientSoundtrack();
        playChime();
    } else {
        stopAmbientSoundtrack();
    }
    saveGameState();
}

/* ==========================================================
   2. GAME STATE & PERSISTENCE
   ========================================================== */
let gamestate = {
    evidenceExamined: [],
    unlockedEvidence: [1],
    suspectsQuestioned: [],
    suspectsContradicted: [],
    witnessQuestioned: [],
    unlockedWitnesses: [1],
    crimeSceneHotspots: [],
    corkboardConnections: [],
    credibility: 3,
    timeRemaining: 3585, // 59 mins 45 secs in seconds
    uvActive: false,
    chemicalTested: false,
    fingerprintLifted: false,
    accusedSuspect: null,
    isSolved: false,
    audioEnabled: true
};

function loadGameState() {
    try {
        const saved = localStorage.getItem("dashing_detective_cid_v3");
        if (saved) {
            gamestate = Object.assign(gamestate, JSON.parse(saved));
        }
    } catch (e) {}
}

function saveGameState() {
    try {
        localStorage.setItem("dashing_detective_cid_v3", JSON.stringify(gamestate));
    } catch (e) {}
}

function confirmResetCase() {
    if (confirm("Reset the investigation? All gathered evidence, forensics, and deductions will be cleared.")) {
        localStorage.removeItem("dashing_detective_cid_v3");
        location.reload();
    }
}

/* ==========================================================
   3. COUNTDOWN TIMER & CREDIBILITY SYSTEM
   ========================================================== */
let timerInterval = null;

function startCountdown() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gamestate.timeRemaining > 0 && !gamestate.isSolved) {
            gamestate.timeRemaining--;
            updateTimerDisplay();
        } else if (gamestate.timeRemaining <= 0 && !gamestate.isSolved) {
            clearInterval(timerInterval);
            triggerTimeoutGameOver();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(gamestate.timeRemaining / 60);
    const secs = gamestate.timeRemaining % 60;
    const formatted = (mins < 10 ? '0' : '') + mins + ":" + (secs < 10 ? '0' : '') + secs;

    const clock = document.getElementById('countdown-clock');
    const sideClock = document.getElementById('sidebar-countdown');
    if (clock) clock.textContent = formatted;
    if (sideClock) sideClock.textContent = "⏱️ Antidote: " + formatted;
}

function loseCredibility(reason = "") {
    gamestate.credibility--;
    playBuzz();
    updateCredibilityUI();
    saveGameState();

    if (gamestate.credibility <= 0) {
        showMessage("🚨 BADGE REVOKED — GAME OVER",
            "The Police Chief has suspended your detective credentials due to reckless accusations and baseless claims.\n\n" +
            "Dr. Vance's condition deteriorated before the antidote could be extracted.\n\n" +
            "Click Reset to restart your investigation from the beginning."
        );
    } else {
        showMessage("⚠️ CREDIBILITY PENALTY!",
            "You lost 1 Credibility Shield!\n\n" + reason + "\n\n" +
            "Remaining Shields: " + gamestate.credibility + "/3. Be careful, Detective!"
        );
    }
}

function updateCredibilityUI() {
    for (let i = 1; i <= 3; i++) {
        const shield = document.getElementById('shield-1');
        const shieldEl = document.getElementById('shield-' + i);
        if (shieldEl) {
            if (i <= gamestate.credibility) {
                shieldEl.classList.add('active');
            } else {
                shieldEl.classList.remove('active');
            }
        }
    }
}

function triggerTimeoutGameOver() {
    playBuzz();
    showMessage("⏱️ TIME EXPIRED", "The midnight antidote window has passed! The neurotoxin formula was permanently purged from the laptop. Case Failed.");
}

/* ==========================================================
   4. NARRATIVE DATA (Evidence, Suspects, Witnesses)
   ========================================================== */
const evidenceData = {
    1: {
        title: "Quantum Research Laptop",
        text: "Dr. Marcus Vance's personal encrypted machine. It contains the molecular antidote formula for Neurotoxin-9. The hard drive was extracted from the charging bay at 8:48 PM.",
        source: "Lab 204 desk"
    },
    2: {
        title: "CCTV Corridor Tape #02",
        text: "Hallway camera footage. At 8:40 PM, the lights flicker off due to a circuit breaker trip. At 8:45 PM, a figure wearing a dark blue jacket darts out of Lab 204.",
        source: "Hallway CCTV camera dome"
    },
    3: {
        title: "Smudged Fingerprints",
        text: "Latent prints lifted from the desk and coffee cup rim. Dusting in the FSL lab confirms TWO sets of prints: one belongs to Emily Carter on the laptop casing, and the other belongs to Accountant Michael Johnson on the poison mug!",
        source: "Desk surface & Poison Mug"
    },
    4: {
        title: "Poisoned Coffee Cup",
        text: "Dr. Vance's ceramic mug. Chemical reagent testing in FSL reveals traces of synthetic Neurotoxin-9—a deadly paralytic substance. The poison was slipped in right before his 8:30 PM meeting!",
        source: "Dr. Vance's desk"
    },
    5: {
        title: "Torn Blue Fabric Scrap",
        text: "A 2-inch jagged fabric swatch found on the lower door hinge. Matches a dark blue student hoodie. The fibers are completely unfrayed, proving it snagged tonight.",
        source: "Lab door hinge"
    }
};

const suspectData = {
    1: {
        name: "John Doe",
        role: "Lead AI Coder",
        age: 29,
        image: "images/suspect1.png",
        baseBPM: 74,
        alibi: "I was debugging server threads until 8:15 PM, then took my usual coffee break downstairs and left campus at 8:30 PM. The parking barrier timestamp proves my car exited.",
        pressReaction: "Look at my git logs, Detective! I have no reason to hurt Dr. Vance. I've been writing neural network code all night. Why would I touch his coffee?",
        contradictionTrigger: null
    },
    2: {
        name: "Jane Smith",
        role: "Digital Artist",
        age: 28,
        image: "images/jane.jpg",
        baseBPM: 82,
        alibi: "I was alone in the graphic studio finishing presentation slides. I saw someone running through the hall around 8:45 PM, but it was too dark to make out their face.",
        pressReaction: "Why are you grilling me? Dr. Vance gave me my research grant! I was designing project logos all evening. Check my Illustrator history!",
        contradictionTrigger: null
    },
    3: {
        name: "Michael Johnson",
        role: "Grant Accountant",
        age: 42,
        image: "images/suspect3.png",
        baseBPM: 92, // Naturally nervous!
        alibi: "I was in my 1st-floor office reconciling university grant accounts until 9:00 PM. I only visited Lab 204 briefly around 8:00 PM to return a quarterly expenditure folder.",
        pressReaction: "This is harassment! Dr. Vance and I have a purely financial relationship. I have no access to the chemistry wing or synthetic neurotoxins! (Sweat beads form on his forehead)",
        contradictionTrigger: 4, // Confronting with the Poisoned Cup or FSL chemical report breaks him!
        altContradictionTrigger: 3, // His fingerprints on the mug!
        confession: "Fine! You want the truth?! (He pounds the table in fury)\n\n" +
            "Vance discovered I was siphoning $2.4 million from Project Eclipse into offshore shell accounts! He was going to turn my ledger over to federal auditors tomorrow morning!\n\n" +
            "I couldn't let him destroy me! I slipped the Neurotoxin-9 into his coffee while handing him the audit folder. I paid Carlos $10,000 to trip the circuit breaker at 8:40 PM so I could steal his master laptop and destroy the evidence!\n\n" +
            "The antidote formula is stored on the encrypted partition under key 'ECLIPSE-99'. Call the hospital... save him before it's too late!"
    },
    4: {
        name: "Emily Carter",
        role: "Researcher / Whistleblower",
        age: 22,
        image: "images/emily.jpg",
        baseBPM: 105,
        alibi: "I was on the 4th floor participating in a study group until 9:00 PM. I lost my dark blue jacket over a week ago at the campus gym. I swear I didn't touch anything in that lab!",
        pressReaction: "Please... you have to believe me! I didn't poison Dr. Vance! (She stammers nervously, clutching her hands)\n" +
            "My sister disappeared two months ago after working on this project! I snuck in to find her research logs!",
        contradictionTrigger: 5, // Torn Blue Fabric Scrap proves she lied about the jacket!
        confession: "Okay! Stop! (Tears stream down her face)\n\n" +
            "I lied about the jacket because I was terrified! When the power died at 8:40 PM, I slipped into the lab. But Dr. Vance was already slumped over his desk, gasping for air! A poisoned cup was on his desk!\n\n" +
            "I grabbed the laptop because I thought Dr. Vance's attackers were going to destroy the data. I panicked and hid the laptop inside locker #14 in the basement gym! I didn't poison him... someone else was already there before me!"
    },
    5: {
        name: "Priya Nair",
        role: "Campus Archivist",
        age: 21,
        image: "images/niar.jpg",
        baseBPM: 70,
        alibi: "I was at the library front desk the entire shift until 9:30 PM. Our visitor gate logs record everyone who entered.",
        pressReaction: "I don't know anything about quantum computers or poisons. I just manage thesis archives!",
        contradictionTrigger: null
    },
    6: {
        name: "Carlos Mendez",
        role: "Maintenance Electrician",
        age: 34,
        image: "images/375473.jpeg",
        baseBPM: 88,
        alibi: "I was fixing a jammed soda machine down the east corridor when the lights tripped at 8:40 PM. It was just an overloaded circuit!",
        pressReaction: "Hey, circuits trip all the time in this old building! I didn't touch the lab breakers on purpose! Why are you looking at my toolbox?!",
        contradictionTrigger: null
    },
    7: {
        name: "Olivia Brooks",
        role: "Lab Assistant",
        age: 24,
        image: "images/mmm.jpg",
        baseBPM: 75,
        alibi: "I left the department at 5:45 PM after cataloging chemical inventory. My keycard logs prove I wasn't on campus.",
        pressReaction: "I prepared Dr. Vance's normal reagent supplies this morning. Everything was locked in the chemical cabinet.",
        contradictionTrigger: null
    },
    8: {
        name: "Daniel Osei",
        role: "Department Secretary",
        age: 22,
        image: "images/nnn.jpg",
        baseBPM: 78,
        alibi: "I was sorting mail in the dean's suite. Around 8:35 PM, I remember seeing Michael Johnson rushing out of Dr. Vance's office looking visibly shaken.",
        pressReaction: "I swear, Michael looked terrified when he left Vance's room! He was clutching an audit file and sweating profusely.",
        contradictionTrigger: null
    }
};

const witnessData = {
    1: {
        name: "Sarah Thompson",
        statement: "I was grading essays in room 201. Right around 8:42 PM, I heard a terrible choking cough from Dr. Vance's lab, followed by heavy footsteps running down the stairs."
    },
    2: {
        name: "David Lee",
        statement: "I was conducting my 9:00 PM patrol. The main circuit breaker was manually cut, and I found a fresh piece of dark blue fabric caught on the lab door hinge."
    },
    3: {
        name: "Rachel Kim",
        statement: "I analyzed Dr. Vance's vitals. The poison is synthetic Neurotoxin-9. It induces full respiratory paralysis within 60 minutes. Without the molecular antidote from his laptop, he will not survive!"
    },
    4: {
        name: "Tom Baxter",
        statement: "I reviewed the building badge swipes. Accountant Michael Johnson swiped into the executive wing at 8:25 PM—just before Vance collapsed!"
    }
};

/* ==========================================================
   5. TYPEWRITER & UI HELPERS
   ========================================================== */
let typeTimer = null;

function typeText(container, text, speed = 16, onComplete = null) {
    if (typeTimer) clearInterval(typeTimer);
    container.textContent = "";
    let i = 0;
    typeTimer = setInterval(() => {
        if (i < text.length) {
            container.textContent += text.charAt(i);
            if (i % 3 === 0) playTypewriter();
            i++;
        } else {
            clearInterval(typeTimer);
            typeTimer = null;
            if (onComplete) onComplete();
        }
    }, speed);
}

function showMessage(title, text) {
    playChime();
    document.getElementById("modal-title").textContent = title;
    const bodyEl = document.getElementById("modal-text");
    typeText(bodyEl, text, 12);
    document.getElementById("messagemodal").classList.add("active");
}

function closeMessage() {
    document.getElementById("messagemodal").classList.remove("active");
    if (typeTimer) clearInterval(typeTimer);
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function setActiveNav(linkEl) {
    document.querySelectorAll('#sidebar-nav li').forEach(li => li.classList.remove('active'));
    if (linkEl && linkEl.parentElement) {
        linkEl.parentElement.classList.add('active');
    }
    document.getElementById('sidebar').classList.remove('mobile-open');
}

function toggleMobileSidebar() {
    document.getElementById('sidebar').classList.toggle('mobile-open');
}

/* ==========================================================
   6. INTERACTIVE CRIME SCENE (With UV Blacklight!)
   ========================================================== */
function openCrimeScene() {
    playChime();
    document.getElementById('crimeSceneModal').classList.add('active');
    updateSceneCluesCount();
}

function closeCrimeScene() {
    document.getElementById('crimeSceneModal').classList.remove('active');
}

function toggleUVMode() {
    gamestate.uvActive = !gamestate.uvActive;
    const btn = document.getElementById('uv-light-btn');
    const overlay = document.getElementById('uv-overlay');
    const img = document.getElementById('crime-scene-img');

    if (gamestate.uvActive) {
        btn.textContent = "🟣 UV Blacklight: ON";
        btn.classList.add('uv-active');
        overlay.style.display = 'block';
        img.style.filter = "hue-rotate(240deg) contrast(1.5) brightness(0.7)";
        playTone(320, 'sine', 0.2, 0.1);
    } else {
        btn.textContent = "🟣 UV Blacklight: OFF";
        btn.classList.remove('uv-active');
        overlay.style.display = 'none';
        img.style.filter = "none";
    }
}

function updateSceneCluesCount() {
    const el = document.getElementById('scene-clues-found');
    if (el) el.textContent = "Clues discovered: " + gamestate.crimeSceneHotspots.length + "/4";
}

function inspectHotspot(type) {
    if (!gamestate.crimeSceneHotspots.includes(type)) {
        gamestate.crimeSceneHotspots.push(type);
    }
    updateSceneCluesCount();

    if (type === 'desk') {
        // Laptop (1), Smudged Fingerprint (3), and Poisoned Mug (4)
        [1, 3, 4].forEach(id => {
            if (!gamestate.unlockedEvidence.includes(id)) gamestate.unlockedEvidence.push(id);
            if (!gamestate.evidenceExamined.includes(id)) gamestate.evidenceExamined.push(id);
        });
        playChime();
        showMessage("Desk Examination: Poison & Laptop Bay",
            "You shine your penlight on Dr. Vance's desk.\n\n" +
            "1. The Quantum Laptop has been ripped from its docking bay!\n" +
            "2. Next to the keyboard is a half-empty coffee mug smelling faintly of bitter almonds (Neurotoxin-9)!\n" +
            "3. Smudged latent fingerprints are visible on the porcelain mug and desk surface.\n\n" +
            "✔ Added Evidence #1, #3 & #4 to your Case File. Take them to the Forensic Lab (FSL) for chemical & print testing!"
        );
    } else if (type === 'camera') {
        if (!gamestate.unlockedEvidence.includes(2)) gamestate.unlockedEvidence.push(2);
        if (!gamestate.evidenceExamined.includes(2)) gamestate.evidenceExamined.push(2);
        playChime();
        showMessage("Corridor CCTV Camera #02",
            "You extract the wide-angle camera dome tape from above the door.\n\n" +
            "At 8:40 PM, the hallway lights were plunged into darkness. At 8:45 PM, an intruder darted through the corridor clutching a laptop.\n\n" +
            "✔ Added Evidence #2 (CCTV Footage). You can now scrub the tape."
        );
    } else if (type === 'door') {
        if (!gamestate.unlockedEvidence.includes(5)) gamestate.unlockedEvidence.push(5);
        if (!gamestate.evidenceExamined.includes(5)) gamestate.evidenceExamined.push(5);
        playChime();
        showMessage("Door Hinge & Circuit Breaker",
            "You inspect the lower door hinge. Caught tightly in the iron groove is a torn scrap of DARK BLUE FABRIC.\n\n" +
            "Next to the door, the electrical breaker panel was forcibly pried open and the main lab fuse was cut with heavy wire pliers!\n\n" +
            "✔ Added Evidence #5 (Torn Blue Fabric)."
        );
    } else if (type === 'terminal') {
        playChime();
        showMessage("Auxiliary Terminal Log",
            "The terminal log displays an emergency audit alert: Dr. Vance had queued a formal report to police auditors regarding $2.4M in missing grant money!\n\n" +
            "Accountant Michael Johnson was named as the primary embezzler!"
        );
    }

    checkWitnessUnlocks();
    updateEvidenceUI();
    renderNotebook();
    checkAccusationUnlock();
    saveGameState();
}

/* ==========================================================
   7. FORENSIC SCIENCE LABORATORY (FSL) WORKBENCH
   ========================================================== */
function openForensicLab(defaultTab = 'chemical') {
    playChime();
    document.getElementById('forensicLabModal').classList.add('active');
    if (defaultTab === 'dusting') {
        switchFSLTab('dusting');
    } else {
        switchFSLTab('chemical');
    }
}

function closeForensicLab() {
    document.getElementById('forensicLabModal').classList.remove('active');
}

function switchFSLTab(tabName, btn) {
    document.querySelectorAll('.fsl-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.fsl-tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById('fsl-' + tabName + '-station');
    if (target) target.style.display = 'block';

    if (btn) {
        btn.classList.add('active');
    } else {
        const matchingBtn = document.querySelector(`.fsl-tab-btn[onclick*="${tabName}"]`);
        if (matchingBtn) matchingBtn.classList.add('active');
    }

    if (tabName === 'dusting') {
        initDustingCanvas();
    }
}

// FSL Station 1: Chemical Toxicity Test
function runChemicalTest() {
    const liquid = document.getElementById('chem-liquid');
    const resultBox = document.getElementById('chem-result-box');
    const btn = document.getElementById('add-reagent-btn');

    playTone(600, 'sine', 0.2, 0.15);
    btn.disabled = true;
    btn.textContent = "Analyzing Reaction...";

    setTimeout(() => {
        // Turns from amber to toxic crimson!
        liquid.className = "chem-liquid crimson";
        resultBox.style.display = 'block';
        playDramaticCIDSting();
        gamestate.chemicalTested = true;
        btn.textContent = "✔ Neurotoxin-9 Verified";
        saveGameState();
    }, 1200);
}

// FSL Station 2: Fingerprint Dusting Canvas
let dustingCanvas = null;
let dustingCtx = null;
let isDusting = false;
let dustedPixels = 0;
let totalCanvasPixels = 0;

function initDustingCanvas() {
    dustingCanvas = document.getElementById('dusting-canvas');
    if (!dustingCanvas) return;
    dustingCtx = dustingCanvas.getContext('2d');

    // Draw dark metallic laptop casing with latent fingerprint hidden under black mask
    dustingCtx.fillStyle = "#1e222a";
    dustingCtx.fillRect(0, 0, 280, 280);

    // Draw fingerprint pattern
    dustingCtx.strokeStyle = "#ffffff";
    dustingCtx.lineWidth = 2.5;
    for (let r = 15; r <= 85; r += 7) {
        dustingCtx.beginPath();
        dustingCtx.ellipse(140, 140, r * 0.75, r, Math.PI / 12, 0, Math.PI * 2);
        dustingCtx.stroke();
    }

    // Cover with black powder mask layer
    dustingCtx.fillStyle = "rgba(15, 17, 21, 0.94)";
    dustingCtx.fillRect(0, 0, 280, 280);

    totalCanvasPixels = 280 * 280;
    dustedPixels = 0;

    dustingCanvas.onmousedown = (e) => { isDusting = true; dustBrush(e); };
    dustingCanvas.onmousemove = (e) => { if (isDusting) dustBrush(e); };
    window.onmouseup = () => { isDusting = false; };
}

function dustBrush(e) {
    if (!dustingCanvas || !dustingCtx) return;
    const rect = dustingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dustingCtx.globalCompositeOperation = 'destination-out';
    dustingCtx.beginPath();
    dustingCtx.arc(x, y, 22, 0, Math.PI * 2);
    dustingCtx.fill();
    dustingCtx.globalCompositeOperation = 'source-over';

    playTypewriter();
    dustedPixels += 40;
    const percent = Math.min(100, Math.floor((dustedPixels / 1500) * 100));

    const percentEl = document.getElementById('powder-percent');
    const fillEl = document.getElementById('powder-progress');
    const tapeBtn = document.getElementById('lift-tape-btn');

    if (percentEl) percentEl.textContent = "Powder Coverage: " + percent + "%";
    if (fillEl) fillEl.style.width = percent + "%";

    if (percent >= 60 && tapeBtn) {
        tapeBtn.disabled = false;
        tapeBtn.classList.add('ready');
    }
}

function liftFingerprintTape() {
    playChime();
    const resultBox = document.getElementById('print-match-result');
    const textEl = document.getElementById('print-match-text');
    const btn = document.getElementById('lift-tape-btn');

    btn.disabled = true;
    btn.textContent = "✔ Fingerprint Lifted & Matched";
    resultBox.style.display = 'block';

    textEl.innerHTML =
        "<strong>CENTRAL FINGERPRINT REPOSITORY MATCH:</strong><br>" +
        "1. Laptop Trackpad Print: <em>Emily Carter (Student #441)</em>.<br>" +
        "2. Poison Mug Print: <em>Michael Johnson (Grant Accountant)</em>!<br><br>" +
        "<strong>Conclusion:</strong> Michael Johnson handled the poisoned mug! Emily touched only the laptop!";

    gamestate.fingerprintLifted = true;
    playDramaticCIDSting();
    renderNotebook();
    saveGameState();
}

/* ==========================================================
   8. INTERACTIVE RED-STRING CORKBOARD (Mind Palace)
   ========================================================== */
let selectedPins = [];
let corkCanvas = null;
let corkCtx = null;

function openCorkboard() {
    playChime();
    document.getElementById('corkboardModal').classList.add('active');
    setTimeout(initCorkboardCanvas, 100);
}

function closeCorkboard() {
    document.getElementById('corkboardModal').classList.remove('active');
}

function initCorkboardCanvas() {
    corkCanvas = document.getElementById('corkboard-canvas');
    if (!corkCanvas) return;
    corkCtx = corkCanvas.getContext('2d');
    redrawCorkStrings();
}

const pinCoords = {
    1: { x: 120, y: 110 }, // Emily Statement
    2: { x: 380, y: 110 }, // Torn Fabric
    3: { x: 640, y: 110 }, // Poison Cup
    4: { x: 640, y: 310 }, // Michael Ledger
    5: { x: 380, y: 310 }, // CCTV Blackout
    6: { x: 120, y: 310 }  // Carlos Toolbox
};

function selectCorkPin(pinId) {
    playTone(400, 'triangle', 0.08, 0.1);

    const pinEl = document.getElementById('cork-pin-' + pinId);
    if (!pinEl) return;

    if (selectedPins.includes(pinId)) {
        selectedPins = selectedPins.filter(id => id !== pinId);
        pinEl.classList.remove('pin-selected');
        return;
    }

    selectedPins.push(pinId);
    pinEl.classList.add('pin-selected');

    if (selectedPins.length === 2) {
        const [p1, p2] = selectedPins;
        const pairKey = [Math.min(p1, p2), Math.max(p1, p2)].join('-');

        if (!gamestate.corkboardConnections.includes(pairKey)) {
            gamestate.corkboardConnections.push(pairKey);
            evaluateCorkboardPair(p1, p2);
        }

        // Reset pin highlights
        document.querySelectorAll('.cork-pin').forEach(p => p.classList.remove('pin-selected'));
        selectedPins = [];
        redrawCorkStrings();
    }
}

function redrawCorkStrings() {
    if (!corkCanvas || !corkCtx) return;
    corkCtx.clearRect(0, 0, corkCanvas.width, corkCanvas.height);

    gamestate.corkboardConnections.forEach(pairKey => {
        const [p1, p2] = pairKey.split('-').map(Number);
        const c1 = pinCoords[p1];
        const c2 = pinCoords[p2];

        corkCtx.strokeStyle = "#d9433f";
        corkCtx.lineWidth = 3.5;
        corkCtx.shadowColor = "rgba(217, 67, 63, 0.8)";
        corkCtx.shadowBlur = 8;

        corkCtx.beginPath();
        corkCtx.moveTo(c1.x, c1.y);
        // Realistic sag in yarn thread
        const midX = (c1.x + c2.x) / 2;
        const midY = (c1.y + c2.y) / 2 + 15;
        corkCtx.quadraticCurveTo(midX, midY, c2.x, c2.y);
        corkCtx.stroke();
        corkCtx.shadowBlur = 0;
    });

    const countEl = document.getElementById('corkboard-deductions-count');
    if (countEl) countEl.textContent = "Breakthroughs Discovered: " + Math.min(3, gamestate.corkboardConnections.length) + "/3";
}

function clearCorkStrings() {
    gamestate.corkboardConnections = [];
    selectedPins = [];
    document.querySelectorAll('.cork-pin').forEach(p => p.classList.remove('pin-selected'));
    redrawCorkStrings();
    saveGameState();
}

function evaluateCorkboardPair(p1, p2) {
    const pair = [Math.min(p1, p2), Math.max(p1, p2)].join('-');

    if (pair === "1-2") {
        playDramaticCIDSting();
        showMessage("🧵 DEDUCTION BREAKTHROUGH #1",
            "KUCH TOH GADBAD HAI!\n\n" +
            "You connect Emily's statement with the Torn Blue Fabric!\n\n" +
            "Emily claims she lost her jacket a week ago, but the freshly torn fabric caught on the door hinge tonight belongs to the exact same blue hoodie weave! She was definitely in Lab 204 tonight!"
        );
    } else if (pair === "3-4") {
        playDramaticCIDSting();
        showMessage("🧵 DEDUCTION BREAKTHROUGH #2",
            "THE MOTIVE EXPOSED!\n\n" +
            "You connect the Neurotoxin-9 Poison Cup with Accountant Michael Johnson's Embezzlement Audit!\n\n" +
            "Dr. Vance had uncovered Michael's $2.4 million theft. Michael poisoned Dr. Vance to stop him from handing the audit file to federal police!"
        );
    } else if (pair === "5-6") {
        playDramaticCIDSting();
        showMessage("🧵 DEDUCTION BREAKTHROUGH #3",
            "THE SABOTAGE CONSPIRACY!\n\n" +
            "You connect the 8:40 PM Blackout with Carlos Mendez's Toolbox!\n\n" +
            "The electrical blackout wasn't an accident. Carlos cut the power breaker at 8:40 PM to blind the CCTV cameras and allow Michael and the intruder entry!"
        );
    } else {
        playTone(300, 'triangle', 0.2, 0.1);
    }

    renderNotebook();
    checkAccusationUnlock();
    saveGameState();
}

/* ==========================================================
   9. HIGH-DRAMA INTERROGATION (EKG & Table Slam!)
   ========================================================== */
let activeSuspectId = 1;
let currentBPM = 76;
let bpmPulseInterval = null;

function questionSuspect(id) {
    activeSuspectId = id;
    const suspect = suspectData[id];
    currentBPM = suspect.baseBPM;

    // Populate modal
    document.getElementById('interrogate-img').src = suspect.image;
    document.getElementById('interrogate-name').textContent = suspect.name;
    document.getElementById('interrogate-meta').textContent = suspect.role + " · Age " + suspect.age;
    
    updateBPMUI();
    startBPMPulse();

    const attitudeBadge = document.getElementById('interrogate-attitude');
    const isContradicted = gamestate.suspectsContradicted.includes(id);

    if (isContradicted) {
        attitudeBadge.textContent = "Cornered / Confessed";
        attitudeBadge.className = "attitude-badge broken";
    } else {
        attitudeBadge.textContent = "Calm";
        attitudeBadge.className = "attitude-badge calm";
    }

    document.getElementById('dialogue-speaker').textContent = suspect.name;
    const dialogueEl = document.getElementById('dialogue-text');

    if (isContradicted && suspect.confession) {
        typeText(dialogueEl, suspect.confession, 15);
    } else {
        typeText(dialogueEl, '"Hello Detective. What questions do you have about tonight\'s incident?"', 15);
    }

    document.getElementById('evidence-presentation-drawer').style.display = 'none';

    if (!gamestate.suspectsQuestioned.includes(id)) {
        gamestate.suspectsQuestioned.push(id);
    }

    updateSuspectCardsUI();
    renderNotebook();
    checkAccusationUnlock();
    saveGameState();

    document.getElementById('interrogationModal').classList.add('active');
}

function closeInterrogation() {
    document.getElementById('interrogationModal').classList.remove('active');
    if (bpmPulseInterval) clearInterval(bpmPulseInterval);
    if (typeTimer) clearInterval(typeTimer);
}

function startBPMPulse() {
    if (bpmPulseInterval) clearInterval(bpmPulseInterval);
    const intervalMs = Math.max(350, Math.floor((60 / currentBPM) * 1000));
    bpmPulseInterval = setInterval(() => {
        playHeartbeat(currentBPM);
        const bpmBox = document.querySelector('.ekg-pulse-box');
        if (bpmBox) {
            bpmBox.classList.add('pulse');
            setTimeout(() => bpmBox.classList.remove('pulse'), 150);
        }
    }, intervalMs);
}

function updateBPMUI() {
    const bpmEl = document.getElementById('ekg-bpm');
    if (bpmEl) bpmEl.textContent = currentBPM;

    const line = document.getElementById('ekg-line');
    if (line) {
        if (currentBPM > 120) {
            line.className = "ekg-line-graphic critical";
        } else if (currentBPM > 95) {
            line.className = "ekg-line-graphic high";
        } else {
            line.className = "ekg-line-graphic";
        }
    }
}

function askAlibi() {
    const suspect = suspectData[activeSuspectId];
    const dialogueEl = document.getElementById('dialogue-text');
    typeText(dialogueEl, suspect.alibi, 15);
}

function pressSuspect() {
    const suspect = suspectData[activeSuspectId];
    const dialogueEl = document.getElementById('dialogue-text');

    // Spike heart rate!
    currentBPM = Math.min(160, currentBPM + 24);
    updateBPMUI();
    startBPMPulse();

    const attitudeBadge = document.getElementById('interrogate-attitude');
    attitudeBadge.textContent = "Agitated / Sweating";
    attitudeBadge.className = "attitude-badge nervous";

    playTone(380, 'triangle', 0.1, 0.12);
    typeText(dialogueEl, suspect.pressReaction, 15);
}

function openEvidencePresentation() {
    const drawer = document.getElementById('evidence-presentation-drawer');
    const grid = document.getElementById('evidence-choices-grid');
    grid.innerHTML = "";

    if (gamestate.evidenceExamined.length === 0) {
        grid.innerHTML = "<p style='color:#aaa; font-style:italic; grid-column:span 2;'>No physical evidence cataloged yet. Search Lab 204 first!</p>";
    } else {
        gamestate.evidenceExamined.forEach(evId => {
            const ev = evidenceData[evId];
            const card = document.createElement('div');
            card.className = "present-ev-card";
            card.onclick = () => slamEvidence(evId);
            card.innerHTML = "<strong>#" + evId + " " + ev.title + "</strong><p>" + ev.text.substring(0, 55) + "...</p>";
            grid.appendChild(card);
        });
    }

    drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
}

function slamEvidence(evId) {
    const suspect = suspectData[activeSuspectId];
    const drawer = document.getElementById('evidence-presentation-drawer');
    drawer.style.display = 'none';

    // 1. Table slam sound!
    playTableSlam();

    // 2. Check if presenting correct contradiction evidence
    const isEmilyContradiction = (activeSuspectId === 4 && (evId === 5 || evId === 4));
    const isMichaelContradiction = (activeSuspectId === 3 && (evId === 4 || evId === 3 || gamestate.chemicalTested));

    if (isEmilyContradiction || isMichaelContradiction) {
        triggerContradictionSequence(suspect, evId);
    } else {
        // Penalty for reckless presentation!
        loseCredibility(`You slammed ${evidenceData[evId].title} at ${suspect.name}, but it does not contradict their alibi!`);
        const dialogueEl = document.getElementById('dialogue-text');
        typeText(dialogueEl, `"What does that prove, Detective? You are making wild accusations without proof!"`, 15);
    }
}

function triggerContradictionSequence(suspect, evId) {
    playDramaticCIDSting();

    const flash = document.getElementById('contradictionFlash');
    const caption = document.getElementById('contradiction-caption');

    if (activeSuspectId === 3) {
        caption.textContent = "Michael's fingerprints & Neurotoxin-9 test prove he poisoned Dr. Vance's coffee!";
    } else {
        caption.textContent = "Emily's blue hoodie matches the fresh tear on the lab door hinge!";
    }

    flash.classList.add('active');

    setTimeout(() => {
        flash.classList.remove('active');

        if (!gamestate.suspectsContradicted.includes(activeSuspectId)) {
            gamestate.suspectsContradicted.push(activeSuspectId);
        }

        currentBPM = 155; // Heart rate max panic!
        updateBPMUI();
        startBPMPulse();

        const attitudeBadge = document.getElementById('interrogate-attitude');
        attitudeBadge.textContent = "Confessed / Broken";
        attitudeBadge.className = "attitude-badge broken";

        const dialogueEl = document.getElementById('dialogue-text');
        typeText(dialogueEl, suspect.confession, 16);

        updateSuspectCardsUI();
        renderNotebook();
        checkAccusationUnlock();
        saveGameState();
    }, 1800);
}

/* ==========================================================
   10. CCTV SCRUBBER & EVIDENCE/WITNESS LOGIC
   ========================================================== */
function openCCTVScrubber() {
    playChime();
    document.getElementById('cctvModal').classList.add('active');
    scrubCCTV(document.getElementById('cctv-slider').value);
}

function closeCCTV() {
    document.getElementById('cctvModal').classList.remove('active');
}

function scrubCCTV(minuteVal) {
    const min = parseInt(minuteVal, 10);
    const timeDisplay = document.getElementById('cctv-timestamp');
    const alertOverlay = document.getElementById('cctv-alert-overlay');
    const caption = document.getElementById('cctv-caption');
    const frameImg = document.getElementById('cctv-frame-img');

    const formattedMin = (min < 10 ? '0' : '') + min;
    timeDisplay.textContent = "CAM-02 | 20:" + formattedMin + ":15 PM";

    if (min >= 39 && min <= 41) {
        alertOverlay.style.display = 'block';
        alertOverlay.textContent = "⚠️ 8:40 PM: CIRCUIT BREAKER SABOTAGE!";
        caption.innerHTML = "<strong style='color:#faad14;'>🚨 BLACKOUT INITIATED (8:40 PM):</strong> Lights flicker off. Maintenance electrician Carlos Mendez seen near the main breaker box!";
        frameImg.style.filter = "brightness(0.5) contrast(1.5)";
        playTone(280, 'triangle', 0.08, 0.05);
    } else if (min >= 44 && min <= 46) {
        alertOverlay.style.display = 'block';
        alertOverlay.textContent = "⚠️ 8:45 PM: LAB BREACH DETECTED";
        caption.innerHTML = "<strong style='color:#ff4d4f;'>🚨 BREACH DETECTED (8:45 PM):</strong> Figure in dark blue jacket dashes out of Lab 204 carrying the Quantum Laptop!";
        frameImg.style.filter = "brightness(1.2) contrast(1.3)";
        playTone(330, 'triangle', 0.08, 0.05);
    } else {
        alertOverlay.style.display = 'none';
        frameImg.style.filter = "none";
        caption.textContent = min < 39 ? "Hallway quiet. Staff members exiting normally." : "Emergency security guards responding at 9:00 PM.";
    }
}

function examineEvidence(id) {
    if (!gamestate.unlockedEvidence.includes(id)) {
        playBuzz();
        showMessage("Evidence Locked", "This physical evidence has not been recovered yet. Search Lab 204 or examine the breaker box.");
        return;
    }

    const ev = evidenceData[id];
    showMessage(ev.title, ev.text + "\n\n📍 Recovery Point: " + ev.source);

    if (!gamestate.evidenceExamined.includes(id)) {
        gamestate.evidenceExamined.push(id);
    }

    const nextId = id + 1;
    if (evidenceData[nextId] && !gamestate.unlockedEvidence.includes(nextId)) {
        gamestate.unlockedEvidence.push(nextId);
    }

    checkWitnessUnlocks();
    updateEvidenceUI();
    renderNotebook();
    checkAccusationUnlock();
    saveGameState();
}

function updateEvidenceUI() {
    const counter = document.getElementById('evidence-counter');
    if (counter) counter.textContent = gamestate.evidenceExamined.length + "/5 Analyzed";

    for (let id = 1; id <= 5; id++) {
        const box = document.getElementById('evidence-box-' + id);
        if (box) {
            const photo = box.querySelector('.evidence-photo');
            const lockIcon = box.querySelector('.lock-icon');
            if (gamestate.unlockedEvidence.includes(id)) {
                if (photo) photo.classList.remove('locked');
                if (lockIcon) lockIcon.style.display = 'none';
            } else {
                if (photo) photo.classList.add('locked');
                if (lockIcon) lockIcon.style.display = 'block';
            }
        }
    }

    const cctvBtn = document.getElementById('cctv-btn');
    if (cctvBtn) cctvBtn.style.display = gamestate.evidenceExamined.includes(2) ? 'inline-block' : 'none';
}

let evidenceExpanded = false;
function toggleAllEvidence() {
    evidenceExpanded = !evidenceExpanded;
    const extras = document.querySelectorAll('.extra-evidence');
    const btn = document.getElementById('view-evidence-btn');
    extras.forEach(el => el.style.display = evidenceExpanded ? 'block' : 'none');
    if (btn) btn.textContent = evidenceExpanded ? 'Show Less ←' : 'View All Evidence (5) →';
}

let suspectsExpanded = false;
function toggleAllSuspects() {
    suspectsExpanded = !suspectsExpanded;
    const extras = document.querySelectorAll('.extra-suspect');
    const btn = document.getElementById('view-suspects-btn');
    extras.forEach(el => el.style.display = suspectsExpanded ? 'block' : 'none');
    if (btn) btn.textContent = suspectsExpanded ? 'Show Less ←' : 'View All Suspects (8) →';
}

function updateSuspectCardsUI() {
    const counter = document.getElementById('suspects-counter');
    if (counter) counter.textContent = gamestate.suspectsQuestioned.length + "/8 Interrogated";

    for (let id = 1; id <= 8; id++) {
        const tag = document.getElementById('status-tag-' + id);
        if (tag) {
            if (gamestate.suspectsContradicted.includes(id)) {
                tag.textContent = "💥 Confessed!";
                tag.className = "suspect-status-tag tag-contradicted";
            } else if (gamestate.suspectsQuestioned.includes(id)) {
                tag.textContent = "Interrogated";
                tag.className = "suspect-status-tag tag-questioned";
            }
        }
    }
}

function checkWitnessUnlocks() {
    if (gamestate.evidenceExamined.includes(5) && !gamestate.unlockedWitnesses.includes(2)) {
        gamestate.unlockedWitnesses.push(2);
    }
    if ((gamestate.chemicalTested || gamestate.evidenceExamined.includes(4)) && !gamestate.unlockedWitnesses.includes(3)) {
        gamestate.unlockedWitnesses.push(3);
    }
    if (gamestate.evidenceExamined.includes(2) && !gamestate.unlockedWitnesses.includes(4)) {
        gamestate.unlockedWitnesses.push(4);
    }
    updateWitnessUI();
}

function updateWitnessUI() {
    const counter = document.getElementById('witness-counter');
    if (counter) counter.textContent = gamestate.witnessQuestioned.length + "/4 Questioned";

    for (let id = 1; id <= 4; id++) {
        const card = document.getElementById('witness-card-' + id);
        if (card) {
            if (gamestate.unlockedWitnesses.includes(id)) {
                card.classList.remove('locked');
                const lockBadge = card.querySelector('.witness-lock-badge');
                if (lockBadge) lockBadge.style.display = 'none';
            } else {
                card.classList.add('locked');
            }
        }
    }
}

function showWitnessStatement(id) {
    if (!gamestate.unlockedWitnesses.includes(id)) {
        playBuzz();
        showMessage("Witness Unavailable", "This witness requires forensic corroboration before questioning.");
        return;
    }

    const witness = witnessData[id];
    showMessage(witness.name + " — Witness Account", witness.statement);

    if (!gamestate.witnessQuestioned.includes(id)) {
        gamestate.witnessQuestioned.push(id);
    }

    updateWitnessUI();
    renderNotebook();
    checkAccusationUnlock();
    saveGameState();
}

/* ==========================================================
   11. FINAL ACCUSATION & VICTORY
   ========================================================== */
let currentSuspectIndex = 1;

function isInvestigationComplete() {
    return gamestate.evidenceExamined.length >= 4 &&
           gamestate.suspectsQuestioned.length >= 4 &&
           gamestate.witnessQuestioned.length >= 2;
}

function checkAccusationUnlock() {
    const totalPts = 10;
    const currentPts = Math.min(4, gamestate.evidenceExamined.length) +
                       Math.min(4, gamestate.suspectsQuestioned.length) +
                       Math.min(2, gamestate.witnessQuestioned.length);

    const percent = Math.floor((currentPts / totalPts) * 100);

    const progressBar = document.getElementById('accusation-progress-bar');
    if (progressBar) progressBar.style.width = percent + "%";

    const progressText =
        "Evidence: " + gamestate.evidenceExamined.length + "/5 · " +
        "Suspects: " + gamestate.suspectsQuestioned.length + "/8 · " +
        "Witnesses: " + gamestate.witnessQuestioned.length + "/4";

    const progressEl = document.getElementById('accusation-progress');
    if (progressEl) progressEl.textContent = progressText;

    const lockedPanel = document.getElementById('accusation-locked');
    const unlockedPanel = document.getElementById('accusation-unlocked');

    if (isInvestigationComplete()) {
        if (lockedPanel) lockedPanel.style.display = 'none';
        if (unlockedPanel) unlockedPanel.style.display = 'block';
        updateCarousel();
    } else {
        if (lockedPanel) lockedPanel.style.display = 'block';
        if (unlockedPanel) unlockedPanel.style.display = 'none';
    }
}

function updateCarousel() {
    const suspect = suspectData[currentSuspectIndex];
    const img = document.getElementById('carousel-img');
    const name = document.getElementById('carousel-name');
    const role = document.getElementById('carousel-role');

    if (img) img.src = suspect.image;
    if (name) name.textContent = suspect.name;
    if (role) role.textContent = suspect.role + " (Age " + suspect.age + ")";
}

function nextSuspect() {
    currentSuspectIndex++;
    if (currentSuspectIndex > 8) currentSuspectIndex = 1;
    playTypewriter();
    updateCarousel();
}

function prevSuspect() {
    currentSuspectIndex--;
    if (currentSuspectIndex < 1) currentSuspectIndex = 8;
    playTypewriter();
    updateCarousel();
}

function confirmAccusation() {
    const suspect = suspectData[currentSuspectIndex];
    if (confirm("Are you 100% certain you want to accuse " + suspect.name + " as the mastermind behind the poisoning and theft?")) {
        makeAccusation(currentSuspectIndex);
    }
}

function makeAccusation(id) {
    gamestate.accusedSuspect = id;
    const suspect = suspectData[id];

    // The mastermind is Suspect 3: Michael Johnson!
    if (id === 3) {
        gamestate.isSolved = true;
        playDramaticCIDSting();
        setTimeout(playVictory, 800);
        showVictoryModal();
    } else if (id === 4) {
        // Emily took the laptop, but didn't poison him!
        loseCredibility("Emily Carter stole the laptop to protect her missing sister's research, but she did NOT poison Dr. Vance! The real poisoner slipped Neurotoxin-9 into his coffee before she entered!");
    } else {
        loseCredibility(suspect.name + " had nothing to do with the poisoning or quantum theft!");
    }
}

function showVictoryModal() {
    const modal = document.getElementById('verdictModal');
    const narrative = document.getElementById('verdict-narrative');
    const rankEl = document.getElementById('v-rank');
    const credEl = document.getElementById('v-cred');
    const evEl = document.getElementById('v-evidence');

    if (rankEl) rankEl.textContent = gamestate.credibility === 3 ? "Supercop ACP" : (gamestate.credibility === 2 ? "Senior Inspector" : "Sub-Inspector");
    if (credEl) credEl.textContent = gamestate.credibility + "/3 Shields";
    if (evEl) evEl.textContent = gamestate.evidenceExamined.length + "/5 Clues";

    narrative.innerHTML =
        "<strong>TOH YEH THA TUMHARA PLAN, MICHAEL JOHNSON!</strong><br><br>" +
        "You completely cracked the conspiracy! Confronted by his fingerprints on the poisoned mug and the FSL Neurotoxin-9 analysis, " +
        "Accountant Michael Johnson collapsed and confessed to poisoning Dr. Marcus Vance to cover up $2.4M in stolen grant funds!<br><br>" +
        "Armed with his confession, police recovered the laptop from locker #14, synthesized the Neurotoxin-9 antidote, and saved Dr. Vance's life with 18 minutes to spare!<br><br>" +
        "Case #001: The Midnight Protocol is officially closed!";

    modal.classList.add('active');
}

function closeVerdict() {
    document.getElementById('verdictModal').classList.remove('active');
}

/* ==========================================================
   12. NOTEBOOK
   ========================================================== */
function toggleNotebook() {
    playTone(440, 'triangle', 0.1, 0.08);
    document.getElementById('notebook-panel').classList.toggle('open');
    renderNotebook();
}

function switchTab(tabName, btn) {
    playTypewriter();
    document.querySelectorAll('.notebook-content').forEach(el => el.style.display = 'none');
    const target = document.getElementById('notebook-' + tabName);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.notebook-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function renderNotebook() {
    // Evidence Tab
    const evContainer = document.getElementById('notebook-evidence');
    if (evContainer) {
        if (gamestate.evidenceExamined.length === 0) {
            evContainer.innerHTML = '<p class="notebook-empty">No evidence cataloged yet. Search Lab 204.</p>';
        } else {
            evContainer.innerHTML = gamestate.evidenceExamined.map(id => {
                const ev = evidenceData[id];
                return '<div class="notebook-entry"><h4>#' + id + ' ' + ev.title + '</h4><p>' + ev.text + '</p><small>📍 ' + ev.source + '</small></div>';
            }).join('');
        }
    }

    // Suspects Tab
    const susContainer = document.getElementById('notebook-suspects');
    if (susContainer) {
        if (gamestate.suspectsQuestioned.length === 0) {
            susContainer.innerHTML = '<p class="notebook-empty">No suspects interrogated yet.</p>';
        } else {
            susContainer.innerHTML = gamestate.suspectsQuestioned.map(id => {
                const s = suspectData[id];
                const isContradicted = gamestate.suspectsContradicted.includes(id);
                const note = isContradicted ? "<strong>💥 Confession:</strong> " + s.confession : "<strong>Alibi:</strong> " + s.alibi;
                return '<div class="notebook-entry"><h4>' + s.name + ' (' + s.role + ')</h4><p>' + note + '</p></div>';
            }).join('');
        }
    }

    // Witnesses Tab
    const witContainer = document.getElementById('notebook-witnesses');
    if (witContainer) {
        if (gamestate.witnessQuestioned.length === 0) {
            witContainer.innerHTML = '<p class="notebook-empty">No witnesses questioned yet.</p>';
        } else {
            witContainer.innerHTML = gamestate.witnessQuestioned.map(id => {
                const w = witnessData[id];
                return '<div class="notebook-entry"><h4>' + w.name + '</h4><p>' + w.statement + '</p></div>';
            }).join('');
        }
    }

    // Deductions Tab
    const breakContainer = document.getElementById('notebook-breakthroughs');
    if (breakContainer) {
        let list = [];
        if (gamestate.chemicalTested) list.push("🧪 <strong>Neurotoxin-9 Confirmed:</strong> Synthetic poison slipped into Dr. Vance's coffee before 8:30 PM.");
        if (gamestate.fingerprintLifted) list.push("🖐️ <strong>Fingerprint Proof:</strong> Michael's prints on the poison mug; Emily's prints only on the laptop casing.");
        if (gamestate.corkboardConnections.length > 0) list.push("🧵 <strong>Mind Palace Connections:</strong> " + gamestate.corkboardConnections.length + " links pinned on deduction corkboard.");

        if (list.length === 0) {
            breakContainer.innerHTML = '<p class="notebook-empty">No deductions yet. Perform FSL chemical tests and connect clues on the corkboard.</p>';
        } else {
            breakContainer.innerHTML = list.map(b => '<div class="notebook-entry breakthrough-entry"><p>' + b + '</p></div>').join('');
        }
    }
}

/* ==========================================================
   13. INITIALIZATION ON LOAD
   ========================================================== */
window.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    startCountdown();
    updateCredibilityUI();
    checkWitnessUnlocks();
    updateEvidenceUI();
    updateSuspectCardsUI();
    updateWitnessUI();
    checkAccusationUnlock();
    renderNotebook();

    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) audioBtn.textContent = gamestate.audioEnabled ? "🔊 Audio: ON" : "🔇 Audio: OFF";

    window.addEventListener('click', () => {
        getAudioContext();
        if (gamestate.audioEnabled) startAmbientSoundtrack();
    }, { once: true });
});