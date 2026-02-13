# Prompts Used

This file documents the prompts sent to the Groq LLM for extraction.

No system prompt chaining is used. A single user message is sent per extraction request.

---

## Main Extraction Prompt

Extract action items from this meeting transcript.

Return only a JSON array in the format:

[
{"task": "...", "owner": null, "due_date": null}
]

If owner or due date is not found, use null.

Transcript:
{transcript_text}

---

## Prompt Design Rationale

- Explicit JSON format reduces formatting drift
- "Return only JSON" prevents explanatory text
- Null values are enforced to avoid empty strings
- No few-shot examples to reduce token usage and latency

---

## Response Handling

The backend performs:

- Removal of markdown fences if present
- Strict JSON parsing
- Exception handling
- Automatic fallback to rule-based parser on failure

---

## Future Improvements (Not Implemented)

- Few-shot examples for higher consistency
- Structured output schema validation
- Confidence scoring

Not implemented due to assignment time constraints.
