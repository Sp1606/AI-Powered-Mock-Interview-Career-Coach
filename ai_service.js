/**
 * IntervAI: AI Integration & Local Simulation Service Layer
 * Supports Google Gemini API & offline interactive simulation datasets.
 */

const AIService = {
  // Local storage keys
  API_KEY_STORAGE_KEY: 'intervai_gemini_api_key',
  MODEL_STORAGE_KEY: 'intervai_gemini_model',
  
  // Available Offline Simulation Database
  offlineData: {
    flutter: {
      title: "Flutter Developer",
      interviewer: "Sarah (Lead Mobile Engineer)",
      questions: [
        {
          id: 1,
          type: "behavioral",
          question: "Welcome! To start off our Flutter interview, tell me about a complex mobile app you've built. What state management solution did you choose, and why did you choose it over others like standard setState or Provider?",
          hints: ["Focus on scalability, testability, and separation of concerns.", "Mention state solutions like Riverpod, Bloc, or Redux if you have used them."],
          evalTemplate: {
            strengths: "Clearly explained state management trade-offs, showing strong architectural understanding of Flutter's reactive model.",
            suggestions: "Could elaborate more on unit testing state changes, specifically testing async data states (loading, error, success).",
            solution: "A standard scaling pattern is using Riverpod (Notifier/AsyncNotifier) or BLoC patterns. For small features, stateful widget state is fine, but for larger apps, global decoupled states are required for cleaner architecture and widget testability."
          }
        },
        {
          id: 2,
          type: "coding",
          question: "Great. Now let's do a coding challenge. Write a Dart extension method or class called `SafeList` that wraps a standard List and allows out-of-bounds indexing to return a default value or `null` instead of throwing a `RangeError` (which crashes Flutter apps).",
          language: "dart",
          filename: "safe_list.dart",
          starterCode: `// Write a SafeList class or extension in Dart
extension SafeListExtension<T> on List<T> {
  T? safeGet(int index) {
    // Implement this method
    
  }
}

void main() {
  List<int> numbers = [10, 20, 30];
  print(numbers.safeGet(1)); // Should print 20
  print(numbers.safeGet(5)); // Should print null without crashing!
}`,
          expectedOutput: "20\nnull",
          testCode: `
void runTests() {
  List<int> testList = [10, 20, 30];
  if (testList.safeGet(1) == 20 && testList.safeGet(5) == null && testList.safeGet(-1) == null) {
    print("TEST_SUCCESS");
  } else {
    print("TEST_FAILED");
  }
}`,
          hints: ["Check if the index is between 0 (inclusive) and list length (exclusive).", "Be careful to handle negative indexes, as they are also out of bounds."],
          evalTemplate: {
            strengths: "Implemented clean bounds checking logic in Dart extension, successfully handling negative indexes and high-boundary overflows.",
            suggestions: "Make sure you use generic type constraints appropriately to ensure safety with list collections.",
            solution: `extension SafeListExtension<T> on List<T> {
  T? safeGet(int index) {
    if (index < 0 || index >= this.length) {
      return null;
    }
    return this[index];
  }
}`
          }
        },
        {
          id: 3,
          type: "system-design",
          question: "Perfect. For our last question, let's talk about performance. How do you optimize widget rebuilds in Flutter? What is the role of `const` constructors, and how do you identify rendering bottlenecks in a production app?",
          hints: ["Talk about repainting boundaries and lazy-loading lists.", "Mention profiling tools like DevTools Performance tab, widget rebuild counts, and raster threads."],
          evalTemplate: {
            strengths: "Excellent understanding of Flutter DevTools and rebuilding lifecycles. Discussed RepaintBoundary and const constructor caching.",
            suggestions: "Could mention list view item extensibility and caching heights to optimize scroll physics.",
            solution: "To optimize rebuilds, use const constructors to cache elements, split heavy widgets into smaller stateless widgets, utilize RepaintBoundary for heavy graphics, and profile using Flutter DevTools rebuild tracks to catch re-evaluating widget trees."
          }
        }
      ]
    },
    'python-ml': {
      title: "Python / ML Engineer",
      interviewer: "Dr. Alan (Senior AI Scientist)",
      questions: [
        {
          id: 1,
          type: "behavioral",
          question: "Welcome to the Machine Learning engineering loop. Tell me about a machine learning project you've worked on recently. How did you handle data preprocessing, feature scaling, and validating your model's generalizability?",
          hints: ["Discuss techniques like standardization (StandardScaler) vs normalization.", "Mention splitting strategies (K-Fold cross-validation) and handling imbalanced datasets (SMOTE, class weighting)."],
          evalTemplate: {
            strengths: "Well-reasoned approach to validation pipelines. Showed clear understanding of data leakage prevention during scaling.",
            suggestions: "Expand on hyperparameter optimization (GridSearch vs Bayesian optimization) to demonstrate advanced tuning capabilities.",
            solution: "A standard ML preprocessing pipeline involves imputing missing values, scaling feature columns (MinMax/StandardScaler) fit solely on the training split, encoding categories, and evaluating with stratified cross-validation to maintain consistent distribution classes."
          }
        },
        {
          id: 2,
          type: "coding",
          question: "Let's work on a coding problem. Write a Python function `euclidean_distance` that calculates the distance between two coordinate arrays. To test your optimization skills, calculate this using NumPy vectorized calculations instead of raw python loops.",
          language: "python",
          filename: "ml_math.py",
          starterCode: `import numpy as np

def euclidean_distance(v1, v2):
  # Calculate Euclidean distance between two NumPy arrays
  # Avoid using for loops
  
  pass

# Test values
point_a = np.array([1.0, 2.0, 3.0])
point_b = np.array([4.0, 6.0, 3.0])
print(euclidean_distance(point_a, point_b)) # Should output 5.0
`,
          expectedOutput: "5.0",
          testCode: `
def run_tests():
  import numpy as np
  a = np.array([1, 2, 3])
  b = np.array([4, 6, 3])
  res = euclidean_distance(a, b)
  if np.isclose(res, 5.0):
    print("TEST_SUCCESS")
  else:
    print("TEST_FAILED")
`,
          hints: ["Use np.subtract, squared difference, sum, and square root.", "NumPy operations like np.sum and np.sqrt are vectorized and highly optimized in C."],
          evalTemplate: {
            strengths: "Perfect vectorized calculation using NumPy math utility, avoiding loops to ensure O(1) syntax execution.",
            suggestions: "Make sure you handle potential shape mismatch errors by adding type/shape validation assertions.",
            solution: `import numpy as np

def euclidean_distance(v1, v2):
  return np.sqrt(np.sum((v1 - v2) ** 2))`
          }
        },
        {
          id: 3,
          type: "system-design",
          question: "Good job. For our final topic: Explain PCA (Principal Component Analysis). How does it achieve dimensionality reduction? What are the key mathematical steps involved in calculating principal components?",
          hints: ["Talk about covariance matrices, eigenvalues, and eigenvectors.", "Discuss maximizing variance and projecting data onto lower-dimensional subspaces."],
          evalTemplate: {
            strengths: "Demonstrated mathematical depth. Addressed variance preservation and orthogonality of components.",
            suggestions: "Consider mentioning scaling requirements (standardization) before running PCA to avoid feature scale bias.",
            solution: "PCA reduces dimension by finding orthogonal axes (principal components) that maximize variance. Steps: 1. Standardize data, 2. Compute covariance matrix, 3. Calculate eigenvalues & eigenvectors, 4. Sort eigenvectors by eigenvalue magnitudes, 5. Project data into chosen top eigenvectors."
          }
        }
      ]
    },
    fullstack: {
      title: "Full-Stack Engineer",
      interviewer: "Marcus (Technical Architect)",
      questions: [
        {
          id: 1,
          type: "behavioral",
          question: "Welcome. Let's start with system architecture. How do you design APIs for high performance and scalability? Tell me about a time you optimized a slow query or API route.",
          hints: ["Mention indexing, pagination, caching (Redis), database schema optimizations.", "Talk about measuring latency using tools like APMs or database query logs."],
          evalTemplate: {
            strengths: "Addressed caching strategies (Redis) and database indexes. Demonstrated database latency awareness.",
            suggestions: "Discuss API versioning, CORS security, and bulk operation pagination in more detail.",
            solution: "Optimize slow APIs by creating B-Tree indexes on queried database fields, introducing cursor-based pagination, using Redis for read-heavy static data, and selecting specific projection columns instead of SELECT *."
          }
        },
        {
          id: 2,
          type: "coding",
          question: "Let's do a coding challenge. Write a simple Express-like rate limiting function `isRateLimited` in JavaScript. It should track the timestamp array of requests for a client and return `true` if they exceed 3 requests in a 10-second window, or `false` otherwise.",
          language: "javascript",
          filename: "rate_limiter.js",
          starterCode: `// Rate Limiter Simulator
const clientRequests = {}; // Stores client IP -> timestamps array

function isRateLimited(clientId, timestamp) {
  // Return true if client has made more than 3 requests in the last 10 seconds
  
}

// Test script
console.log(isRateLimited("user_1", 1000)); // false
console.log(isRateLimited("user_1", 2000)); // false
console.log(isRateLimited("user_1", 5000)); // false
console.log(isRateLimited("user_1", 8000)); // true (4th request in 10s window)
`,
          expectedOutput: "false\nfalse\nfalse\ntrue",
          testCode: `
function runTests() {
  clientRequests["test_user"] = [1000, 2000, 3000];
  if (isRateLimited("test_user", 5000) === true && isRateLimited("test_user", 15000) === false) {
    console.log("TEST_SUCCESS");
  } else {
    console.log("TEST_FAILED");
  }
}`,
          hints: ["Filter the request timestamps array to keep only those newer than (currentTimestamp - 10000).", "Update the store with the filtered list plus the new timestamp, then check its length."],
          evalTemplate: {
            strengths: "Correctly implemented sliding window logic in JS, successfully cleaning memory state during evaluation.",
            suggestions: "Make sure you handle garbage collection of inactive clients to prevent memory leaks in the request hashmap.",
            solution: `function isRateLimited(clientId, timestamp) {
  if (!clientRequests[clientId]) {
    clientRequests[clientId] = [];
  }
  
  // Filter out requests older than 10 seconds (10,000 ms)
  const windowLimit = timestamp - 10000;
  clientRequests[clientId] = clientRequests[clientId].filter(t => t > windowLimit);
  
  if (clientRequests[clientId].length >= 3) {
    return true;
  }
  
  clientRequests[clientId].push(timestamp);
  return false;
}`
          }
        },
        {
          id: 3,
          type: "system-design",
          question: "Good work. Let's finish with database schemas. Compare SQL and NoSQL. Under what scenario would you choose MongoDB over PostgreSQL, and vice versa?",
          hints: ["Discuss relationships, ACID compliance, scaling properties, structure flexibility.", "SQL excels in normalized schemas and transactions; NoSQL in semi-structured JSON storage and write throughput."],
          evalTemplate: {
            strengths: "Gave clear ACID definitions. Recognized PostgreSQL's JSONB capabilities as a modern hybrid solution.",
            suggestions: "Could discuss horizontal sharding in MongoDB vs replication/read-replicas scaling in PostgreSQL.",
            solution: "Choose SQL (PostgreSQL) when data requires structured relationships, ACID transactions, and reliable reporting. Choose NoSQL (MongoDB) for unstructured logs, rapid prototype changes, and high-frequency document writes that don't need multi-table joins."
          }
        }
      ]
    },
    'data-analyst': {
      title: "Data Analyst",
      interviewer: "Olivia (Head of Data & BI)",
      questions: [
        {
          id: 1,
          type: "behavioral",
          question: "Welcome! Data analytics is about telling stories with numbers. Tell me about a time you analyzed a dataset and uncovered an insight that drove a business decision. How did you communicate this to non-technical stakeholders?",
          hints: ["Describe the metrics: ROI, user churn, conversion rates.", "Mention using dashboards, charts, and translating analytical findings into clear business goals."],
          evalTemplate: {
            strengths: "Structured response showing business empathy. Focused on dashboards that prioritize user action items.",
            suggestions: "Consider mentioning how you validated data quality and handled anomalies before doing final reporting.",
            solution: "A successful analysis requires setting key objectives, cleaning dataset anomalies, formulating correlation hypotheses, and creating visual summaries (graphs) focused on actionable insights rather than math formulas."
          }
        },
        {
          id: 2,
          type: "coding",
          question: "Let's do some SQL. Imagine a table `orders` with columns `order_id`, `customer_id`, `amount`, and `order_date`. Write a SQL query using a window function to rank customers by total spending, displaying the rank alongside customer ID and total spent.",
          language: "sql",
          filename: "query.sql",
          starterCode: `-- Write SQL query to calculate ranks
-- Output columns should be: customer_id, total_spent, customer_rank

SELECT
  
FROM orders
`,
          expectedOutput: "DENSE_RANK() OVER",
          hints: ["Group by customer_id and calculate SUM(amount) first.", "Use DENSE_RANK() or RANK() OVER (ORDER BY SUM(amount) DESC)."],
          evalTemplate: {
            strengths: "Appropriate usage of DENSE_RANK window functions. Structured query nicely with CTE definitions.",
            suggestions: "Consider handling null amount values by using COALESCE(amount, 0) to avoid ranking errors.",
            solution: `WITH customer_spend AS (
  SELECT customer_id, SUM(amount) as total_spent
  FROM orders
  GROUP BY customer_id
)
SELECT 
  customer_id, 
  total_spent,
  DENSE_RANK() OVER (ORDER BY total_spent DESC) as customer_rank
FROM customer_spend;`
          }
        },
        {
          id: 3,
          type: "system-design",
          question: "Perfect. For our last question: How do you identify data anomalies or outliers in a dataset? If you find missing values in a critical column (like user age or salary), how do you decide whether to drop, impute, or flag them?",
          hints: ["Mention standard deviation, Z-score, Box plots (IQR).", "Discuss imputation techniques: mean/median imputation, regression imputation, KNN imputation."],
          evalTemplate: {
            strengths: "Correctly contrasted Mean vs Median imputation based on variance skewness. Addressed IQR bounds.",
            suggestions: "Could mention predictive imputation methods like Random Forest or MICE algorithms for missing data.",
            solution: "Identify outliers using IQR (values beyond 1.5 IQR from quartiles) or Z-scores (>3 std dev). For missing values: drop if small percentage (<2%), impute with median if skewed, mean if normal, or flag with a separate missing status boolean indicator."
          }
        }
      ]
    }
  },

  // Save API Key in LocalStorage
  saveApiKey(key) {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, key);
  },

  // Get API Key from LocalStorage
  getApiKey() {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  },

  // Clear API Key
  clearApiKey() {
    localStorage.removeItem(this.API_KEY_STORAGE_KEY);
  },

  // Save Model configuration
  saveModel(model) {
    localStorage.setItem(this.MODEL_STORAGE_KEY, model);
  },

  // Get selected model
  getModel() {
    return localStorage.getItem(this.MODEL_STORAGE_KEY) || 'gemini-1.5-flash';
  },

  // Check if API key is configured
  isLive() {
    const key = this.getApiKey();
    return (key && key.trim().startsWith('AIzaSy'));
  },

  // Send request to Gemini API
  async callGemini(systemInstruction, messages, isJson = false) {
    const apiKey = this.getApiKey();
    const model = this.getModel();
    
    if (!apiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Format messages for Gemini API
    const contents = messages.map(msg => ({
      role: msg.role === 'interviewer' || msg.role === 'model' ? 'model' : 'user', // Map interviewer/coach to model, rest to user
      parts: [{ text: msg.content + (msg.code ? `\n\n[Candidate's Submitted Code]:\n${msg.code}` : "") }]
    }));

    // In Gemini, we can provide system instructions at the top level
    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: isJson ? "application/json" : "text/plain"
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const responseData = await response.json();
      const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error("Empty response received from Gemini.");
      }

      return textResponse;
    } catch (error) {
      console.error("Gemini API call failed:", error);
      throw error;
    }
  },

  // System Prompts for Live Interview
  getSystemInstructionForInterview(role, level, company, includeCoding, resumeText = "") {
    let prompt = `You are IntervAI, an elite technical recruiter and lead developer conducting a job interview for a ${level} ${role} role at a ${company}.
Your communication style is professional, encouraging yet highly critical and standard-driven. You want to see if the candidate has actual skills.

Structure of the Interview:
1. You will ask exactly 3 questions.
2. The candidate will respond. If includeCoding is true, they can also write code in the code panel.
3. Keep your questions focused: 
   - Question 1: Behavioral & Project Experience ${resumeText ? `tailored to their resume: ${resumeText}` : ''}
   - Question 2: A practical coding challenge. Give clear instructions and inputs.
   - Question 3: A system design or architectural optimization scenario.

CRITICAL RULES:
- Ask only ONE question at a time. Do NOT output long text.
- Do NOT output greetings after the first turn.
- If the candidate submits code, review it critically. Give immediate, constructive hints or query their design choices.
- Keep your turns under 100 words where possible, except when presenting code challenges.
- When the candidate answers, do a brief follow-up and move to the next question.
- Do not announce Question numbers explicitly. Just ask naturally.`;

    return prompt;
  },

  // Final evaluation generator via Gemini
  async generateLiveEvaluation(role, level, company, conversationHistory) {
    const systemInstruction = `You are an expert technical interviewer and recruitment committee member. 
Analyze the interview conversation history and the code submitted by the candidate.
You MUST output a detailed evaluation REPORT strictly in JSON format. Do NOT wrap it in any formatting besides JSON.

The JSON structure MUST follow this exactly:
{
  "overallScore": 85, // number from 0 to 100 representing job match probability
  "verdict": "Verdict Title", // e.g. "Highly Recommended", "Strong Candidate", "Needs Practice"
  "verdictDesc": "Detailed paragraph explaining the verdict based on code accuracy and communication.",
  "competencies": {
    "logic": 8, // 0-10 score for coding correctness, efficiency
    "approach": 7, // 0-10 score for problem solving, algorithm design
    "system": 9, // 0-10 score for architecture, scaling choices
    "communication": 8 // 0-10 score for readability, clarity, explanation
  },
  "questions": [
    {
      "question": "Question text...",
      "answer": "Candidate's response...",
      "score": 8, // 0-10
      "strengths": "What they did well...",
      "suggestions": "What they can improve...",
      "solution": "Correct code or model solution..."
    }
  ]
}`;

    const prompt = `Here is the interview history:
${JSON.stringify(conversationHistory, null, 2)}

Evaluate the interview and output the JSON report. Ensure the 'questions' array has exactly 3 entries matching the questions asked.`;

    try {
      const responseText = await this.callGemini(systemInstruction, [{ role: 'user', content: prompt }], true);
      return JSON.parse(responseText.trim());
    } catch (error) {
      console.error("Failed to generate live evaluation, falling back to helper generator:", error);
      throw error;
    }
  },

  // Live Resume Scanner via Gemini API
  async analyzeLiveResume(resumeText) {
    const systemInstruction = `You are an expert recruiter scanning a technical resume.
Analyze the resume and return a strict JSON report. Do NOT wrap it in any formatting besides JSON.
Format:
{
  "skills": ["Skill1", "Skill2", ...], // Max 12 key technical skills
  "profileSummary": "2-sentence professional profile summary.",
  "suggestedRole": "Flutter Developer" | "Python / ML Engineer" | "Full-Stack Engineer" | "Data Analyst",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement 1", "Improvement 2"]
}`;

    const prompt = `Analyze this resume and provide the structured evaluation:\n\n${resumeText}`;

    try {
      const responseText = await this.callGemini(systemInstruction, [{ role: 'user', content: prompt }], true);
      let cleanText = responseText.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
      }
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("Live resume scan failed:", e);
      throw e;
    }
  },

  // Send request to Gemini API for Career Coaching
  async callCoachGemini(messages) {
    const systemInstruction = `You are IntervAI Coach, an elite career mentor and executive technology recruiter.
You help candidates optimize their resumes, negotiate salaries, build career roadmaps, and prepare for interviews.
Your style is encouraging, strategic, and highly professional.
Provide practical, concrete advice with clear bullet points. Keep your responses structured and easy to read.`;
    
    try {
      const responseText = await this.callGemini(systemInstruction, messages, false);
      return responseText;
    } catch (e) {
      console.error("Coach live chat failed:", e);
      throw e;
    }
  },

  // Smart Offline Career Coach responders
  getOfflineCoachResponse(userMessage) {
    const text = userMessage.toLowerCase();
    
    if (text.includes('resume') || text.includes('cv') || text.includes('profile')) {
      return `### 📄 Resume Optimization Tips
To optimize your resume for applicant tracking systems (ATS) and recruiters, follow these guidelines:
1. **Use clear, quantified results**: Instead of writing "Developed Flutter features", write "Developed 5 core features in Flutter, reducing load times by 24% and increasing active users by 15%".
2. **Include target keywords**: Tailor your resume to match the job description's keywords (e.g. state management, PCA, window functions, caching).
3. **Keep formatting simple**: Avoid complex multi-column grid layouts that throw off automated ATS scanners. Use standard PDFs or simple text hierarchies.

*Tip: Save a Gemini API Key in Settings to get a live, personalized review of your uploaded resume.*`;
    }
    
    if (text.includes('salary') || text.includes('negotiat') || text.includes('offer') || text.includes('compensation')) {
      return `### 💰 Salary Negotiation Strategies
Negotiation can significantly boost your total compensation. Here are key tactics:
1. **Never give the first number**: If asked about salary expectations, say: "I'd prefer to learn more about the role and deliverables before discussing numbers. What range do you have budgeted for this position?"
2. **Base your request on market data**: Use levels.fyi, Glassdoor, and regional data to support your number.
3. **Negotiate total compensation**: Remember that stock options, signing bonuses, health benefits, and PTO are negotiable, not just your base salary.
4. **Be polite but firm**: "I am extremely excited about this opportunity. Based on my experience with the stack, I would be comfortable signing if we can reach $X."`;
    }

    if (text.includes('roadmap') || text.includes('learn') || text.includes('path') || text.includes('career') || text.includes('skill')) {
      return `### 🗺️ Career Roadmap Recommendations
Here are the general progression steps for tech roles:
1. **Junior**: Focus on execution speed, clean syntax, understanding your framework's lifecycles, and writing tests.
2. **Mid-Level**: Master system architecture, state/data caching, schema design trade-offs, and profiling execution latency.
3. **Senior**: Lead architectural decisions, mentor junior devs, optimize large-scale distributed bottlenecks, and design for modular extensibility.

*What specific role are you pursuing? Let me know so I can suggest specific skill trees.*`;
    }
    
    if (text.includes('star') || text.includes('behavioral') || text.includes('interview')) {
      return `### 🌟 The STAR Method for Behavioral Questions
When asked behavioral questions (e.g. "Tell me about a conflict"), use the STAR structure:
1. **Situation**: Set the scene. (1-2 sentences)
2. **Task**: What was your responsibility? (1-2 sentences)
3. **Action**: What did you do? Focus on your contributions. (3-4 sentences)
4. **Result**: What was the outcome? Use numbers if possible! (e.g. "We launched on time with 0 bugs"). (1-2 sentences)`;
    }

    return `Hello! I am your AI Career Coach. I can help you with:
- **Resume Optimization**: How to design and structure your profile.
- **Salary Negotiation**: Strategies to negotiate compensation.
- **Career Roadmaps**: What skillsets to focus on next.
- **Interview Preparation**: Techniques like the STAR method.

*Please select one of the quick guide topics on the left, or type your question. Save your Gemini key in settings to enable personalized, live career coaching chat!*`;
  }
};
