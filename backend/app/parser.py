import re
import dateparser

ACTION_KEYWORDS = [
    "will", "should", "needs to", "need to", "must",
    "action", "todo", "follow up", "assign", "responsible"
]

NEGATIVE_PATTERNS = [
    r"\bno\s+(other|further)?\s*action\s+items?\b",
    r"\bno\s+action\s+required\b",
    r"\bnothing\s+else\b",
]

def is_negative_statement(line: str) -> bool:
    text = line.lower().strip()
    return any(re.search(pattern, text) for pattern in NEGATIVE_PATTERNS)

def parse_actions(text: str):
    actions = []
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    for line in lines:
        if len(line) < 10:
            continue

        if is_negative_statement(line):
            continue

        is_action = any(k in line.lower() for k in ACTION_KEYWORDS)
        is_action = is_action or re.match(r"^[\-\*\d\.]", line)

        if not is_action:
            continue

        owner = None
        due = None

        owner_patterns = [
            r'@(\w+)',
            r'assigned to (\w+)',
            r'\((\w+)\)'
        ]
        for p in owner_patterns:
            m = re.search(p, line, re.IGNORECASE)
            if m:
                owner = m.group(1)
                break

        parsed_date = dateparser.parse(
            line,
            settings={"PREFER_DATES_FROM": "future"}
        )
        if parsed_date:
            due = parsed_date.date().isoformat()

        actions.append({
            "task": line,
            "owner": owner,
            "due_date": due
        })

    return actions if actions else [{
        "task": "No action items detected",
        "owner": None,
        "due_date": None
    }]
