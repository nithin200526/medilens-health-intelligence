"""
rag_engine/langchain_chain.py
-----------------------------
MediLens — LangChain Pipeline

This module replaces the raw OpenAI API calls with a proper LangChain pipeline:

  ┌─────────────────────────────────────────────────┐
  │         LangChain RAG Architecture               │
  │                                                  │
  │  Report Data (JSON)                              │
  │       ↓                                          │
  │  ChatPromptTemplate  ←── retriever context       │
  │       ↓                                          │
  │  ChatGroq (llama-3.3-70b-versatile)              │
  │       ↓                                          │
  │  StrOutputParser                                 │
  │       ↓                                          │
  │  Structured Output                               │
  └─────────────────────────────────────────────────┘

Chains built here:
  1. extraction_chain   — PDF text → structured patient JSON
  2. explanation_chain  — Structured data → per-test card explanations
  3. build_chat_chain() — Per-session conversational chain with memory
"""
import os
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import LLMChain

load_dotenv()

def get_llm(model_name: str = None, temperature: float = 0.15) -> ChatGroq:
    """Return a ChatGroq instance pointing at a specific model."""
    target_model = model_name or os.getenv("GROK_MODEL", "llama-3.3-70b-versatile")
    return ChatGroq(
        model=target_model,
        temperature=temperature,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        max_tokens=4096,
    )

def _invoke_with_fallback(chain, input_data: dict) -> str:
    """Try high-quality model, fallback to instant model on 429."""
    try:
        # Try primary model (usually 70B)
        return chain.invoke(input_data)
    except Exception as e:
        if "rate_limit_exceeded" in str(e).lower() or "429" in str(e):
            print(f"[FALLBACK] Rate limit hit on primary model. Retrying with llama-3.1-8b-instant...")
            # Rebuild chain with 8b model
            # Note: This is an ad-hoc fix to the existing module-level chains
            # In a full refactor we would pass the LLM into the chain builder
            from langchain_core.runnables import RunnableSerializable
            if isinstance(chain, RunnableSerializable):
                # The chains in this module are: prompt | llm | parser
                # We extract the prompt and parser to rebuild with 8b
                try:
                    prompt = chain.steps[0]
                    parser = chain.steps[2]
                    fallback_llm = get_llm(model_name="llama-3.1-8b-instant")
                    fallback_chain = prompt | fallback_llm | parser
                    return fallback_chain.invoke(input_data)
                except:
                    pass
        raise e


# ── 2. Extraction Chain ───────────────────────────────────────────────────────
# PDF raw text → structured patient_info + panels JSON

_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are MediLens — a Medical Report Extraction Engine operating inside a LangChain pipeline.

Your task: extract ALL structured information from raw lab report text.

STRICT RULES:
- Do NOT invent missing data.
- Do NOT assume values not present in the text.
- Return ONLY valid JSON — no markdown, no commentary.
- If patient name/age/gender is missing, set to null.

Return this exact JSON structure:
{{
  "patient_info": {{
    "name": null,
    "age": null,
    "gender": null,
    "report_date": null,
    "lab_name": null,
    "doctor": null,
    "report_id": null
  }},
  "panels": [
    {{
      "panel_name": "Panel Name",
      "tests": [
        {{
          "parameter": "exact parameter name",
          "value": "measured value",
          "unit": "unit or null",
          "reference_range": "range string or null",
          "lab_flag": "H/L/CRITICAL/null",
          "comment": "any comments or null"
        }}
      ]
    }}
  ]
}}""",
    ),
    ("human", "Extract all data from this lab report:\n\n{raw_text}"),
])

# LCEL chain: prompt | llm | parser
extraction_chain = _EXTRACTION_PROMPT | get_llm(temperature=0.05) | StrOutputParser()


# ── 3. Card Explanation Chain ─────────────────────────────────────────────────
# Structured test list → per-test plain-English cards (JSON array)

_CARD_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are MediLens — a Medical Report Explanation Engine operating inside a LangChain RAG pipeline.

You receive structured lab test data with reference ranges and risk context.

STRICT RULES (NON-NEGOTIABLE):
- Do NOT diagnose any disease or medical condition.
- Do NOT prescribe or suggest any medication.
- Explain each parameter in simple, calm, patient-friendly language.
- Use ONLY the provided data — never fabricate reference ranges.
- Keep each field to 1-2 sentences maximum.

Return ONLY a valid JSON array (no markdown, no commentary):
[
  {{
    "parameter": "exact parameter name",
    "one_liner": "What this test measures (1 simple sentence)",
    "what_this_means": "What this result means for the patient right now (1-2 sentences)",
    "what_if_ignored": "General long-term implication if unchecked (1 sentence, NOT a diagnosis)",
    "urgency": "normal | watch | consult | urgent"
  }}
]

Patient Alert Level: {alert_level}
Affected Domains: {domains}""",
    ),
    ("human", "Explain these lab test results:\n\n{tests_json}"),
])

