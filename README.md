# Google ADK Multi-Agent Productivity Workforce

This project is a high-fidelity multi-agent productivity ecosystem designed for the Google Cloud Gen AI Academy Hackathon. It integrates the Agent Development Kit (ADK), Model Context Protocol (MCP), and AlloyDB to demonstrate a production-ready AI workforce.

## Core Architecture

### Track 1: Agent Development Kit (ADK)
The system utilizes the official google-adk framework to implement a hierarchical agent structure. A primary Project Manager agent coordinates specialized sub-agents:
- Chronos: Calendar and scheduling specialist.
- TaskMaster: Operations and task management specialist.
- Scribe: Information retrieval and notes specialist.

### Track 2: Model Context Protocol (MCP)
Tools are integrated via a standardized MCP server, allowing for clean separation between reasoning and execution. Features include:
- Real-time web search (DuckDuckGo).
- Factual enrichment via Wikipedia API.
- Local database integration for persistent storage of tasks, events, and notes.

### Track 3: AlloyDB for PostgreSQL
The persistence layer is designed for Google Cloud, supporting AlloyDB with AI natural language features for high-performance structured and semantic data management.

## Prerequisites
- Google Cloud Project with Vertex AI enabled.
- Python 3.10 or higher.
- API Keys for Google Gemini (Vertex AI).

## Setup and Execution
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure environment variables in a .env file:
   ```env
   GOOGLE_API_KEY=your_api_key
   GOOGLE_CLOUD_PROJECT=your_project_id
   GOOGLE_CLOUD_LOCATION=us-central1
   ```
3. Run the application:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## Deployment
The project is containerized and ready for Google Cloud Run deployment using the provided Dockerfile and cloudbuild.yaml.
