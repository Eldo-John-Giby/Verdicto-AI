# LexAI UI - Demo Script for Video Presentation

## Introduction (30 seconds)

**[Opening Shot: Landing Page with animated background]**

"Welcome to LexAI UI - Justice, Accelerated by AI. In a world where legal processes can be slow and complex, we've built an intelligent platform that makes legal analysis transparent, accessible, and unbiased. Let me show you how LexAI is transforming the legal landscape."

---

## Section 1: Landing Page & Authentication (45 seconds)

**[Show Landing Page]**

"Our elegant, minimalist interface welcomes users with a cinematic experience. Notice the flowing animated paths and clean design - this is legal tech that's both powerful and beautiful."

**[Click "Enter Platform"]**

"Authentication is seamless. We support email OTP for secure access, and for quick exploration, users can even sign in as a guest."

**[Show Auth Page, then sign in]**

"Once authenticated, users are taken directly to their personalized dashboard."

---

## Section 2: Dashboard Overview (30 seconds)

**[Show Dashboard with Sidebar]**

"The dashboard is your command center. From here, you can access all of LexAI's powerful features:
- Case Prediction for AI-driven legal forecasting
- Document Library for managing legal documents
- Legal Research for accessing case precedents
- Bias Insights for detecting potential biases
- Reports for comprehensive analysis summaries
- History to track all your queries
- And our new Live Verdict feature for real-time transcription"

---

## Section 3: Case Prediction - The Core Feature (2 minutes)

**[Navigate to Case Prediction]**

"Let's start with our flagship feature - AI Case Prediction. This is where the magic happens."

**[Show the interface]**

"Users can input their legal queries in two ways: by typing directly or by uploading legal documents. We also have a Live Transcribe feature that converts spoken queries into text in real-time."

**[Type a sample query]**

"Let's ask: 'What are the constitutional rights regarding freedom of speech in India?'"

**[Click Analyze]**

"Watch as our RAG-powered backend processes this query. We're using:
- Groq's llama-3.1-8b-instant for ultra-fast LLM processing
- Voyage AI's voyage-3-large for semantic embeddings
- Weaviate for vector storage and retrieval"

**[Show Results]**

"The results are comprehensive:
1. **AI Prediction**: A clear, concise answer based on legal documents
2. **Confidence Score**: We show exactly how confident the AI is in this prediction
3. **Bias Flags**: Any potential biases are automatically detected and flagged
4. **Evidence Snippets**: Supporting evidence from actual legal documents
5. **Explainable Reasoning**: Transparent logic behind the prediction"

**[Highlight Citizen/Lawyer Mode Toggle]**

"Notice the mode toggle. In Citizen Mode, explanations are simplified for general understanding. In Lawyer Mode, we provide professional-level legal analysis with technical terminology."

**[Show hover effects on cards]**

"The interface is interactive - hover over any card to see smooth animations and additional details."

---

## Section 4: Document Library - RAG in Action (1.5 minutes)

**[Navigate to Document Library]**

"Now let's look at how we manage legal documents. This is where our RAG system truly shines."

**[Show existing documents]**

"Users can see all their uploaded documents with:
- Document titles and jurisdictions
- Upload dates
- Processing status in real-time"

**[Click Upload Document]**

"Let's upload a new document - say, the Constitution of India."

**[Select a PDF file]**

"Once uploaded, our backend immediately springs into action:
1. The document is stored securely in Convex
2. It's sent to our FastAPI RAG backend on Railway
3. The PDF is processed using PyMuPDF
4. Text is extracted and intelligently chunked
5. Embeddings are generated using Voyage AI
6. Everything is indexed in Weaviate for lightning-fast retrieval"

**[Show processing status]**

"Users can track the processing status in real-time. Once completed, this document becomes part of our knowledge base for future queries."

**[Show search and filter]**

"Documents can be searched semantically and filtered by jurisdiction, making it easy to find exactly what you need."

---

## Section 5: Bias Insights - Ensuring Fairness (1 minute)

**[Navigate to Bias Insights]**

"One of LexAI's most important features is bias detection. Legal decisions must be fair and unbiased."

**[Show bias dashboard]**

"Our ML backend, powered by InLegalBERT, analyzes all predictions for potential biases:
- Racial bias
- Gender bias
- Socioeconomic bias
- Geographic bias
- Age bias"

**[Show visualizations]**

"We provide comprehensive visualizations showing:
- Overall bias scores across all predictions
- Breakdown by bias category
- Trends over time
- Specific recommendations for improvement"

**[Highlight a specific bias flag]**

"When bias is detected, we don't just flag it - we explain it. Users can see exactly what triggered the bias detection and how to interpret it."

---

## Section 6: Live Verdict - Real-Time Transcription (45 seconds)

**[Navigate to Live Verdict]**

"Our newest feature is Live Verdict - perfect for courtroom proceedings or legal consultations."

**[Show the interface]**

"Users can click the microphone button to start recording."

**[Click record and speak]**

"As you speak, the Web Speech API transcribes your words in real-time, word by word. This is incredibly useful for:
- Recording court proceedings
- Capturing client consultations
- Documenting legal discussions"

