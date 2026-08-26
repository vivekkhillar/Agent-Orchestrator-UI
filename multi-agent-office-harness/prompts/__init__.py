"""
Prompts Package for LangGraph Banking Multi-Agent System
"""

from .intent_classification import INTENT_CLASSIFICATION_SYSTEM_PROMPT, build_intent_user_prompt
from .greetings_response import GREETINGS_SYSTEM_PROMPT, build_greetings_user_prompt, get_fallback_greetings_response
from .customer_response_synthesis import CUSTOMER_SYNTHESIS_SYSTEM_PROMPT, build_synthesis_user_prompt
from .agent_vk_balance import AGENT_VK_SYSTEM_PROMPT, build_vk_user_prompt
from .agent_ro_statement import AGENT_RO_SYSTEM_PROMPT, build_ro_user_prompt

__all__ = [
    "INTENT_CLASSIFICATION_SYSTEM_PROMPT",
    "build_intent_user_prompt",
    "GREETINGS_SYSTEM_PROMPT",
    "build_greetings_user_prompt",
    "get_fallback_greetings_response",
    "CUSTOMER_SYNTHESIS_SYSTEM_PROMPT",
    "build_synthesis_user_prompt",
    "AGENT_VK_SYSTEM_PROMPT",
    "build_vk_user_prompt",
    "AGENT_RO_SYSTEM_PROMPT",
    "build_ro_user_prompt",
]
