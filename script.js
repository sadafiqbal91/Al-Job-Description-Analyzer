const API_ENDPOINT = '/api/generate';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

let analysisData = null;

const jdInput = document.getElementById('jdInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const dashboard = document.getElementById('resultsDashboard');

window.startAnalysis = async () => {
    const jd = jdInput.value.trim();

    if (!jd) {
        alert('Please paste a job description first!');
        return;
    }

    if (jd.length < 50) {
        alert('Job description seems too short. Please paste the complete JD for better results.');
        return;
    }

    const cacheKey = jd.toLowerCase().trim();
    if (responseCache.has(cacheKey)) {
        const cached = responseCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('Using cached response');
            analysisData = cached.data;
            renderDashboard();
            analyzeBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Analysis Complete! (Cached)';
            setTimeout(() => {
                analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Now';
            }, 2000);
            return;
        }
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing with AI...';

    const prompt = `You are an expert career coach and job analyst. Analyze this job description and return ONLY valid JSON (no markdown formatting, no code blocks) with this exact structure:

{
    "skills": ["top 10-15 technical and soft skills required"],
    "interview": {
        "beginner": [{"q": "basic question", "a": "concise answer"}],
        "intermediate": [{"q": "moderate question", "a": "detailed answer"}],
        "advanced": [{"q": "expert question", "a": "comprehensive answer"}]
    },
    "roadmap": ["8-10 step learning path in order"],
    "projects": [{"name": "project title", "brief": "2-line description"}],
    "resumeTips": ["5-7 ATS-friendly keywords and phrases"],
    "applicationTips": ["5-6 practical tips for applying to this specific role"]
}

Job Description:
${jd}`;

    try {
        console.log('Calling backend API...');
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, isJson: true })
        });

        if (!response.ok) {
            throw new Error(`Backend API failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error('Invalid API response');
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        analysisData = JSON.parse(cleanJson);
        
        responseCache.set(cacheKey, { data: analysisData, timestamp: Date.now() });
        
        renderDashboard();
        analyzeBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Analysis Complete!';
        
        setTimeout(() => {
            analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Now';
        }, 2000);

    } catch (error) {
        console.error('Backend failed:', error);
        alert('AI analysis failed. Please check if Vercel environment variable is set correctly and redeploy.');
    } finally {
        analyzeBtn.disabled = false;
    }
};

function showDefaultMock() {
    analysisData = {
        skills: ['JavaScript', 'React.js', 'Node.js', 'REST APIs', 'Git', 'Agile', 'Problem Solving', 'Communication'],
        interview: {
            beginner: [
                { q: 'What is the difference between let and var?', a: 'let is block-scoped and cannot be redeclared, while var is function-scoped and allows redeclaration. let was introduced in ES6 to solve hoisting issues.' },
                { q: 'Explain React component lifecycle.', a: 'Components mount, update, and unmount. Modern React uses useEffect hook to handle lifecycle events like componentDidMount, componentDidUpdate, and componentWillUnmount.' }
            ],
            intermediate: [
                { q: 'How do you handle state in React?', a: 'Use useState for local state, useContext for global state, or Redux/Zustand for complex state management. Lift state up when multiple components need it.' },
                { q: 'What are REST API best practices?', a: 'Use proper HTTP methods, status codes, pagination, filtering, versioning (/v1/), error handling, and authentication (JWT/OAuth). Always validate input.' }
            ],
            advanced: [
                { q: 'How do you optimize React performance?', a: 'Use React.memo, useMemo, useCallback, lazy loading with React.Suspense, virtualization for lists, code splitting, and avoid inline object creation in render.' },
                { q: 'Explain microservices architecture.', a: 'Break monolith into small, independent services communicating via APIs. Each service owns its data. Use API gateways, message queues, and implement fault tolerance.' }
            ]
        },
        roadmap: ['Master JavaScript fundamentals (2 weeks)', 'Learn React basics - components, props, state (2 weeks)', 'Build 2-3 small React projects (3 weeks)', 'Learn Node.js and REST APIs (2 weeks)', 'Study system design and architecture (2 weeks)', 'Practice DSA problems daily (ongoing)', 'Create portfolio and deploy projects (1 week)', 'Apply to jobs and prepare for interviews (ongoing)'],
        projects: [
            { name: 'Task Management App', brief: 'Build a full-stack app with React, Node.js, and MongoDB. Include CRUD operations, authentication, and real-time updates.' },
            { name: 'Weather Dashboard', brief: 'Create an app using external APIs, implement search, 5-day forecast, and location-based weather with responsive design.' },
            { name: 'E-commerce Cart System', brief: 'Develop shopping cart with add/remove, quantity update, total calculation, and checkout flow using state management.' }
        ],
        resumeTips: ['JavaScript, React.js, Node.js, RESTful APIs, Git/GitHub, Agile/Scrum, Unit Testing, Responsive Design, Performance Optimization, Team Collaboration', 'Add GitHub profile link with 3+ projects', 'Quantify achievements (e.g., "Improved app performance by 40%")', 'Use action verbs: Built, Developed, Implemented, Optimized', 'Include metrics and real numbers wherever possible'],
        applicationTips: ['Customize your resume keywords to match the job description exactly', 'Write a cover letter explaining why you want THIS specific role', 'Include links to live project demos, not just code', 'Follow up after 5-7 days if no response', 'Prepare 3-5 questions to ask the interviewer', 'Research the company before applying']
    };
    renderDashboard();
}

function renderDashboard() {
    dashboard.classList.remove('hidden');
    
    document.getElementById('skillsList').innerHTML = analysisData.skills.map(s => `<span class="tag">${s}</span>`).join('');

    const renderLevel = (level, color, icon) => `
        <div class="interview-level">
            <h4 style="color: ${color}; margin-bottom: 1rem;">
                <i class="${icon}"></i> ${level.toUpperCase()} LEVEL
            </h4>
            ${analysisData.interview[level.toLowerCase()].map((item, i) => `
                <div class="qa-card">
                    <div class="question">Q${i + 1}: ${item.q}</div>
                    <button class="toggle-btn" onclick="toggleAnswer(this)">
                        <i class="fa-solid fa-eye"></i> Show Answer
                    </button>
                    <div class="answer-box hidden">${item.a}</div>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('interviewContent').innerHTML = 
        renderLevel('beginner', '#4ade80', 'fa-seedling') +
        renderLevel('intermediate', '#fbbf24', 'fa-fire') +
        renderLevel('advanced', '#f87171', 'fa-bolt');

    document.getElementById('roadmapList').innerHTML = analysisData.roadmap.map((step, i) => `
        <li class="roadmap-item">
            <div class="step-number">${i + 1}</div>
            <label class="checkbox-container">
                <input type="checkbox" onclick="toggleStep(this)">
                <span class="checkmark"></span>
            </label>
            <div class="roadmap-content">
                <span class="step-text">${step}</span>
                <div class="video-links">
                    <a href="${getVideoLink(step, 'youtube')}" target="_blank" class="video-link youtube">
                        <i class="fa-brands fa-youtube"></i> YouTube
                    </a>
                    <a href="${getVideoLink(step, 'coursera')}" target="_blank" class="video-link coursera">
                        <i class="fa-solid fa-graduation-cap"></i> Coursera
                    </a>
                    <a href="${getVideoLink(step, 'udemy')}" target="_blank" class="video-link udemy">
                        <i class="fa-solid fa-book-open"></i> Udemy
                    </a>
                </div>
            </div>
        </li>
    `).join('');

    document.getElementById('projectsList').innerHTML = analysisData.projects.map(p => `
        <li class="project-card">
            <div class="project-icon">
                <i class="fa-solid fa-rocket"></i>
            </div>
            <div class="project-info">
                <strong>${p.name}</strong>
                <p>${p.brief}</p>
                <div class="project-tags">
                    <span class="tag-small">Full Stack</span>
                    <span class="tag-small">Production Ready</span>
                    <span class="tag-small">Portfolio Worthy</span>
                </div>
            </div>
        </li>
    `).join('');

    document.getElementById('resumeTips').innerHTML = `
        <li class="resume-pattern">
            <i class="fa-solid fa-file-lines"></i>
            <div>
                <strong>Reverse Chronological Format</strong>
                <p>Most recent experience first. Best for ATS systems.</p>
            </div>
        </li>
        <li class="resume-pattern">
            <i class="fa-solid fa-star"></i>
            <div>
                <strong>Accomplishment-Based Bullets</strong>
                <p>Use "Action verb + Task + Result" format</p>
            </div>
        </li>
        <li class="resume-pattern">
            <i class="fa-solid fa-chart-line"></i>
            <div>
                <strong>Quantified Achievements</strong>
                <p>Add metrics: "Improved performance by 40%"</p>
            </div>
        </li>
        <li class="resume-pattern">
            <i class="fa-solid fa-key"></i>
            <div>
                <strong>ATS Keywords Section</strong>
                <p>${analysisData.resumeTips.join(', ')}</p>
            </div>
        </li>
    `;

    document.getElementById('applicationTips').innerHTML = analysisData.applicationTips.map(tip => `
        <li><i class="fa-solid fa-arrow-right"></i> ${tip}</li>
    `).join('');

    dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getVideoLink(step, platform) {
    const keywords = extractKeywords(step);
    
    const links = {
        youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(keywords + ' tutorial complete course')}`,
        coursera: `https://www.coursera.org/search?query=${encodeURIComponent(keywords)}`,
        udemy: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(keywords)}`
    };
    
    return links[platform] || links.youtube;
}

function extractKeywords(step) {
    const stopWords = ['master', 'learn', 'study', 'practice', 'build', 'create', 'develop', 'and', 'the', 'to', 'for', 'with', 'from', 'in', 'on', 'by'];
    const words = step.toLowerCase().replace(/[^a-z\s]/g, '').split(' ');
    const keywords = words.filter(w => !stopWords.includes(w) && w.length > 2);
    return keywords.slice(0, 3).join(' ') || 'programming tutorial';
}

window.toggleAnswer = (btn) => {
    const box = btn.nextElementSibling;
    const isHidden = box.classList.toggle('hidden');
    btn.innerHTML = isHidden ? '<i class="fa-solid fa-eye"></i> Show Answer' : '<i class="fa-solid fa-eye-slash"></i> Hide Answer';
};

window.toggleStep = (checkbox) => {
    const item = checkbox.closest('.roadmap-item');
    item.classList.toggle('completed', checkbox.checked);
};

let recognition = null;
let isInterviewing = false;
let currentQuestionIndex = 0;
let mockQuestions = [];

window.startMockInterview = async () => {
    if (!analysisData) {
        alert('Please analyze a job description first!');
        return;
    }

    isInterviewing = true;
    currentQuestionIndex = 0;
    
    mockQuestions = [
        ...analysisData.interview.beginner.slice(0, 2),
        ...analysisData.interview.intermediate.slice(0, 2),
        ...analysisData.interview.advanced.slice(0, 1)
    ];

    document.getElementById('startInterviewBtn').disabled = true;
    document.getElementById('stopInterviewBtn').disabled = false;
    document.getElementById('questionDisplay').classList.remove('hidden');
    document.getElementById('answerSection').classList.remove('hidden');

    updateInterviewStatus('Starting AI Interview...', 'loading');
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const answer = event.results[0][0].transcript;
            displayUserAnswer(answer);
            analyzeAnswer(answer);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            updateInterviewStatus('Microphone error. Please allow microphone access.', 'error');
        };

        speakQuestion(mockQuestions[0].q);
    } else {
        alert('Speech recognition not supported in this browser. Please use Chrome.');
        stopMockInterview();
    }
};

window.stopMockInterview = () => {
    isInterviewing = false;
    if (recognition) {
        recognition.stop();
    }
    window.speechSynthesis.cancel();
    
    document.getElementById('startInterviewBtn').disabled = false;
    document.getElementById('stopInterviewBtn').disabled = true;
    document.getElementById('questionDisplay').classList.add('hidden');
    document.getElementById('answerSection').classList.add('hidden');
    document.getElementById('userAnswer').classList.add('hidden');
    document.getElementById('aiFeedback').classList.add('hidden');
    
    updateInterviewStatus('Interview stopped. Good luck!', 'success');
};

function speakQuestion(question) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(question);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => {
            updateInterviewStatus('Now speak your answer...', 'listening');
        };
        
        window.speechSynthesis.speak(utterance);
        document.getElementById('currentQuestion').textContent = question;
    }
}

window.startListening = () => {
    if (recognition && isInterviewing) {
        updateInterviewStatus('Listening...', 'listening');
        recognition.start();
    }
};

function displayUserAnswer(answer) {
    const userAnswerDiv = document.getElementById('userAnswer');
    userAnswerDiv.innerHTML = `
        <h4>Your Answer:</h4>
        <p>${answer}</p>
    `;
    userAnswerDiv.classList.remove('hidden');
    updateInterviewStatus('Analyzing your answer...', 'analyzing');
}

async function analyzeAnswer(answer) {
    const question = mockQuestions[currentQuestionIndex];
    
    const analysisPrompt = `Evaluate this interview answer and provide feedback in JSON format:
{
    "score": 1-10,
    "feedback": "constructive feedback",
    "improvements": ["tip1", "tip2"],
    "strengths": ["strength1"]
}

Question: ${question.q}
Expected Answer: ${question.a}
User's Answer: ${answer}`;

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: analysisPrompt, isJson: true })
        });

        if (!response.ok) {
            throw new Error(`API failed: ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const feedback = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());

        displayFeedback(feedback);
        
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < mockQuestions.length && isInterviewing) {
                speakQuestion(mockQuestions[currentQuestionIndex].q);
                document.getElementById('userAnswer').classList.add('hidden');
                document.getElementById('aiFeedback').classList.add('hidden');
            } else if (isInterviewing) {
                updateInterviewStatus('Interview Complete! Great job!', 'success');
                stopMockInterview();
            }
        }, 3000);

    } catch (error) {
        console.error('Feedback analysis error:', error);
        updateInterviewStatus('Feedback analysis failed. Continuing...', 'warning');
    }
}

function displayFeedback(feedback) {
    const feedbackDiv = document.getElementById('aiFeedback');
    feedbackDiv.innerHTML = `
        <h4>AI Feedback:</h4>
        <div class="score-badge">Score: ${feedback.score}/10</div>
        <p><strong>Feedback:</strong> ${feedback.feedback}</p>
        <p><strong>Strengths:</strong> ${feedback.strengths.join(', ')}</p>
        <p><strong>Improvements:</strong> ${feedback.improvements.join(', ')}</p>
    `;
    feedbackDiv.classList.remove('hidden');
    updateInterviewStatus('Answer analyzed!', 'success');
}

function updateInterviewStatus(message, type) {
    const statusDiv = document.getElementById('interviewStatus');
    statusDiv.innerHTML = message;
    statusDiv.className = `interview-status status-${type}`;
}

function createParticles() {
    const container = document.getElementById('bgAnimation');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.width = Math.random() * 50 + 10 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = Math.random() * 10 + 15 + 's';
        container.appendChild(particle);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('AI Job Analyzer Ready - Use anywhere in the world!');
    createParticles();
});