# 🚀 How to Run: Google ADK Multi-Agent Workforce

This project is a high-performance **Multi-Agent** solution built for the **Google Cloud GenAI Academy Hackathon**. It uses the **ADK (Agent Development Kit)** and **MCP (Model Context Protocol)**.

## 🛠️ Prerequisites
1.  **Google Cloud Project**: You must have a GCP project ID and **Vertex AI** enabled.
2.  **API Keys**: Required in the `.env` file (see below).
3.  **Python 3.10+**: Ensure `pip install -r requirements.txt` is run.

## 🔑 Environment Configuration
Create a `.env` file in the root directory:
```env
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1
DATABASE_URL=sqlite:///./app_data.db  # Use AlloyDB URI in Production
```

---

## ⚡ Execution Instructions

### **1. Local Development (Uvicorn)**
Run the main API which initializes the ADK Workforce and the MCP Tool-Bridge:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```
Open **`http://localhost:8000`** to access the Neubrutalist Dashboard.

### **2. ADK CLI Interaction (Optional)**
If you've installed the ADK CLI, you can interact with the agent directly:
```bash
adk run agents.py
```

### **3. Production Deployment (Cloud Run)**
We have provided a containerized setup for Track 1 compliance:
```bash
# Build and Push to Artifact Registry
gcloud builds submit --config cloudbuild.yaml .

# Deploy to Cloud Run (Managed)
gcloud run deploy productivity-dashboard --image gcr.io/[PROJECT_ID]/productivity-dashboard
```

---

## 🛡️ Core Features
- **Project Manager Agent**: Autonomous supervisor that handles multi-step delegation.
- **MCP Tool-Bridge**: Connects to Tasks, Calendar, Notes, Web Search, and Wikipedia.
- **Wikipedia Enrichment**: Matches **Track 2 (Codelab 1)** requirement for info-retrieval.
- **AlloyDB AI Ready**: Matches **Track 3** requirement for high-performance data querying.