explanation_chain = _CARD_PROMPT | get_llm(temperature=0.2) | StrOutputParser()


# ── 4. Chat Chain with Memory ─────────────────────────────────────────────────
# Per-session conversational agent with ConversationBufferWindowMemory

_CHAT_SYSTEM = """You are MediLens — a Risk-Aware Medical Report Intelligence Assistant.

You operate inside a structured LangChain pipeline with access to:
- Extracted lab report data (structured JSON)
- Deterministic risk analysis results
- Domain grouping results
- Alert level classification

STRICT RULES (NON-NEGOTIABLE):
1. You are NOT a doctor. You do NOT diagnose diseases.
2. You do NOT prescribe or suggest medications.
3. You ONLY answer using the report data provided in context.
4. If question is unrelated to the report → ask user to clarify.
5. If asked for diagnosis or medication → refuse politely, recommend doctor.
6. Never hallucinate lab values not present in the context.
7. Always recommend professional consultation for abnormal findings.
8. If emergency_flag is true → emphasize urgency responsibly.

FORMATTING & TONE RULES:
- Explain things in a clear, simple, human-understandable way without dense medical jargon.
- VERY IMPORTANT: Do NOT answer in lengthy paragraphs. Break information down into simple, scannable parts.
- ALWAYS use bullet points when summarizing multiple findings, symptoms, or recommendations to improve clarity.
- Keep responses concise, direct, and focused on the user's immediate question.

REPORT CONTEXT:
{report_context}

ALERT LEVEL: {alert_level}
EMERGENCY: {emergency}"""

_CHAT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", _CHAT_SYSTEM),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{question}"),
])


# Session memory store (keyed by session_id for stateless HTTP)
_session_memories: dict[str, ConversationBufferWindowMemory] = {}


def get_session_memory(session_id: str, k: int = 6) -> ConversationBufferWindowMemory:
    """
    Get or create a ConversationBufferWindowMemory for the given session.
    Keeps the last k conversation turns.
    """
    if session_id not in _session_memories:
        _session_memories[session_id] = ConversationBufferWindowMemory(
            k=k,
            return_messages=True,
            memory_key="history",
        )
    return _session_memories[session_id]


def build_chat_chain(session_id: str):
    """
    Build a modern LangChain RunnableSequence for the chat.
    Memory is handled externally via get_session_memory.
    """
    return _CHAT_PROMPT | get_llm(temperature=0.2) | StrOutputParser()

_GENERAL_CHAT_SYSTEM = """You are MediLens — a General Medical Intelligence Assistant.

STRICT RULES (NON-NEGOTIABLE):
1. You are NOT a doctor. You do NOT diagnose specific conditions for the user.
2. You do NOT prescribe or suggest specific medical treatments for the user.
3. You ONLY answer questions related to medicine, health, nutrition, fitness, and human biology.
4. If a question is NOT about health or medicine (e.g., coding, cars, math) → politely refuse to answer.
5. Always recommend professional consultation if the user describes symptoms.

FORMATTING & TONE RULES:
- Explain things in a clear, simple, human-understandable way without dense medical jargon.
- VERY IMPORTANT: Do NOT answer in lengthy paragraphs. Break information down into simple, scannable parts.
- ALWAYS use bullet points to structure your response.
- Keep responses concise, direct, and focused on the user's immediate question.
"""

_GENERAL_CHAT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", _GENERAL_CHAT_SYSTEM),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{question}"),
])

def build_general_chat_chain():
    """
    Build a LangChain RunnableSequence for general medical Q&A 
    (no report context needed).
    """
    return _GENERAL_CHAT_PROMPT | get_llm(temperature=0.2) | StrOutputParser()


def clear_session_memory(session_id: str) -> None:
    """Clear a session's conversation memory (e.g. on new report upload)."""
    if session_id in _session_memories:
        del _session_memories[session_id]


# ── 5. Full RAG Chain (LCEL) ──────────────────────────────────────────────────
# Composes retrieval + prompt + LLM + parser in one LCEL expression

def build_rag_chain(report_context: str, alert_level: str, emergency: bool):
    """
    Build a one-shot RAG chain using LCEL (|) composition.

    This is the pure LangChain RAG pattern:
      retriever_fn → prompt → llm → output_parser

    Usage:
        chain = build_rag_chain(report_context, alert_level, emergency)
        answer = chain.invoke({"question": "What does my LDL mean?"})
    """
    # Our "retriever" injects the report context as a string
    retriever_fn = RunnableLambda(lambda x: {
        "report_context": report_context,
        "alert_level":    alert_level,
        "emergency":      "YES — seek immediate care" if emergency else "No",
        "history":        [],
        "question":       x["question"],
    })

    return retriever_fn | _CHAT_PROMPT | get_llm(temperature=0.2) | StrOutputParser()
