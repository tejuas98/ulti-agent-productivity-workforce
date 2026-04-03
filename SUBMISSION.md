# 🏆 Hackathon Submission: Google ADK Multi-Agent Workforce

## 📋 Executive Summary
Our project is a **Multi-Agent Productivity Ecosystem** built precisely on the three core learning tracks of the **Google Cloud GenAI Academy**. We have moved beyond simple chatbots to create an **Autonomous Digital Coworker** that orchestrates complex workflows across Tasks, Schedules, and Knowledge.

---

## 🏗️ Technical Synergy: The 3-Track Masterclass

### **Track 1: Agent Development Kit (ADK) & Cloud Run**
- **Framework**: Built using the official **`google-adk`** Python SDK.
- **Orchestration**: Implemented a **Primary Manager Agent** (Supervisor) that coordinates specialized sub-agent logic.
- **Compute**: Stateless container architecture ready for **Google Cloud Run** deployment with IAM-secured service-to-service authentication.

### **Track 2: Model Context Protocol (MCP)**
- **Standardized Integration**: Separate reasoning from tool execution using the **Model Context Protocol**.
- **Toolbox**:
    - **Location & Information**: Integrated DuckDuckGo and **Wikipedia API** (Codelab 1) for real-time enrichment.
    - **Proprietary Tools**: Secure MCP bridge to SQL-based Task/Calendar management.

### **Track 3: AlloyDB for PostgreSQL**
- **AI-Ready Storage**: Support for **AlloyDB AI** with natural language querying capabilities enabled.
- **Performance**: High-fidelity storage schema optimized for vector search and structured productivity data.

---

## ⛓️ Multi-Step "Chain Reaction" Demo
The system demonstrates Track 2's "Chain Reaction" requirement: 
1. **User Prompt**: *"Book a meeting with the tech lead tomorrow at 10 AM and add a task to prep some questions about AlloyDB."*
2. **Step A**: Manager identifies the intent.
3. **Step B**: **Chronos Agent** checks the system time and books the calendar event.
4. **Step C**: **TaskMaster Agent** extracts the "prep questions" duty and saves it to the database.
5. **Step D**: **Scribe Agent** fetches a **Wikipedia summary** for "AlloyDB" to pre-populate the task notes.

---

## 🛠️ Google Cloud Stack
- **Gemini 1.5 Flash / 3.1 Flash Lite** on **Vertex AI**.
- **Cloud Run** (Stateless hosting).
- **AlloyDB AI** (Structured & Semantic data).
- **Secret Manager** (Security).
- **Cloud Build** (CI/CD).

### **Repository & Deployment**
- **GitHub**: [Public Repository Link]
- **Cloud Run**: [Live Demo Link]
- **Video**: [Demo Walkthrough Link]
