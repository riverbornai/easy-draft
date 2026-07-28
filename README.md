# Riverborn AI Content Studio

Riverborn AI is a multi-agent content production studio built using the **OpenAI Agents SDK**. It automates the research, drafting, safety checking, human-in-the-loop review, and publishing of high-performing marketing and blog content across multiple channels.

---

## 🚀 Key Features

* **Multi-Agent Pipeline:** Coordinates a structured pipeline of specialized AI agents to produce high-quality drafts.
* **Web Search & Synthesis:** Gathers facts dynamically from the web to avoid hallucinations and ensure factual accuracy.
* **Dual Drafting:** Generates drafts in parallel using different models (simulating GPT-4o and Claude) for comparison.
* **Human-in-the-Loop (HITL):** Supports reviewing, editing, and approving drafts through either a Web UI or a Terminal prompt.
* **Safety Guardrails:** Automatically flags hallucinated stats, fake quotes, and toxic language before presenting drafts to humans.
* **Performance Analysis & Leaderboard:** Evaluates approved drafts using an automated grader and logs historical performance over time.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, React Router, Lucide Icons, Axios.
* **Backend:** Node.js (Express), MongoDB (Mongoose), OpenAI API, Anthropic API (optional).
* **Orchestration:** OpenAI Agents SDK (`@openai/agents`) with trace visualization.

---

## 📁 Repository Structure

```text
├── backend/
│   ├── agents/         # Agents: Intake, Research, Writer, Review, Publisher, Eval
│   ├── guardrails/     # Input & Output safety checks
│   ├── routes/         # API endpoints
│   ├── tools/          # Web search, format, and file-saving tools
│   ├── templates/      # Formats (blog, email, social posts)
│   ├── server.js       # Express server entrypoint
│   └── .env.example    # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── pages/      # Dashboard, Runs, Eval (Leaderboard), TraceLogs
│   │   └── components/ # UI components
│   └── .env.example    # Frontend environment template
└── package.json        # Root package with monorepo scripts
```

---

## 🤖 The Multi-Agent Workflow

1. **Intake Agent:** Captures the content topic, target audience, channel, tone, and specific instructions.
2. **Research Agent:** Performs internet searches, parses findings, and outputs a structured fact-sheet.
3. **Writer Agent:** Writes content drafts in parallel.
4. **Review Agent:** Performs safety guardrails and pauses for human approval (Terminal or Web).
5. **Publisher Agent:** Formats the final approved draft and saves it to the output folder.
6. **Eval Runner:** Evaluates the draft quality (Accuracy, Tone match, Hook strength).

---

## ⚙️ Local Setup and Installation

### Prerequisites

* Node.js (>= 18)
* Yarn or NPM
* MongoDB (running locally or a connection URI)
* OpenAI API Key

### Step 1: Install Dependencies

From the root directory, run the following command to install packages for both the backend and frontend:

```bash
yarn install:all
```

### Step 2: Configure Environment Variables

#### Backend Setup:
Go to the `backend/` folder, copy `.env.example` to `.env`, and populate your secrets:
```bash
cp backend/.env.example backend/.env
```
Ensure you provide:
* `OPENAI_API_KEY`
* `MONGO_URI` (or configure your MongoDB connection string in the env or code)

#### Frontend Setup:
Go to the `frontend/` folder, copy `.env.example` to `.env`:
```bash
cp frontend/.env.example frontend/.env
```

### Step 3: Run the Application

Start both the backend server and frontend development server concurrently from the root directory:

```bash
yarn dev
```

* **Frontend Dashboard:** http://localhost:5173
* **Backend Server:** http://localhost:3001

---

## 📝 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
