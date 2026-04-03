from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import asyncio
from agents import workforce
from db.database import SessionLocal
from db.models import Task, Event, Note, ChatHistory
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Google ADK Multi-Agent Workforce", 
    description="An Enterprise-grade AI Workforce using Google ADK, MCP, and Gemini on Vertex AI.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    response: str

@app.on_event("startup")
async def startup():
    print("🚀 App Startup: Initializing Google ADK Workforce...")
    # Initialize in background so the web server starts listening immediately (Fixes HF 'Starting' hang)
    asyncio.create_task(init_workforce())

async def init_workforce():
    try:
        await workforce.connect_mcp()
        print("✅ ADK Workforce connected to MCP Tools.")
    except Exception as e:
        print(f"❌ Error initializing ADK Workforce: {e}")

@app.on_event("shutdown")
async def shutdown():
    print("💤 Shutting down ADK Workforce...")
    # ADK session cleanup can be handled here if needed

@app.post("/workflow", response_model=QueryResponse)
async def process_workflow(request: QueryRequest):
    try:
        response_text = await workforce.run(request.query)
        
        # Save to Chat History
        db = SessionLocal()
        try:
            history_entry = ChatHistory(user_prompt=request.query, ai_response=response_text)
            db.add(history_entry)
            db.commit()
        finally:
            db.close()

        return QueryResponse(response=response_text)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            fallback_response = "⚠️ **Quota Exhausted:** My neural processing limit (Google Gemini Free Tier) has been temporarily reached due to complex internal reasoning loops. Please wait approximately 20 seconds before assigning me another task."
            
            # Still record the interaction to maintain continuity
            db = SessionLocal()
            try:
                history_entry = ChatHistory(user_prompt=request.query, ai_response=fallback_response)
                db.add(history_entry)
                db.commit()
            finally:
                db.close()
            return QueryResponse(response=fallback_response)

        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {error_msg}")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/tasks")
def get_tasks():
    db = SessionLocal()
    try:
        tasks = db.query(Task).order_by(Task.created_at.desc()).all()
        return [{"id": t.id, "title": t.title, "description": t.description, "status": t.status, "created_at": t.created_at.isoformat() if t.created_at else None} for t in tasks]
    finally:
        db.close()

@app.post("/api/tasks/{task_id}/complete")
def complete_task(task_id: int):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        task.status = "completed"
        db.commit()
        return {"status": "success", "task_id": task_id}
    finally:
        db.close()

@app.get("/api/events")
def get_events():
    db = SessionLocal()
    try:
        events = db.query(Event).all()
        return [{"id": e.id, "title": e.title, "start_time": e.start_time, "end_time": e.end_time} for e in events]
    finally:
        db.close()

@app.delete("/api/events/{event_id}")
def delete_event(event_id: int):
    db = SessionLocal()
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        db.delete(event)
        db.commit()
        return {"status": "success"}
    finally:
        db.close()

@app.get("/api/notes")
def get_notes():
    db = SessionLocal()
    try:
        notes = db.query(Note).order_by(Note.created_at.desc()).all()
        return [{"id": n.id, "content": n.content, "created_at": n.created_at.isoformat()} for n in notes]
    finally:
        db.close()

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int):
    db = SessionLocal()
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        db.delete(note)
        db.commit()
        return {"status": "success"}
    finally:
        db.close()

@app.get("/api/history")
def get_history():
    db = SessionLocal()
    try:
        history = db.query(ChatHistory).order_by(ChatHistory.created_at.desc()).limit(50).all()
        return [{"id": h.id, "user_prompt": h.user_prompt, "ai_response": h.ai_response, "created_at": h.created_at} for h in history]
    finally:
        db.close()

# Mount the frontend UI
app.mount("/", StaticFiles(directory="static", html=True), name="static")


