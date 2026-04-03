import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# HACKATHON CORE: Using the official Google ADK (Agent Development Kit)
# This aligns with Track 1 and Track 2 of the Gen AI Academy.
from google.adk import Agent
from google.adk.models import Gemini
from google.adk.runners import InMemoryRunner
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

load_dotenv()

class ProductivityWorkforce:
    """
    A Multi-Agent System built using Google ADK patterns.
    Orchestrates a Manager Agent and 3 specialized Sub-Agents.
    """
    
    def __init__(self):
        # HACKATHON CONFIG: Support both Vertex AI (GCP) and API Key (Studio/HF)
        api_key = os.getenv("GOOGLE_API_KEY")
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        
        if api_key and not project_id:
            # Use Gemini API Key (Best for HF/Quick Demos)
            self.model = Gemini(
                model_id="gemini-1.5-flash",
                api_key=api_key
            )
        else:
            # Use Vertex AI (Best for Cloud Run/Track 1)
            self.model = Gemini(
                model_id="gemini-1.5-flash",
                project=project_id,
                location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
            )
        
        # 1. SPECIALIZED SUB-AGENTS (The "Employees")
        self.chronos = Agent(
            name="Chronos",
            instruction="You are a Calendar Specialist. Use tools to manage events and time-blocks.",
            model=self.model
        )
        self.task_master = Agent(
            name="TaskMaster",
            instruction="You are an Operations Specialist. Use tools to manage tasks and structured data.",
            model=self.model
        )
        self.scribe = Agent(
            name="Scribe",
            instruction="You are an Information Specialist. Use tools to manage notes and brain-dumps.",
            model=self.model
        )

        # 2. PRIMARY MANAGER AGENT (The "Supervisor")
        self.manager = Agent(
            name="ProjectManager",
            instruction=(
                "You are the Primary Manager Agent. Your role is to coordinate your sub-agents: Chronos, TaskMaster, and Scribe.\n"
                "When a user asks for something, delegate to the specific sub-agent who handles that domain.\n"
                "Always ensure the job is finished. If multi-step coordination is needed, call agents sequentially."
            ),
            model=self.model
        )
        
        # 3. THE ENGINE (The Runner)
        # ADK Agents require a Runner to execute their logic.
        self.runner = InMemoryRunner(agent=self.manager)
        
        self._session = None
        self._exit_stack = None

    async def connect_mcp(self):
        """Standardized MCP Tool Integration (Track 2)"""
        server_params = StdioServerParameters(
            command="python3",
            args=["mcp_server.py"],
            env=os.environ.copy()
        )
        
        # Keep the client and session alive for the object lifecycle
        self._exit_stack = asyncio.ExitStack()
        try:
            # Connect to the MCP Server
            transport = await self._exit_stack.enter_async_context(stdio_client(server_params))
            read, write = transport
            session = ClientSession(read, write)
            await session.initialize()
            
            mcp_tools = await session.list_tools()
            self._session = session
            
            # Register MCP tools to the appropriate agents
            for tool in mcp_tools.tools:
                target_agent = self.manager # Default
                if tool.name in ["add_event", "list_events", "get_current_time"]:
                    target_agent = self.chronos
                elif tool.name in ["add_task", "list_tasks", "complete_task"]:
                    target_agent = self.task_master
                elif tool.name in ["add_note", "list_notes", "search_web", "get_wikipedia_summary"]:
                    target_agent = self.scribe

                target_agent.register_tool(
                    name=tool.name,
                    description=tool.description,
                    fn=self._make_mcp_call(tool.name),
                    input_schema=tool.inputSchema
                )

            # Register Sub-Agents as TOOLS to the Manager (True Multi-Agent)
            self.manager.register_tool(name="ask_chronos", description="Delegate to Chronos.", fn=self._make_agent_tool(self.chronos))
            self.manager.register_tool(name="ask_task_master", description="Delegate to TaskMaster.", fn=self._make_agent_tool(self.task_master))
            self.manager.register_tool(name="ask_scribe", description="Delegate to Scribe.", fn=self._make_agent_tool(self.scribe))
            
            print("🏆 ADK Workforce connected to MCP and Multi-Agent Hierarchy active.")
            return session
        except Exception as e:
            print(f"❌ MCP Connection Error: {e}")
            await self._exit_stack.aclose()
            raise

    def _make_mcp_call(self, tool_name: str):
        """Creates a wrapper for ADK to talk to MCP"""
        async def call_tool(**kwargs):
            if not self._session:
                return "Error: MCP Session not initialized."
            result = await self._session.call_tool(tool_name, arguments=kwargs)
            return str(result.content[0].text)
        return call_tool

    def _make_agent_tool(self, sub_agent: Agent):
        """Wraps a sub-agent as a tool for the manager"""
        async def call_agent(query: str, **kwargs):
            # Create a temporary runner for the sub-agent
            sub_runner = InMemoryRunner(agent=sub_agent)
            response = await sub_runner.run(query)
            return response.text
        return call_agent

    async def run(self, user_input: str):
        """Executes the Multi-Agent workflow via ADK Runner"""
        # We use the runner to execute the manager's logic
        response = await self.runner.run(user_input)
        return response.text

# Global singleton for the app lifecycle
workforce = ProductivityWorkforce()
