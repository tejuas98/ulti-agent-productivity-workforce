from mcp.server.fastmcp import FastMCP
from db.database import SessionLocal
from db.models import Task, Event, Note
from datetime import datetime
from duckduckgo_search import DDGS

# Initialize the FastMCP server
mcp = FastMCP("Personal_Assistant_MCP")

# --- Task Tools ---
@mcp.tool()
def add_task(title: str, description: str = "") -> str:
    """Add a new task to the task manager."""
    db = SessionLocal()
    try:
        task = Task(title=title, description=description)
        db.add(task)
        db.commit()
        db.refresh(task)
        return f"Added task: '{task.title}' (ID: {task.id})"
    finally:
        db.close()

@mcp.tool()
def list_tasks() -> str:
    """List all pending tasks."""
    db = SessionLocal()
    try:
        tasks = db.query(Task).filter(Task.status == "pending").all()
        if not tasks:
            return "No pending tasks."
        return "\\n".join([f"ID {t.id}: {t.title} - {t.description}" for t in tasks])
    finally:
        db.close()

@mcp.tool()
def complete_task(task_id: int) -> str:
    """Mark a task as completed."""
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return f"Task ID {task_id} not found."
        task.status = "completed"
        db.commit()
        return f"Task '{task.title}' marked as completed."
    finally:
        db.close()

# --- Calendar Tools ---
@mcp.tool()
def add_event(title: str, start_time: str, end_time: str) -> str:
    """Add a calendar event. Time format: YYYY-MM-DD HH:MM:SS"""
    db = SessionLocal()
    try:
        start_dt = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
        event = Event(title=title, start_time=start_dt, end_time=end_dt)
        db.add(event)
        db.commit()
        db.refresh(event)
        return f"Added calendar event: '{event.title}' starting at {event.start_time}"
    except ValueError as e:
        return f"Date parsing error: Please use 'YYYY-MM-DD HH:MM:SS' format. Exception: {e}"
    finally:
        db.close()

@mcp.tool()
def list_events() -> str:
    """List upcoming calendar events."""
    db = SessionLocal()
    try:
        events = db.query(Event).order_by(Event.start_time).limit(10).all()
        if not events:
            return "No upcoming events."
        return "\\n".join([f"{e.start_time} - {e.end_time}: {e.title}" for e in events])
    finally:
        db.close()

# --- Notes Tools ---
@mcp.tool()
def add_note(content: str) -> str:
    """Add a new note."""
    db = SessionLocal()
    try:
        note = Note(content=content)
        db.add(note)
        db.commit()
        db.refresh(note)
        return f"Added note with ID {note.id}"
    finally:
        db.close()

@mcp.tool()
def list_notes() -> str:
    """List all saved notes."""
    db = SessionLocal()
    try:
        notes = db.query(Note).order_by(Note.created_at.desc()).all()
        if not notes:
            return "No notes found."
        return "\\n".join([f"[{n.created_at.strftime('%Y-%m-%d %H:%M')}] Note ID {n.id}: {n.content}" for n in notes])
    finally:
        db.close()

# --- External Tools ---
@mcp.tool()
def get_current_time() -> str:
    """Get the exact realtime date and precise current time from the host system."""
    now = datetime.now()
    return f"The current system date and time is: {now.strftime('%A, %B %d, %Y %I:%M:%S %p')}. Use this to resolve relative dates like 'tomorrow' or 'next week'."

@mcp.tool()
def search_web(query: str, max_results: int = 3) -> str:
    """Search the live internet via DuckDuckGo for real-time news, facts, and external information."""
    try:
        results = DDGS().text(query, max_results=max_results)
        if not results:
            return f"No results found on the web for '{query}'"
        formatted = [f"Title: {r.get('title')}\\nSnippet: {r.get('body')}" for r in results]
        return "\\n\\n".join(formatted)
    except Exception as e:
        return f"Web search failed: {str(e)}"

# --- Track 2: Wikipedia Enrichment (Mirroring Codelab 1) ---
import wikipediaapi
wiki_wiki = wikipediaapi.Wikipedia(
    language='en',
    extract_format=wikipediaapi.ExtractFormat.WIKI,
    user_agent="ProductivityAssistant/1.0 (https://github.com/user/project)"
)

@mcp.tool()
def get_wikipedia_summary(topic: str) -> str:
    """Fetch a high-level summary of a factual topic or person from Wikipedia."""
    page = wiki_wiki.page(topic)
    if not page.exists():
        return f"No Wikipedia entry found for '{topic}'."
    return f"Wikipedia Summary for '{topic}':\\n{page.summary[0:1500]}..." 

if __name__ == "__main__":
    mcp.run()
