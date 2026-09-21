"""Deep research agents — extracted from Streamlit app for API use."""

from __future__ import annotations

from typing import Any, Callable, Dict, Optional

from agents import Agent, Runner, set_default_openai_key
from agents.tool import function_tool
from firecrawl import FirecrawlApp

ActivityCallback = Callable[[Dict[str, Any]], None]
StageCallback = Callable[[str], None]

DEFAULT_MAX_DEPTH = 3
DEFAULT_TIME_LIMIT = 180
DEFAULT_MAX_URLS = 10


def create_research_agents(
    openai_api_key: str,
    firecrawl_api_key: str,
    *,
    max_depth: int = DEFAULT_MAX_DEPTH,
    time_limit: int = DEFAULT_TIME_LIMIT,
    max_urls: int = DEFAULT_MAX_URLS,
    on_activity: Optional[ActivityCallback] = None,
) -> tuple[Agent, Agent]:
    """Build research + elaboration agents with the given API keys."""
    set_default_openai_key(openai_api_key)

    @function_tool
    async def deep_research(query: str, max_depth: int, time_limit: int, max_urls: int) -> Dict[str, Any]:
        """
        Perform comprehensive web research using Firecrawl's deep research endpoint.
        """
        try:
            firecrawl_app = FirecrawlApp(api_key=firecrawl_api_key)
            params = {
                "maxDepth": max_depth,
                "timeLimit": time_limit,
                "maxUrls": max_urls,
            }

            def _on_activity(activity: Dict[str, Any]) -> None:
                if on_activity:
                    on_activity(activity)

            results = firecrawl_app.deep_research(
                query=query,
                params=params,
                on_activity=_on_activity,
            )

            return {
                "success": True,
                "final_analysis": results["data"]["finalAnalysis"],
                "sources_count": len(results["data"]["sources"]),
                "sources": results["data"]["sources"],
            }
        except Exception as e:  # noqa: BLE001
            return {"error": str(e), "success": False}

    research_agent = Agent(
        name="research_agent",
        instructions=f"""You are a research assistant that can perform deep web research on any topic.

    When given a research topic or question:
    1. Use the deep_research tool to gather comprehensive information
       - Always use these parameters:
         * max_depth: {max_depth} (for moderate depth)
         * time_limit: {time_limit} (seconds)
         * max_urls: {max_urls} (sufficient sources)
    2. The tool will search the web, analyze multiple sources, and provide a synthesis
    3. Review the research results and organize them into a well-structured report
    4. Include proper citations for all sources
    5. Highlight key findings and insights
    """,
        tools=[deep_research],
    )

    elaboration_agent = Agent(
        name="elaboration_agent",
        instructions="""You are an expert content enhancer specializing in research elaboration.

    When given a research report:
    1. Analyze the structure and content of the report
    2. Enhance the report by:
       - Adding more detailed explanations of complex concepts
       - Including relevant examples, case studies, and real-world applications
       - Expanding on key points with additional context and nuance
       - Adding visual elements descriptions (charts, diagrams, infographics)
       - Incorporating latest trends and future predictions
       - Suggesting practical implications for different stakeholders
    3. Maintain academic rigor and factual accuracy
    4. Preserve the original structure while making it more comprehensive
    5. Ensure all additions are relevant and valuable to the topic
    """,
    )

    return research_agent, elaboration_agent


async def run_research_process(
    topic: str,
    openai_api_key: str,
    firecrawl_api_key: str,
    *,
    max_depth: int = DEFAULT_MAX_DEPTH,
    time_limit: int = DEFAULT_TIME_LIMIT,
    max_urls: int = DEFAULT_MAX_URLS,
    on_activity: Optional[ActivityCallback] = None,
    on_stage: Optional[StageCallback] = None,
) -> Dict[str, Any]:
    """Run research then elaboration. Returns initial + enhanced reports."""
    research_agent, elaboration_agent = create_research_agents(
        openai_api_key,
        firecrawl_api_key,
        max_depth=max_depth,
        time_limit=time_limit,
        max_urls=max_urls,
        on_activity=on_activity,
    )

    if on_stage:
        on_stage("researching")

    research_result = await Runner.run(research_agent, topic)
    initial_report = research_result.final_output

    if on_stage:
        on_stage("elaborating")

    elaboration_input = f"""
        RESEARCH TOPIC: {topic}

        INITIAL RESEARCH REPORT:
        {initial_report}

        Please enhance this research report with additional information, examples, case studies,
        and deeper insights while maintaining its academic rigor and factual accuracy.
        """

    elaboration_result = await Runner.run(elaboration_agent, elaboration_input)
    enhanced_report = elaboration_result.final_output

    if on_stage:
        on_stage("done")

    return {
        "topic": topic,
        "initial_report": initial_report,
        "enhanced_report": enhanced_report,
        "sources": [],
    }
