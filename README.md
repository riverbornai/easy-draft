# Riverborn AI Content Studio

Riverborn AI is a production-ready, multi-agent content generation platform built on top of the **OpenAI Agents SDK** (`@openai/agents`). It coordinates a team of specialized AI agents to automate research, drafting, safety checking, human-in-the-loop review, and publishing of high-performing marketing and blog content.

---

## 🚀 Key Features

* **Multi-Agent Orchestration:** Coordinates a structured pipeline of specialized agents (Intake, Research, Writer, Review, Publisher, and Grader).
* **Web Search & Synthesis:** Gathers facts dynamically from the web using search tools to avoid hallucinations and ensure factual accuracy.
* **Dual Model Drafting:** Generates candidate drafts in parallel using different models (simulating GPT-4o and Claude) for comparison.
* **Human-in-the-Loop (HITL):** Supports reviewing, editing, and approving drafts through either a Web UI or a Terminal prompt.
* **Safety Guardrails:** Automatically flags hallucinated stats, fake quotes, and toxic language before presenting drafts to humans.
* **Dynamic Multi-Metric Content Grader:** Evaluates draft quality on 4 dimensions (Hook strength, Format/readability, Depth/vocabulary diversity, and LLM Judge Rating) directly from text metrics, generating unique, non-static scores.
* **Encrypted API Key Management:** Users provide their OpenAI/Anthropic keys via the browser UI. Keys are stored **encrypted at rest** in MongoDB using **AES-256-GCM** (keyed off a server-only `KEY_ENCRYPTION_SECRET`).
* **Firebase Authentication with Dev Fallback:** Integrated with Firebase Auth. For local development, a fallback mechanism parses the JWT token payload directly, allowing local dev to run seamlessly without needing Firebase service account credentials.

---

## 🛠️ Tech Stack

### Frontend
* **Core:** React (Vite), React Router, Axios.
* **UI/Styling:** Vanilla CSS & Tailwind CSS, Lucide Icons.
* **Auth:** Firebase Client SDK.

### Backend
* **Core:** Node.js (Express), ESM (ES Modules).
* **Database:** MongoDB (Mongoose) for session, logs, and encrypted user credentials.
* **Orchestration:** OpenAI Agents SDK (`@openai/agents`) with trace logging.
* **Encryption:** Node.js `crypto` (AES-256-GCM).

---

## 📁 Repository Structure

```text
├── backend/
│   ├── agents/         # Agents: Intake, Research, Writer, Review, Publisher, Eval (Grader)
│   ├── guardrails/     # Input & Output safety checks
│   ├── models/         # Mongoose schemas (Session, UserKeys)
│   ├── routes/         # Express API endpoints
│   ├── tools/          # Web search, formatting, and file-saving tools
│   ├── utils/          # Encryption, Firebase admin initialization helpers
│   ├── server.js       # Express server entrypoint
│   └── .env.example    # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── pages/      # Dashboard, Runs list, Eval (Leaderboard), TraceLogs
│   │   ├── components/ # UI components (ApiKeyModal, PipelineBar, etc.)
│   │   └── context/    # Authentication context
│   └── .env.example    # Frontend environment template
└── package.json        # Root package with monorepo scripts
```

---

## 🤖 The Multi-Agent Workflow

1. **Intake Agent:** Captures the content topic, target audience, channel, tone, and specific instructions.
2. **Research Agent:** Performs internet searches, parses findings, and outputs a structured fact-sheet.
3. **Writer Agent:** Writes content drafts in parallel (GPT-4o vs Claude).
4. **Review Agent:** Runs safety guardrails and pauses for human approval (Terminal or Web).
5. **Publisher Agent:** Formats the final approved draft and saves it to the output folder.
6. **Eval Runner (Grader):** Evaluates draft quality dynamically on Hook strength, Format compliance, Readability, and Tone.

---

## ⚙️ Local Setup and Installation

### Prerequisites

* **Node.js** (>= 18)
* **Yarn** or **NPM**
* **MongoDB** (running locally or a connection URI)

### Step 1: Install Dependencies

From the root directory, run the following command to install dependencies for both the backend and frontend:

```bash
yarn install:all
```

### Step 2: Configure Environment Variables

#### 1. Backend Setup:
Go to the `backend/` folder, copy `.env.example` to `.env`:
```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and configure the following variables:
* `MONGO_DB`: Your MongoDB connection URI (e.g. `mongodb://localhost:27017/ai-content-studio`).
* `KEY_ENCRYPTION_SECRET`: A secure 32-byte secret used to encrypt user API keys. You can generate one with:
  ```bash
  openssl rand -hex 32
  ```
* `FIREBASE_SERVICE_ACCOUNT` (Optional): Paste your Firebase Admin JSON credentials as a single line here. **If left empty, local development will bypass verification and run in fallback mode automatically.**

#### 2. Frontend Setup:
Go to the `frontend/` folder, copy `.env.example` to `.env`:
```bash
cp frontend/.env.example frontend/.env
```
Populate your Firebase configuration variables in `frontend/.env` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.).

---

### Step 3: Run the Application

Start both the backend server and frontend development server concurrently from the root directory:

```bash
yarn dev
```

* **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Backend Server:** [http://localhost:3001](http://localhost:3001)

---

## 📝 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

