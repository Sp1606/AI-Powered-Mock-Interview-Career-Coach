/**
 * IntervAI: Core Application Orchestration & State Management
 * Handles routing, chat interface, sandbox code execution, voice synthesis/recognition,
 * and performance scorecard rendering.
 */

const app = {
  // Application State
  state: {
    currentScreen: 'dashboard',
    selectedRole: 'flutter',
    selectedLevel: 'Junior',
    selectedCompany: 'Big Tech / FAANG',
    includeCoding: true,
    
    // Active Interview State
    isInterviewActive: false,
    currentQuestionIndex: 0,
    conversationHistory: [], // { role: 'interviewer'|'user', content: '', code: '' }
    interviewTimerInterval: null,
    interviewSeconds: 0,

    // AI Career Coach State
    coachConversationHistory: [], // { role: 'coach'|'user', content: '' }
    isCoachInitialized: false,
    
    // Voice Settings
    voiceTTSActive: false,
    speechRecognitionActive: false,
    recognitionInstance: null,
    
    // Resume Scanner State
    parsedSkills: [],
    resumeText: "",
    
    // Statistics
    stats: {
      sessionsCompleted: 0,
      avgScore: 0,
      highestScore: 0,
      history: []
    }
  },

  // Initialize App
  async init() {
    console.log("IntervAI initializing...");
    this.loadStats();
    this.updateStatsUI();
    
    // Load local environment key on startup
    await this.loadEnvKey();
    
    this.checkApiStatus();
    
    // Auto-select initial role UI
    const defaultRoleCard = document.querySelector('.role-select-card');
    if (defaultRoleCard) defaultRoleCard.classList.add('selected');
    
    // Set up text editor tab listener
    this.setupEditorSync();
    
    // Initialize Web Speech Recognition if available
    this.initSpeechRecognition();
  },

  // Load API key from local .env file dynamically if present
  async loadEnvKey() {
    try {
      const response = await fetch('.env');
      if (response.ok) {
        const text = await response.text();
        const match = text.match(/GEMINI_API_KEY\s*=\s*(.*)/);
        if (match && match[1]) {
          const key = match[1].trim().replace(/['"]/g, '');
          if (key && (key.startsWith('AIzaSy') || key.startsWith('AQ.'))) {
            AIService.saveApiKey(key);
            console.log("Gemini API Key successfully loaded from local .env config.");
          }
        }
      }
    } catch (e) {
      console.log("Unable to load .env file dynamically:", e);
    }
  },

  // Routing System
  switchScreen(screenId) {
    // Hide all sections
    document.querySelectorAll('.screen-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(el => el.classList.remove('active'));
    
    // Show target section
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) targetScreen.classList.add('active');
    
    // Active navigation tab
    const navItem = document.getElementById(`nav-${screenId}`);
    if (navItem) navItem.classList.add('active');
    
    // Update headers
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    
    this.state.currentScreen = screenId;
    
    switch(screenId) {
      case 'dashboard':
        titleEl.textContent = 'Interview Dashboard';
        subtitleEl.textContent = 'Configure your mock session and start training';
        break;
      case 'resume':
        titleEl.textContent = 'Resume Scanner';
        subtitleEl.textContent = 'Tailor mock questions to your actual project history';
        break;
      case 'interview':
        titleEl.textContent = 'Active Interview Workspace';
        subtitleEl.textContent = 'Practice coding and answer technical questions';
        break;
      case 'report':
        titleEl.textContent = 'Performance Scorecard';
        subtitleEl.textContent = 'Recruiter feedback and detailed question evaluation';
        break;
      case 'settings':
        titleEl.textContent = 'API Settings';
        subtitleEl.textContent = 'Configure LLM model details and Google Gemini keys';
        break;
      case 'coach':
        titleEl.textContent = 'AI Career Coach';
        subtitleEl.textContent = 'Ask career questions, get roadmap advice, or resume reviews';
        this.initCoach();
        break;
    }
  },

  // API Configuration Status
  checkApiStatus() {
    const isLive = AIService.isLive();
    const indicator = document.getElementById('header-status-indicator');
    const text = document.getElementById('header-status-text');
    const badgeText = document.getElementById('api-status-text');
    
    if (isLive) {
      indicator.classList.add('connected');
      text.textContent = 'Live AI Mode (Gemini)';
      badgeText.textContent = 'Connected (Gemini)';
      badgeText.style.color = 'var(--color-emerald)';
    } else {
      indicator.classList.remove('connected');
      text.textContent = 'Offline Simulator';
      badgeText.textContent = 'Offline Demo';
      badgeText.style.color = 'var(--text-secondary)';
    }
  },

  // Save API key from settings
  saveApiKey() {
    const keyInput = document.getElementById('settings-gemini-key');
    const key = keyInput.value.trim();
    
    if (!key) {
      alert("Please enter a valid key.");
      return;
    }
    
    AIService.saveApiKey(key);
    
    // Also save model selection
    const selectedModel = document.querySelector('input[name="model"]:checked')?.value || 'gemini-1.5-flash';
    AIService.saveModel(selectedModel);
    
    this.checkApiStatus();
    alert("Gemini settings saved successfully!");
  },

  clearApiKey() {
    AIService.clearApiKey();
    document.getElementById('settings-gemini-key').value = '';
    this.checkApiStatus();
    alert("Gemini settings cleared. App reset to Offline Simulator.");
  },

  async testApiKeyConnection() {
    const isLive = AIService.isLive();
    if (!isLive) {
      alert("No valid API Key detected. Please save a key starting with 'AIzaSy' or 'AQ.'.");
      return;
    }
    
    this.showLoading("Testing Connection", "Sending test message to Gemini API...");
    
    try {
      const response = await AIService.callGemini(
        "You are a helpful assistant.", 
        [{ role: 'user', content: 'Say Connection Successful in 2 words.' }]
      );
      this.hideLoading();
      alert(`API Response: ${response.trim()}`);
    } catch (e) {
      this.hideLoading();
      alert(`Connection failed: ${e.message}\nCheck your internet or key status.`);
    }
  },

  // Config Role Cards selection
  selectRole(role, element) {
    document.querySelectorAll('.role-select-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    this.state.selectedRole = role;
  },

  // Sync editor font layout
  setupEditorSync() {
    const textarea = document.getElementById('editor-textarea');
    const lineNumbers = document.getElementById('editor-line-numbers');
    
    textarea.addEventListener('input', () => {
      const lines = textarea.value.split('\n').length;
      let lineNumsHTML = '';
      for (let i = 1; i <= Math.max(lines, 18); i++) {
        lineNumsHTML += `${i}<br>`;
      }
      lineNumbers.innerHTML = lineNumsHTML;
    });

    // Handle tab key in editor
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        textarea.dispatchEvent(new Event('input'));
      }
    });
  },

  // Voice TTS (Text-to-speech) using web APIs
  toggleVoiceTTS() {
    this.state.voiceTTSActive = !this.state.voiceTTSActive;
    const btn = document.getElementById('voice-tts-btn');
    
    if (this.state.voiceTTSActive) {
      btn.classList.add('active');
      this.speak("Voice guidance enabled.");
    } else {
      btn.classList.remove('active');
      window.speechSynthesis.cancel();
    }
  },

  speak(text) {
    if (!this.state.voiceTTSActive) return;
    
    window.speechSynthesis.cancel(); // stop current speak
    
    // Clean text from code blocks for cleaner audio
    const cleanText = text.replace(/```[\s\S]*?```/g, "[Code snippet written on screen]");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    
    // Choose a standard English voice
    const voices = window.speechSynthesis.getVoices();
    const engVoice = voices.find(voice => voice.lang.includes('en-US') || voice.lang.includes('en-GB'));
    if (engVoice) utterance.voice = engVoice;
    
    window.speechSynthesis.speak(utterance);
  },

  // Speech Recognition (Speech-to-text) using webkits
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      document.getElementById('mic-toggle-btn').style.display = 'none';
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      this.state.speechRecognitionActive = true;
      document.getElementById('mic-toggle-btn').classList.add('active');
      document.getElementById('chat-input-box').placeholder = "Listening... speak now.";
    };
    
    recognition.onend = () => {
      this.state.speechRecognitionActive = false;
      document.getElementById('mic-toggle-btn').classList.remove('active');
      document.getElementById('chat-input-box').placeholder = "Type your response here...";
    };
    
    recognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      const input = document.getElementById('chat-input-box');
      input.value += (input.value ? ' ' : '') + resultText;
      input.dispatchEvent(new Event('input'));
    };
    
    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      this.state.speechRecognitionActive = false;
      document.getElementById('mic-toggle-btn').classList.remove('active');
    };
    
    this.state.recognitionInstance = recognition;
  },

  toggleSpeechRecognition() {
    if (!this.state.recognitionInstance) return;
    
    if (this.state.speechRecognitionActive) {
      this.state.recognitionInstance.stop();
    } else {
      this.state.recognitionInstance.start();
    }
  },

  // Resume Analyzer
  analyzeResumeDebounced() {
    clearTimeout(this.state.resumeTimeout);
    this.state.resumeTimeout = setTimeout(() => this.analyzeResume(), 500);
  },

  async analyzeResume() {
    const text = document.getElementById('resume-text-input').value;
    if (!text.trim()) {
      document.getElementById('resume-analysis-output').style.display = 'none';
      return;
    }
    
    this.state.resumeText = text;
    const isLive = AIService.isLive();
    
    // Clear strengths and improvements lists
    document.getElementById('resume-analysis-strengths').innerHTML = '';
    document.getElementById('resume-analysis-improvements').innerHTML = '';
    document.getElementById('resume-analysis-summary').textContent = 'Analyzing...';
    document.getElementById('resume-analysis-role').textContent = 'Analyzing...';
    
    if (isLive) {
      document.getElementById('resume-analysis-output').style.display = 'block';
      try {
        const analysis = await AIService.analyzeLiveResume(text);
        
        // Populate detected skills
        this.state.parsedSkills = analysis.skills || [];
        const tagsContainer = document.getElementById('resume-skills-tags');
        tagsContainer.innerHTML = '';
        this.state.parsedSkills.forEach(skill => {
          const span = document.createElement('div');
          span.className = 'skill-tag';
          span.innerHTML = `${skill} <button onclick="app.removeParsedSkill('${skill}', this)">×</button>`;
          tagsContainer.appendChild(span);
        });
        
        // Populate profile summary and recommended role
        document.getElementById('resume-analysis-summary').textContent = analysis.profileSummary || "";
        document.getElementById('resume-analysis-role').textContent = analysis.suggestedRole || "";
        
        // Populate strengths
        const strengthsList = document.getElementById('resume-analysis-strengths');
        (analysis.strengths || []).forEach(str => {
          const li = document.createElement('li');
          li.textContent = str;
          strengthsList.appendChild(li);
        });
        
        // Populate improvements
        const improvementsList = document.getElementById('resume-analysis-improvements');
        (analysis.improvements || []).forEach(imp => {
          const li = document.createElement('li');
          li.textContent = imp;
          improvementsList.appendChild(li);
        });
        
      } catch (e) {
        console.error("Live resume scan error:", e);
        document.getElementById('resume-analysis-summary').textContent = "Failed to run live parsing. Using offline keyword scanner.";
        this.runOfflineResumeScan(text);
      }
    } else {
      this.runOfflineResumeScan(text);
    }
  },

  runOfflineResumeScan(text) {
    // Mock parsing matching keyword lists
    const skillsList = [
      'Flutter', 'Dart', 'BLoC', 'Riverpod', 'Provider', 'SQLite', 'Firebase', 'State Management',
      'Python', 'Machine Learning', 'Data Science', 'Numpy', 'Pandas', 'Scikit-Learn', 'Matplotlib',
      'Seaborn', 'K-Means', 'PCA', 'KNN', 'OpenCV', 'React', 'Node.js', 'SQL', 'MongoDB', 'REST APIs',
      'Express', 'JavaScript', 'HTML', 'CSS', 'Vite', 'SpeechRecognition', 'Transformers', 'Kivy'
    ];
    
    const detected = [];
    const lowerText = text.toLowerCase();
    
    skillsList.forEach(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerText)) {
        detected.push(skill);
      }
    });
    
    this.state.parsedSkills = detected;
    
    const tagsContainer = document.getElementById('resume-skills-tags');
    tagsContainer.innerHTML = '';
    
    if (detected.length > 0) {
      detected.forEach(skill => {
        const span = document.createElement('div');
        span.className = 'skill-tag';
        span.innerHTML = `${skill} <button onclick="app.removeParsedSkill('${skill}', this)">×</button>`;
        tagsContainer.appendChild(span);
      });
      document.getElementById('resume-analysis-output').style.display = 'block';
    } else {
      tagsContainer.innerHTML = '<p style="font-size:12px; color:var(--text-tertiary);">No specific framework matches detected. Type your key skills in details.</p>';
      document.getElementById('resume-analysis-output').style.display = 'block';
    }
    
    document.getElementById('resume-analysis-summary').textContent = "Extracted profile keywords using offline directory indexing.";
    document.getElementById('resume-analysis-role').textContent = detected.includes('Flutter') ? "Flutter Developer" : (detected.includes('Python') ? "Python / ML Engineer" : "Full-Stack Engineer");
    
    const strengthsList = document.getElementById('resume-analysis-strengths');
    strengthsList.innerHTML = '<li>Quantified profile highlights detected</li><li>Clean skills classification tags</li>';
    
    const improvementsList = document.getElementById('resume-analysis-improvements');
    improvementsList.innerHTML = '<li>Add specific metrics to project achievements</li><li>Configure Gemini key to enable full layout reviews</li>';
  },

  removeParsedSkill(skill, element) {
    this.state.parsedSkills = this.state.parsedSkills.filter(s => s !== skill);
    element.parentElement.remove();
  },

  handleResumeFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('resume-text-input').value = e.target.result;
      this.analyzeResume();
    };
    reader.readAsText(file);
  },

  // Start standard interview config
  startInterview() {
    this.state.selectedLevel = document.querySelector('input[name="level"]:checked')?.value || 'Junior';
    this.state.selectedCompany = document.querySelector('input[name="company"]:checked')?.value || 'Big Tech / FAANG';
    this.state.includeCoding = document.getElementById('include-coding').checked;
    
    this.showLoading("Initializing Interview", "Preparing role questions and setting up workspace...");
    
    setTimeout(() => {
      this.setupInterviewWorkspace();
      this.hideLoading();
      this.switchScreen('interview');
    }, 1500);
  },

  startResumeTailoredInterview() {
    this.state.selectedLevel = 'Mid-Level';
    this.state.selectedCompany = 'Early Stage Startup';
    this.state.includeCoding = true;
    
    if (!this.state.resumeText) {
      alert("Please paste or upload your resume first!");
      return;
    }
    
    this.showLoading("Analyzing Profile", "Extracting projects and tailoring custom questions...");
    
    setTimeout(() => {
      this.setupInterviewWorkspace(true);
      this.hideLoading();
      this.switchScreen('interview');
    }, 1800);
  },

  // Setup actual screen variables
  setupInterviewWorkspace(isResumeTailored = false) {
    this.state.isInterviewActive = true;
    this.state.currentQuestionIndex = 0;
    this.state.conversationHistory = [];
    this.state.interviewSeconds = 0;
    
    // Clear chat display
    document.getElementById('chat-messages-container').innerHTML = '';
    
    // Configure Editor Layout
    const idePane = document.getElementById('ide-pane');
    const workspaceGrid = document.getElementById('interview-workspace-grid');
    
    if (this.state.includeCoding) {
      idePane.style.display = 'flex';
      workspaceGrid.style.gridTemplateColumns = '4fr 5fr';
    } else {
      idePane.style.display = 'none';
      workspaceGrid.style.gridTemplateColumns = '1fr';
    }
    
    // Display metadata
    const roleData = AIService.offlineData[this.state.selectedRole];
    document.getElementById('interviewer-name-label').textContent = roleData.interviewer;
    document.getElementById('interviewer-level-label').textContent = `${this.state.selectedLevel} - ${this.state.selectedCompany}`;
    
    // Set Editor filenames and starter codes
    const codingQ = roleData.questions.find(q => q.type === 'coding');
    if (codingQ) {
      document.getElementById('tab-filename-label').textContent = codingQ.filename;
      
      const langIcon = document.getElementById('tab-lang-icon');
      if (codingQ.language === 'python') { langIcon.textContent = '🐍'; langIcon.className = 'editor-tab-icon python'; }
      else if (codingQ.language === 'dart') { langIcon.textContent = '📱'; langIcon.className = 'editor-tab-icon dart'; }
      else { langIcon.textContent = '💻'; langIcon.className = 'editor-tab-icon js'; }
      
      document.getElementById('editor-textarea').value = codingQ.starterCode;
      document.getElementById('editor-textarea').dispatchEvent(new Event('input'));
      document.getElementById('ide-difficulty-label').textContent = this.state.selectedLevel;
    }
    
    // Start timers
    this.startTimer();
    
    // Trigger First question
    this.triggerNextQuestion(isResumeTailored);
  },

  startTimer() {
    clearInterval(this.state.interviewTimerInterval);
    const timerBox = document.getElementById('interview-timer');
    const ideTimer = document.getElementById('ide-timer-label');
    
    this.state.interviewTimerInterval = setInterval(() => {
      this.state.interviewSeconds++;
      const mins = Math.floor(this.state.interviewSeconds / 60).toString().padStart(2, '0');
      const secs = (this.state.interviewSeconds % 60).toString().padStart(2, '0');
      const timeStr = `${mins}:${secs}`;
      
      timerBox.textContent = timeStr;
      if (ideTimer) ideTimer.textContent = timeStr;
      
      // Warning status after 20 minutes
      if (this.state.interviewSeconds > 1200) {
        timerBox.classList.add('warning');
      } else {
        timerBox.classList.remove('warning');
      }
    }, 1000);
  },

  // Main chat orchestrator: interviewer questions
  async triggerNextQuestion(isResumeTailored = false) {
    const isLive = AIService.isLive();
    const role = this.state.selectedRole;
    const level = this.state.selectedLevel;
    const company = this.state.selectedCompany;
    const index = this.state.currentQuestionIndex;
    
    this.showTypingIndicator();
    
    try {
      let questionText = "";
      
      if (isLive) {
        // CALL LIVE GEMINI INTERVIEW PROMPT
        const system = AIService.getSystemInstructionForInterview(
          role, level, company, this.state.includeCoding, isResumeTailored ? this.state.resumeText : ""
        );
        
        // We append instructions asking for the next logical question
        const history = [...this.state.conversationHistory];
        history.push({ role: 'user', content: `Send Question ${index + 1}. Continue interview structure.` });
        
        questionText = await AIService.callGemini(system, history);
      } else {
        // Fallback to Offline Simulator
        const roleData = AIService.offlineData[role];
        const questionObj = roleData.questions[index];
        
        if (questionObj) {
          questionText = questionObj.question;
          
          // Tailor first question to resume projects dynamically
          if (index === 0 && isResumeTailored && this.state.parsedSkills.length > 0) {
            questionText = `Hi! I reviewed your profile showing experience with ${this.state.parsedSkills.slice(0, 3).join(', ')}. ` +
              `Let's start by discussing a project from your resume where you integrated ${this.state.parsedSkills[0]}. What were the main database or layout hurdles you faced?`;
          }
        } else {
          // Finished standard list
          this.hideTypingIndicator();
          this.finishInterview();
          return;
        }
      }
      
      this.hideTypingIndicator();
      this.addMessage('interviewer', questionText);
      this.speak(questionText);
      
      // Update history state
      this.state.conversationHistory.push({ role: 'interviewer', content: questionText });
      
    } catch(e) {
      console.error("Next question fetch failed:", e);
      this.hideTypingIndicator();
      this.addMessage('interviewer', "My apologies, I had an issue connecting. Let's resume. Tell me more about your experience.");
    }
  },

  // Submit User response
  async submitUserResponse() {
    const inputBox = document.getElementById('chat-input-box');
    const content = inputBox.value.trim();
    const codeContent = this.state.includeCoding ? document.getElementById('editor-textarea').value : "";
    
    if (!content && !codeContent) return;
    
    // Add user message to UI
    this.addMessage('user', content || "[Submitted Code Solution]");
    inputBox.value = '';
    
    // Append to history
    this.state.conversationHistory.push({ 
      role: 'user', 
      content: content,
      code: codeContent 
    });
    
    // Increment question index
    this.state.currentQuestionIndex++;
    
    // If completed 3 questions, wrap up
    if (this.state.currentQuestionIndex >= 3) {
      this.showTypingIndicator();
      setTimeout(() => {
        this.hideTypingIndicator();
        this.addMessage('interviewer', "Thank you so much. I have collected all the responses and code variables. Let's finalize your feedback report.");
        // Enable a small floating screen finish button glow
      }, 1000);
    } else {
      // Trigger next question
      this.triggerNextQuestion(this.state.parsedSkills.length > 0);
    }
  },

  handleChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.submitUserResponse();
    }
  },

  // Code Sandbox runner
  runCode() {
    const consoleBox = document.getElementById('console-output-box');
    const statusPill = document.getElementById('console-status-pill');
    const code = document.getElementById('editor-textarea').value;
    const role = this.state.selectedRole;
    
    consoleBox.className = 'console-output';
    statusPill.textContent = 'Executing...';
    consoleBox.textContent = 'Running tests...';
    
    setTimeout(() => {
      // Mock code output checks based on role
      const roleData = AIService.offlineData[role];
      const codingQ = roleData.questions.find(q => q.type === 'coding');
      
      if (!codingQ) {
        consoleBox.textContent = '> Mock sandbox executed successfully.';
        statusPill.textContent = 'Idle';
        return;
      }
      
      // Sandbox Evaluator
      if (codingQ.language === 'javascript') {
        // We can safely execute simple Javascript in browser for test
        try {
          // Capture logs
          let output = '';
          const customConsole = {
            log: (...args) => { output += args.join(' ') + '\n'; },
            error: (...args) => { output += 'ERROR: ' + args.join(' ') + '\n'; }
          };
          
          // Simple test script execution
          const testRunner = new Function('console', `
            try {
              ${code}
              ${codingQ.testCode || ''}
              if (typeof runTests === 'function') runTests();
            } catch(e) {
              console.error(e.message);
            }
          `);
          
          testRunner(customConsole);
          
          consoleBox.textContent = output || "> Program finished with exit code 0.";
          if (output.includes("TEST_SUCCESS")) {
            consoleBox.classList.add('success');
            statusPill.textContent = 'Tests Passed';
          } else {
            statusPill.textContent = 'Running Completed';
          }
        } catch(err) {
          consoleBox.classList.add('error');
          consoleBox.textContent = `Syntax Error: ${err.message}`;
          statusPill.textContent = 'Error';
        }
      } 
      else if (codingQ.language === 'python') {
        // Python sandbox simulation
        const lowerCode = code.toLowerCase();
        let logs = "> python main.py\n";
        
        const hasEuclidean = lowerCode.includes("def euclidean_distance");
        const isVectorized = lowerCode.includes("np.linalg.norm") || 
                             (lowerCode.includes("np.sqrt") && lowerCode.includes("np.sum")) ||
                             (lowerCode.includes("**0.5") && lowerCode.includes("np.sum"));
                             
        if (hasEuclidean && isVectorized) {
          logs += "5.0\n\nTEST_SUCCESS: NumPy vectorized calculations matched reference constraints.";
          consoleBox.classList.add('success');
          statusPill.textContent = 'Tests Passed';
        } else if (hasEuclidean) {
          logs += "5.0\n\nWARNING: Vectorized arrays not fully implemented. Python loop check failed.";
          statusPill.textContent = 'Warning';
        } else {
          logs += "NameError: name 'euclidean_distance' is not defined on line 12";
          consoleBox.classList.add('error');
          statusPill.textContent = 'Failed';
        }
        consoleBox.textContent = logs;
      } 
      else if (codingQ.language === 'dart') {
        // Dart extension simulation
        const lowerCode = code.toLowerCase();
        let logs = "> dart safe_list.dart\n";
        
        const hasExtension = /extension\s+\w+\s+on\s+List/.test(lowerCode);
        const hasSafeGet = lowerCode.includes("safeget") && lowerCode.includes("null");
        
        if (hasExtension && hasSafeGet) {
          logs += "20\nnull\n\nTEST_SUCCESS: safeGet bounds checks verified.";
          consoleBox.classList.add('success');
          statusPill.textContent = 'Tests Passed';
        } else {
          logs += "Compilation Error: list.safeGet is not defined for type List<int>";
          consoleBox.classList.add('error');
          statusPill.textContent = 'Failed';
        }
        consoleBox.textContent = logs;
      }
      else if (codingQ.language === 'sql') {
        // SQL query simulation
        const lowerCode = code.toLowerCase();
        let logs = "> EXPLAIN ANALYZE SELECT ...\n";
        
        if ((lowerCode.includes("dense_rank") || lowerCode.includes("rank")) && lowerCode.includes("over")) {
          logs += "+-------------+-------------+---------------+\n";
          logs += "| customer_id | total_spent | customer_rank |\n";
          logs += "+-------------+-------------+---------------+\n";
          logs += "|         105 |      450.00 |             1 |\n";
          logs += "|         102 |      320.50 |             2 |\n";
          logs += "|         101 |      150.00 |             3 |\n";
          logs += "+-------------+-------------+---------------+\n";
          logs += "\nTEST_SUCCESS: SQL window function ranking query executed successfully with 3 rows.";
          consoleBox.classList.add('success');
          statusPill.textContent = 'Query Success';
        } else {
          logs += "SQL Error: Missing window function logic (DENSE_RANK() or RANK() OVER ...) in the query selection.";
          consoleBox.classList.add('error');
          statusPill.textContent = 'Query Failed';
        }
        consoleBox.textContent = logs;
      }
      else {
        // Fallback
        consoleBox.textContent = "> Code compiled and executed successfully.";
        statusPill.textContent = 'Idle';
      }
    }, 1000);
  },

  requestHint() {
    const role = this.state.selectedRole;
    const index = Math.min(this.state.currentQuestionIndex, 2);
    const roleData = AIService.offlineData[role];
    const questionObj = roleData.questions[index];
    
    if (questionObj && questionObj.hints) {
      const hintPopup = document.getElementById('hint-popup-box');
      const hintBody = document.getElementById('hint-popup-body');
      
      const randomHint = questionObj.hints[Math.floor(Math.random() * questionObj.hints.length)];
      hintBody.textContent = randomHint;
      
      hintPopup.style.display = 'block';
    }
  },

  finishInterviewPrompt() {
    if (confirm("Are you sure you want to finish the interview and submit your answers for evaluation?")) {
      this.finishInterview();
    }
  },

  // Final evaluation generator
  async finishInterview() {
    clearInterval(this.state.interviewTimerInterval);
    this.state.isInterviewActive = false;
    
    this.showLoading("Evaluating Performance", "Analyzing code efficiency, communication depth, and logic accuracy...");
    
    const isLive = AIService.isLive();
    const role = this.state.selectedRole;
    const level = this.state.selectedLevel;
    const company = this.state.selectedCompany;
    const history = this.state.conversationHistory;
    
    try {
      let reportData = null;
      
      if (isLive) {
        // CALL LIVE GEMINI EVALUATION ENGINE
        reportData = await AIService.generateLiveEvaluation(role, level, company, history);
      } else {
        // Fallback to Smart Local Evaluator
        reportData = this.generateMockReportData(role, level, company, history);
      }
      
      this.renderReport(reportData);
      
      // Update persistent stats
      this.saveSessionToStats(role, reportData.overallScore);
      
      this.hideLoading();
      this.switchScreen('report');
      
    } catch(e) {
      console.error("Evaluation failed:", e);
      this.hideLoading();
      alert("Failed to compile score metrics. Loading mock data report instead.");
      const mockReport = this.generateMockReportData(role, level, company, history);
      this.renderReport(mockReport);
      this.switchScreen('report');
    }
  },

  // Smart regex-based score generator for offline runs
  generateMockReportData(role, level, company, history) {
    const roleData = AIService.offlineData[role];
    
    // Evaluate based on actual response lengths and keyword presence
    let logicScore = 6;
    let approachScore = 6;
    let systemScore = 6;
    let commScore = 6;
    
    // Simple checks
    history.forEach(turn => {
      if (turn.role === 'user') {
        const text = turn.content || "";
        const code = turn.code || "";
        
        // Behavioral question word count evaluation
        if (text.split(' ').length > 40) commScore = Math.min(commScore + 1.5, 10);
        if (text.split(' ').length > 80) commScore = Math.min(commScore + 1.5, 10);
        
        // Check technical keywords based on role
        if (role === 'flutter') {
          if (text.includes("Riverpod") || text.includes("BLoC") || text.includes("Provider")) approachScore = Math.min(approachScore + 1.5, 10);
          if (text.includes("const") || text.includes("rebuild") || text.includes("DevTools")) systemScore = Math.min(systemScore + 1.5, 10);
          if (code.includes("safeGet") && code.includes("null") && code.includes("index")) logicScore = Math.min(logicScore + 3, 10);
        }
        if (role === 'python-ml') {
          if (text.includes("StandardScaler") || text.includes("validation")) approachScore = Math.min(approachScore + 1.5, 10);
          if (text.includes("eigenvalues") || text.includes("covariance")) systemScore = Math.min(systemScore + 1.5, 10);
          if (code.includes("np.sqrt") && code.includes("np.sum")) logicScore = Math.min(logicScore + 3, 10);
        }
        if (role === 'fullstack') {
          if (text.includes("index") || text.includes("Redis") || text.includes("caching")) approachScore = Math.min(approachScore + 1.5, 10);
          if (text.includes("PostgreSQL") || text.includes("MongoDB")) systemScore = Math.min(systemScore + 1.5, 10);
          if (code.includes("clientRequests") && code.includes("filter")) logicScore = Math.min(logicScore + 3, 10);
        }
        if (role === 'data-analyst') {
          if (text.includes("impute") || text.includes("Z-score") || text.includes("outliers")) approachScore = Math.min(approachScore + 1.5, 10);
          if (text.includes("PostgreSQL") || text.includes("ACID")) systemScore = Math.min(systemScore + 1.5, 10);
          if (code.includes("DENSE_RANK") || code.includes("OVER")) logicScore = Math.min(logicScore + 3, 10);
        }
      }
    });

    // Make scores integer
    logicScore = Math.round(logicScore);
    approachScore = Math.round(approachScore);
    systemScore = Math.round(systemScore);
    commScore = Math.round(commScore);
    
    const overallScore = Math.round((logicScore + approachScore + systemScore + commScore) * 2.5);
    
    let verdict = "Needs Practice";
    let verdictDesc = "Keep reviewing technical foundations. Focus on optimization and design patterns.";
    
    if (overallScore >= 85) {
      verdict = "Highly Recommended";
      verdictDesc = `Outstanding interview performance! Your design decisions align with industry best practices for a ${level} ${roleData.title}.`;
    } else if (overallScore >= 70) {
      verdict = "Strong Candidate";
      verdictDesc = `You demonstrated solid logic and communications. With slight improvements in code optimization, you are ready for a ${level} role.`;
    } else if (overallScore >= 50) {
      verdict = "Needs Refinement";
      verdictDesc = "You have standard core capabilities but had minor issues with code tests and deep system definitions.";
    }
    
    const reportsQuestions = roleData.questions.map((q, i) => {
      const userTurn = history.find((h, idx) => h.role === 'user' && idx === (i * 2 + 1)) || { content: "No answer", code: "" };
      const qScore = Math.round((overallScore / 10) - (Math.random() * 1.5));
      
      return {
        question: q.question,
        answer: userTurn.content + (userTurn.code ? `\n\nCode Submitted:\n${userTurn.code}` : ""),
        score: Math.max(Math.min(qScore, 10), 4),
        strengths: q.evalTemplate.strengths,
        suggestions: q.evalTemplate.suggestions,
        solution: q.evalTemplate.solution
      };
    });
    
    return {
      overallScore,
      verdict,
      verdictDesc,
      competencies: {
        logic: logicScore,
        approach: approachScore,
        system: systemScore,
        communication: commScore
      },
      questions: reportsQuestions
    };
  },

  // Render score card graphics
  renderReport(data) {
    // 1. Overall Circle anim
    document.getElementById('report-overall-score').textContent = `${data.overallScore}%`;
    document.getElementById('report-verdict-title').textContent = data.verdict;
    document.getElementById('report-verdict-desc').textContent = data.verdictDesc;
    
    // SVG stroke dashoffset calculation: 440 * (1 - score/100)
    const circle = document.getElementById('report-overall-circle');
    const offset = 440 * (1 - data.overallScore / 100);
    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 100);
    
    // 2. Bar competency ratings
    const competencies = [
      { key: 'logic', name: 'Logic' },
      { key: 'approach', name: 'Approach' },
      { key: 'system', name: 'System' },
      { key: 'comm', name: 'Communication' }
    ];
    
    // Map JSON competency keys correctly
    const scoresMap = {
      logic: data.competencies.logic,
      approach: data.competencies.approach,
      system: data.competencies.system,
      comm: data.competencies.communication
    };
    
    competencies.forEach(comp => {
      const val = scoresMap[comp.key];
      document.getElementById(`score-cat-${comp.key}`).textContent = `${val}/10`;
      
      const fillBar = document.getElementById(`bar-cat-${comp.key}`);
      setTimeout(() => {
        fillBar.style.width = `${val * 10}%`;
      }, 300);
    });
    
    // 3. Question breakdown details
    const container = document.getElementById('eval-questions-list-container');
    container.innerHTML = '';
    
    data.questions.forEach((q, i) => {
      const card = document.createElement('div');
      card.className = `eval-question-card ${i === 0 ? 'open' : ''}`;
      
      let statusClass = 'success';
      let statusIcon = '✓';
      if (q.score < 5) { statusClass = 'danger'; statusIcon = '×'; }
      else if (q.score < 8) { statusClass = 'warning'; statusIcon = '⚠'; }
      
      card.innerHTML = `
        <div class="eval-card-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="eval-card-title">
            <span class="eval-status-icon ${statusClass}">${statusIcon}</span>
            <span>Question ${i + 1}: ${q.question.substring(0, 50)}...</span>
          </div>
          <span class="eval-card-score">${q.score}/10</span>
        </div>
        <div class="eval-card-body">
          <div class="eval-section">
            <span class="eval-section-title">Submitted Answer</span>
            <div class="eval-section-content"><pre>${q.answer}</pre></div>
          </div>
          <div class="eval-section">
            <span class="eval-section-title">Key Strengths</span>
            <div class="eval-section-content pro">${q.strengths}</div>
          </div>
          <div class="eval-section">
            <span class="eval-section-title">Improvement Suggestions</span>
            <div class="eval-section-content con">${q.suggestions}</div>
          </div>
          <div class="eval-section">
            <span class="eval-section-title">Model Answer Guide</span>
            <div class="eval-section-content"><pre>${q.solution}</pre></div>
          </div>
        </div>
      `;
      
      container.appendChild(card);
    });
  },

  // Helper displays
  addMessage(role, text) {
    const container = document.getElementById('chat-messages-container');
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${role}`;
    
    const icon = role === 'interviewer' ? '🤖' : '👤';
    
    bubble.innerHTML = `
      <div class="msg-icon">${icon}</div>
      <div class="msg-content">${this.parseMarkdown(text)}</div>
    `;
    
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  showTypingIndicator() {
    const container = document.getElementById('chat-messages-container');
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble interviewer';
    bubble.id = 'typing-indicator-bubble';
    
    bubble.innerHTML = `
      <div class="msg-icon">🤖</div>
      <div class="msg-content">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  hideTypingIndicator() {
    const el = document.getElementById('typing-indicator-bubble');
    if (el) el.remove();
  },

  showLoading(title, desc) {
    document.getElementById('loading-modal-title').textContent = title;
    document.getElementById('loading-modal-desc').textContent = desc;
    document.getElementById('loading-modal').classList.add('active');
  },

  hideLoading() {
    document.getElementById('loading-modal').classList.remove('active');
  },

  escapeHTML(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  },

  // Stats LocalStorage
  loadStats() {
    const saved = localStorage.getItem('intervai_stats');
    if (saved) {
      this.state.stats = JSON.parse(saved);
    }
  },

  saveSessionToStats(role, score) {
    const stats = this.state.stats;
    stats.sessionsCompleted++;
    
    const sum = stats.history.reduce((a, b) => a + b.score, 0) + score;
    stats.avgScore = Math.round(sum / stats.sessionsCompleted);
    stats.highestScore = Math.max(stats.highestScore || 0, score);
    
    stats.history.push({
      date: new Date().toLocaleDateString(),
      role: AIService.offlineData[role].title,
      score: score
    });
    
    localStorage.setItem('intervai_stats', JSON.stringify(stats));
    this.updateStatsUI();
  },

  updateStatsUI() {
    const stats = this.state.stats;
    document.getElementById('stat-sessions').textContent = stats.sessionsCompleted;
    document.getElementById('stat-avg-score').textContent = stats.avgScore ? `${stats.avgScore}%` : '-%';
    document.getElementById('stat-highest').textContent = stats.highestScore ? `${stats.highestScore}%` : '-%';
    
    // Render History Card list
    const container = document.getElementById('recent-sessions-list');
    if (stats.history.length > 0) {
      container.innerHTML = '';
      
      // Show latest 4 sessions
      const reversed = [...stats.history].reverse().slice(0, 4);
      reversed.forEach(s => {
        const item = document.createElement('div');
        item.style.cssText = "display:flex; justify-content:space-between; padding:8px; background-color:rgba(255,255,255,0.01); border:1px solid var(--border-color); border-radius:6px;";
        item.innerHTML = `
          <div>
            <strong>${s.role}</strong>
            <div style="font-size:10px; color:var(--text-tertiary);">${s.date}</div>
          </div>
          <span style="font-weight:700; color:${s.score >= 70 ? 'var(--color-emerald)' : 'var(--color-amber)'}">${s.score}%</span>
        `;
        container.appendChild(item);
      });
    }
  },

  // Markdown Parser Utility
  parseMarkdown(text) {
    let escaped = this.escapeHTML(text);
    
    // Replace code blocks: ```lang ... ```
    escaped = escaped.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/g, '<pre class="chat-code-block"><code>$1</code></pre>');
    
    // Replace inline code: `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
    
    // Replace bold: **text**
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Replace italic: *text*
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Replace bullet points
    escaped = escaped.replace(/(?:^|<br>)[-*]\s+([^\n<]+)/g, (match, p1) => {
      return '<div class="chat-bullet-item">• ' + p1 + '</div>';
    });
    
    // Replace newlines with <br>
    escaped = escaped.split('\n').join('<br>');
    
    // Fix pre tags which got <br> inside them
    escaped = escaped.replace(/<pre class="chat-code-block"><code>([\s\S]*?)<\/code><\/pre>/g, (match, p1) => {
      return '<pre class="chat-code-block"><code>' + p1.split('<br>').join('\n') + '</code></pre>';
    });

    return escaped;
  },

  // Initialize Career Coach Chat
  initCoach() {
    if (this.state.isCoachInitialized) return;
    
    this.state.coachConversationHistory = [];
    document.getElementById('coach-messages-container').innerHTML = '';
    
    // Welcome message
    const welcome = "Hello! I am your IntervAI Career Coach. I am here to help you optimize your resume, negotiate your salary, plan your learning roadmap, and practice behavioral strategies. Select a topic guide on the left or write your custom career questions below!";
    this.addCoachMessage('coach', welcome);
    this.state.coachConversationHistory.push({ role: 'coach', content: welcome });
    
    this.state.isCoachInitialized = true;
  },

  // Add message to Coach UI
  addCoachMessage(role, text) {
    const container = document.getElementById('coach-messages-container');
    if (!container) return;
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${role === 'coach' ? 'interviewer' : 'user'}`;
    
    const icon = role === 'coach' ? '🧑‍💼' : '👤';
    
    bubble.innerHTML = `
      <div class="msg-icon">${icon}</div>
      <div class="msg-content">${this.parseMarkdown(text)}</div>
    `;
    
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  // Submit custom coach query
  async submitCoachMessage() {
    const inputBox = document.getElementById('coach-input-box');
    const content = inputBox.value.trim();
    if (!content) return;
    
    // Append user message
    this.addCoachMessage('user', content);
    inputBox.value = '';
    
    this.state.coachConversationHistory.push({ role: 'user', content: content });
    
    this.showCoachTypingIndicator();
    
    const isLive = AIService.isLive();
    try {
      let reply = "";
      if (isLive) {
        // Send history to Gemini
        reply = await AIService.callCoachGemini(this.state.coachConversationHistory);
      } else {
        // Run offline keyword parsing matcher
        reply = AIService.getOfflineCoachResponse(content);
      }
      
      this.hideCoachTypingIndicator();
      this.addCoachMessage('coach', reply);
      this.state.coachConversationHistory.push({ role: 'coach', content: reply });
      
    } catch (e) {
      console.error("Coach message failed:", e);
      this.hideCoachTypingIndicator();
      const errorMsg = "Sorry, I had trouble generating a response. Please check your settings or try again.";
      this.addCoachMessage('coach', errorMsg);
    }
  },

  handleCoachChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.submitCoachMessage();
    }
  },

  // Handle clicking quick coach guides
  async askCoachTopic(topic) {
    this.addCoachMessage('user', `Help me with: ${topic}`);
    this.state.coachConversationHistory.push({ role: 'user', content: `Provide detailed tips on: ${topic}` });
    
    this.showCoachTypingIndicator();
    
    const isLive = AIService.isLive();
    try {
      let reply = "";
      if (isLive) {
        reply = await AIService.callCoachGemini(this.state.coachConversationHistory);
      } else {
        reply = AIService.getOfflineCoachResponse(topic);
      }
      
      this.hideCoachTypingIndicator();
      this.addCoachMessage('coach', reply);
      this.state.coachConversationHistory.push({ role: 'coach', content: reply });
      
    } catch(e) {
      console.error("Coach topic failed:", e);
      this.hideCoachTypingIndicator();
      this.addCoachMessage('coach', "Sorry, I encountered an error connecting to the coaching server.");
    }
  },

  showCoachTypingIndicator() {
    const container = document.getElementById('coach-messages-container');
    if (!container) return;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble interviewer';
    bubble.id = 'coach-typing-indicator';
    
    bubble.innerHTML = `
      <div class="msg-icon">🧑‍💼</div>
      <div class="msg-content">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  hideCoachTypingIndicator() {
    const el = document.getElementById('coach-typing-indicator');
    if (el) el.remove();
  }
};

// Global init on DOM load
window.addEventListener('DOMContentLoaded', () => {
  app.init();
  
  // Settings initialization key fill
  const key = AIService.getApiKey();
  if (key) {
    document.getElementById('settings-gemini-key').value = key;
  }
  
  const model = AIService.getModel();
  const modelRadio = document.getElementById(`model-${model === 'gemini-1.5-pro' ? 'pro' : 'flash'}`);
  if (modelRadio) modelRadio.checked = true;
});
