# 🛠️ Project Research & Development Log: Multi-Agent Dashboard

This document provides a comprehensive high-level review of the engineering lifecycle, research findings, and technical modifications performed during the development of the Multi-Agent Productivity System.

---

## 📅 Phase 1: Architectural Transition
**Goal**: Migrate from a legacy static dashboard to a functional, AI-driven Multi-Agent orchestrator.

### 🏗️ Work Performed:
- **LangGraph Integration**: Established a state-managed orchestrator in `agents.py` to handle tool execution.
- **MCP Tool Protocol**: Initialized a FastMCP server to provide the LLM with direct access to database operations.
- **Backend Setup**: Developed a FastAPI server to bridge the frontend UI with the LangGraph logic.

---

## 📑 Phase 2: Core Feature Implementation
**Goal**: Build persistent storage and interactive UI for productivity essentials.

### 🧩 Key Changes:
- **Database Layer**: Created SQLAlchemy models for `Task`, `Event`, and `Note`.
- **UI Rewrite**: Replaced the static "Widget" system with dynamic feeds that fetch real-time data from the backend.
- **Functionality**: Implemented "Add Task", "Add Note", and "Add Event" via the AI interface.

---

## 🚨 Phase 3: The Quota Resilience Research (Critical)
**Issue**: During testing, the system frequently encountered `RESOURCE_EXHAUSTED (429)` errors.

### 🔍 Research Findings:
- **Analysis**: We discovered that **Gemini 2.5 Flash** has a strict free-tier limit of **20 requests per day**.
- **Evidence**:
  ![API Usage Debugging](docs/research_assets/api_usage_debug.png)
  *API Studio usage logs showing rapid quota exhaustion during multi-turn reasoning.*

- **Error Logs Analysis**:
  ![Quota Exhaustion Screenshot](docs/research_assets/quota_exhaustion_error.png)
  *Captured user screenshot showing the 429 status code returned by the generative model.*

---

## ⚡ Phase 4: Optimization & Resilience
**Goal**: Solve the quota exhaustion issue without losing intelligence or functionality.

### 🛠️ Technical Solution:
1. **Model Migration**: Researched all available Gemini models and identified that **`gemini-3.1-flash-lite-preview`** offers a much larger quota of **500 requests per day**.
2. **Zero-Pass Logic**: Refactored `mcp_agent_node` to synthesize responses inside the first loop, eliminating the "second-request-per-prompt" behavior common in standard LangGraph tool-nodes.
3. **Frontend Rate Limiting**: Added a client-side limiter (15 requests/minute) to prevent accidental API flooding.

---

## 🍎 Phase 5: Final Hackathon Polish
**Goal**: Ensure the user experience is professional and "Demo-Ready".

### 💡 User-Directed Upgrades:
- **Dynamic Calendar**: Enabled month/year navigation (Prev/Next buttons) previously locked to a static March 2026 view.
- **Interactive Deletion**: Added "Done ✅" toggles to activities and notes.
- **Cleanup**: Purged old history (`app_data.db`) to ensure a fresh slate for the hackathon jury.

### 📸 Evolution of the UI:
![UI Design Evolution](docs/research_assets/ui_layout_evolution.png)
*Early prototype layout before Neubrutalist refinements.*

![Final Calendar Navigation](docs/research_assets/calendar_grid_final.png)
*Complete, functional Schedule Management grid.*

![Notes System Final](docs/research_assets/notes_crud_update.png)
*New Notes system with dynamic deletion and "Done" support.*

---

## 📝 Documented Prompt History (Major Key Moments)
1. **"make it working"**: User's initial directive to bridge the mock UI and real logic.
2. **"error 429"**: Critical trigger point that led to the quota resilience research.
3. **"use another models"**: Redirected search towards the `gemini-3.1-flash-lite` ecosystem.
4. **"claer all history"**: Triggered the final cleanup and demo-protection phase.
5. **"full fill all requriements"**: Final check against hackathon judging criteria.

---

### 🏆 Final Verdict
The project successfully meets all **Multi-Agent Coordination** requirements. It uses a **Supervisor Agent** coordinating **three specialized sub-agents** via **MCP tools**, all while maintaining a resilient, quota-conscious deployment architecture on **Google Cloud technologies**.
