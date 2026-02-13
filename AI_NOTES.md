# AI Usage Notes

This document explains where AI is used, where it is not used, and how the system behaves when AI is unavailable.

---

## 1. Scope of AI Usage

AI is used only for one purpose:

### Action Item Extraction

Given a free-form meeting transcript, the LLM extracts:
- task (required)
- owner (optional)
- due_date (optional)

All other application logic is deterministic and implemented manually.

---

## 2. Example

Input:

- John will send the Q4 report by Friday
- Sarah to follow up with client
- Team needs to review proposal

Expected output:

[
  {"task": "John will send the Q4 report by Friday", "owner": "John", "due_date": "2025-02-21"},
  {"task": "Sarah to follow up with client", "owner": "Sarah", "due_date": null},
  {"task": "Team needs to review proposal", "owner": null, "due_date": null}
]

If no action items are found, the system returns an empty list.

---

## 3. What AI Does NOT Do

AI is not responsible for:

- UI rendering
- Input validation
- Database writes
- Filtering (All / Open / Done)
- History tracking
- Error handling
- Status reporting

All of the above are deterministic and implemented in code.

---

## 4. LLM Provider

Provider: Groq  
Model: llama3-8b-8192  

### Why Groq

- Fast inference
- Free tier suitable for assignment scope
- Good structured extraction performance
- Simple OpenAI-compatible API

The model is used strictly for structured extraction, not generation.

---

## 5. Fallback Strategy

The application is designed to work even if the LLM is unavailable.

### Failure Scenarios

1. No API key configured  
   → System switches to rule-based parser  
   → Status endpoint shows "fallback-only"

2. API error or timeout  
   → Retry once  
   → Fallback to rule-based parser

3. Invalid JSON response  
   → Parsing fails  
   → Fallback to rule-based parser

The user always receives a response.

---

## 6. Rule-Based Parser

The fallback parser detects action items using:

- Bullet point detection (-, *, numbered lists)
- Keyword detection ("will", "should", "needs to", "action")
- Regex-based owner detection (@name, "(Name)", "assigned to X")
- Fuzzy date parsing via dateparser

The rule-based approach is simpler and less context-aware but ensures reliability.

---

## 7. Output Validation

After LLM extraction:

- Markdown fences are stripped if present
- JSON is parsed strictly
- If parsing fails, fallback is triggered
- No inferred fields are fabricated

Owner and due_date default to null if not confidently detected.

---

## 8. Known Limitations

- English transcripts only
- No contextual understanding beyond provided text
- Ambiguous dates depend on dateparser interpretation
- LLM extraction quality may vary depending on transcript structure

---

## 9. Design Principle

AI is treated as an enhancement layer, not a system dependency.

The system remains fully functional without AI.

---

## 10. AI Usage in Development & Testing

AI tools were also used during development to generate sample meeting transcripts for manual testing.

These transcripts were used to:
- Test extraction accuracy (owner + due date detection)
- Simulate edge cases (no action items, ambiguous dates, mixed formats)
- Validate fallback behavior

No AI-generated data is stored permanently in the system.
All runtime behavior (parsing, persistence, filtering, UI rendering) is deterministic and implemented manually.

