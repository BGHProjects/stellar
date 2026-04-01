"""
Agentic chat loop for the Stellar AI chatbot.

Uses Anthropic's tool_use pattern to let the model call orbital
calculation and voyage search tools before composing its final response.

The loop continues until the model produces a stop_reason of "end_turn"
(meaning it has finished using tools and produced its final text response).
"""

import json
from typing import Any

import anthropic

from config.settings import config, SYSTEM_CONFIG
from agent.tools import TOOL_SCHEMAS, execute_tool

# ─────────────────────────────────────────────────────────────────
# System prompt
# ─────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are the Stellar voyage assistant — a helpful, knowledgeable guide for passengers \
booking interplanetary voyages across the Solara system.

You have access to live orbital calculations and voyage search tools. Use them when answering \
questions about travel times, distances, prices, schedules, or optimal departure windows. \
Always prefer tool results over estimates.

The Solara system:
- Two binary stars: Solara Prime (G-type) and Solara Minor (K-type orange dwarf)
- Three main planetary systems: Aethon (super-Earth, inner), Vareth (gas giant, mid), Calyx (ice planet, outer)
- A debris field called "the Scatter" between the inner and outer systems
- All orbital positions change daily — use the orbital tools to get current data

Tone: knowledgeable, calm, and genuinely helpful. You are not a travel agent making a sale — \
you are a trusted advisor helping someone navigate a complex, fascinating system. Be concise. \
Use specific numbers when you have them. If you don't know something, say so.

Important rules:
- Mira (moon of Vareth) requires an interplanetary permit in addition to a ticket.
- Vael is the coldest inhabited body in the system (-230°C surface).
- Full Cryo passengers cannot access ship amenities — mention this when relevant.
- The Scatter crossing means asteroid deviation coverage is worth considering.
- Helix Class is not available on Helion-class ships.
- Do not invent routes that don't exist in the system config.
"""

# ─────────────────────────────────────────────────────────────────
# Chat function
# ─────────────────────────────────────────────────────────────────

def chat(
    message: str,
    conversation_history: list[dict],
    max_tool_rounds: int = 5,
) -> tuple[str, list[dict]]:
    """
    Run the agentic chat loop for a single user message.

    Args:
        message:              The user's message.
        conversation_history: Prior turns as Anthropic message dicts.
        max_tool_rounds:      Maximum number of tool-call rounds before forcing a response.

    Returns:
        A tuple of (assistant_reply_text, updated_conversation_history).
    """
    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    # Append the user message to history
    messages = conversation_history + [{"role": "user", "content": message}]

    for _round in range(max_tool_rounds + 1):
        response = client.messages.create(
            model=config.ANTHROPIC_MODEL,
            max_tokens=config.MAX_TOKENS,
            system=SYSTEM_PROMPT,
            tools=TOOL_SCHEMAS,
            messages=messages,
        )

        # If the model wants to use tools, execute them and continue
        if response.stop_reason == "tool_use":
            # Add the assistant's tool_use turn to the conversation
            messages.append({
                "role":    "assistant",
                "content": response.content,
            })

            # Execute each tool call and collect results
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result_text = execute_tool(block.name, block.input)
                    tool_results.append({
                        "type":        "tool_result",
                        "tool_use_id": block.id,
                        "content":     result_text,
                    })

            # Add tool results as a user turn and loop
            messages.append({
                "role":    "user",
                "content": tool_results,
            })
            continue

        # Model finished — extract the text response
        reply = ""
        for block in response.content:
            if hasattr(block, "text"):
                reply += block.text

        # Append the final assistant turn to history
        updated_history = messages + [{"role": "assistant", "content": reply}]

        # Trim history to avoid unbounded growth (keep last 20 turns)
        if len(updated_history) > 20:
            updated_history = updated_history[-20:]

        return reply.strip(), updated_history

    # Fallback if we exhaust tool rounds
    return (
        "I ran into an issue processing your request. Please try rephrasing your question.",
        messages,
    )