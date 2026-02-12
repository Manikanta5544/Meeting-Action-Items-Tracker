import os, requests, json

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama3-8b-8192"

def extract_with_llm(text: str):
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return None

    payload = {
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": f"""
Extract action items from this transcript.
Return ONLY a JSON array.

Format:
[{{"task": "...", "owner": null, "due_date": null}}]

Transcript:
{text}
"""
        }]
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    try:
        r = requests.post(GROQ_URL, json=payload, headers=headers, timeout=10)
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as e:
        print("LLM failed:", e)
        return None