**[Show transcript]**

"The transcript appears instantly and can be cleared or saved for later reference."

---

## Section 7: Additional Features (1 minute)

**[Navigate to Legal Research]**

"Legal Research provides access to a comprehensive database of cases and precedents, with powerful semantic search capabilities."

**[Navigate to History]**

"The History page tracks all queries and their results, allowing users to revisit past analyses and export data."

**[Navigate to Reports]**

"Reports can be generated and downloaded for any prediction, perfect for sharing with clients or colleagues."

---

## Section 8: Technical Architecture (1 minute)

**[Show a simple architecture diagram or return to dashboard]**

"Let's talk about what powers LexAI:

**Frontend:**
- Built with React 19, TypeScript, and Vite for blazing-fast performance
- Styled with Tailwind v4 and Shadcn UI for a modern, responsive design
- Framer Motion for smooth, professional animations
- Theme support for both light and dark modes

**Backend:**
- Convex handles our core backend and real-time database
- FastAPI RAG backend on Railway for document processing
- Unified ML backend on Hugging Face Spaces for bias detection
- Weaviate for vector storage and semantic search

**AI Models:**
- Groq's llama-3.1-8b-instant for ultra-fast responses
- Voyage AI's voyage-3-large for high-quality embeddings
- InLegalBERT for specialized legal bias detection"

---

## Section 9: Key Differentiators (45 seconds)

**[Return to dashboard or landing page]**

"What makes LexAI unique?

1. **Speed**: Sub-15 second processing for complex legal queries
2. **Transparency**: Every prediction comes with explainable reasoning
3. **Bias Detection**: Automatic identification of potential biases
4. **RAG-Powered**: Answers are grounded in actual legal documents
5. **Dual Modes**: Accessible to both citizens and legal professionals
6. **Real-Time**: Live transcription and instant document processing
7. **Beautiful UX**: Professional design that's a pleasure to use"

---

## Closing (30 seconds)

**[Show landing page or dashboard]**

"LexAI UI represents the future of legal technology - where AI doesn't replace legal professionals, but empowers them. Where justice is accelerated, not compromised. Where legal analysis is transparent, accessible, and unbiased.

Whether you're a lawyer seeking faster research, a citizen trying to understand your rights, or a legal organization looking to scale your operations, LexAI is built for you.

Justice, Accelerated by AI. That's LexAI UI."

**[Fade to logo or call-to-action]**

---

## Demo Tips & Notes

### Preparation Checklist:
- [ ] Ensure RAG backend is deployed and running on Railway
- [ ] Verify ML backend is active on Hugging Face Spaces
- [ ] Have sample legal documents ready for upload (Constitution, legal cases)
- [ ] Prepare 2-3 sample queries that showcase different features
- [ ] Test Live Transcribe feature beforehand
- [ ] Clear browser cache for smooth demo
- [ ] Have both light and dark themes ready to show

### Sample Queries to Use:
1. "What are the fundamental rights guaranteed under Article 21 of the Indian Constitution?"
2. "Explain the legal provisions for freedom of speech and expression"
3. "What are the constitutional remedies available for violation of fundamental rights?"

### Timing Breakdown:
- Introduction: 30s
- Landing & Auth: 45s
- Dashboard: 30s
- Case Prediction: 2m
- Document Library: 1.5m
- Bias Insights: 1m
- Live Verdict: 45s
- Additional Features: 1m
- Technical Architecture: 1m
- Key Differentiators: 45s
- Closing: 30s

**Total: ~10 minutes**

### Pro Tips:
1. Speak clearly and at a moderate pace
2. Let animations complete before moving on
3. Highlight interactive elements with cursor movements
4. Show real results, not placeholders
5. Emphasize the "why" behind features, not just the "what"
6. Keep energy high and enthusiasm genuine
7. Practice transitions between sections
8. Have a backup plan if live features fail

---

## Alternative Short Version (3 minutes)

For a quick demo, focus on:
1. Landing page (15s)
2. Case Prediction with one query (1m 30s)
3. Document upload (45s)
4. Bias detection (30s)
5. Closing (15s)

---

## Q&A Preparation

**Expected Questions:**

**Q: How accurate are the predictions?**
A: Our predictions are grounded in actual legal documents through RAG, with confidence scores provided. We emphasize that LexAI is a tool to assist legal professionals, not replace them.

**Q: What about data privacy?**
A: All documents are securely stored in Convex with proper authentication. We use industry-standard security practices.

**Q: Can it handle multiple languages?**
A: Yes, our ML backend includes translation capabilities for multilingual support.

**Q: How fast is the processing?**
A: Most queries are processed in under 15 seconds, even for complex legal documents.

**Q: What makes your bias detection unique?**
A: We use InLegalBERT, a model specifically trained on legal texts, ensuring domain-specific bias detection.

---

## Post-Demo Call to Action

"Interested in seeing LexAI in action for your organization? Visit our website to schedule a personalized demo or start your free trial today. Let's accelerate justice together."

---

**End of Demo Script**
