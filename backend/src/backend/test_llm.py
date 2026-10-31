from llm import extract_json

assert extract_json('```json\n{"suggestions": []}\n```') == {"suggestions": []}
assert extract_json('<think>{"a": 1}</think>{"suggestions": [1]}') == {"suggestions": [1]}
assert extract_json('Sure! {"suggestions": []} hope it helps') == {"suggestions": []}

try:
    extract_json("no json here")
    raise SystemExit("FAIL: bad reply was accepted")
except ValueError:
    pass

print("PASS: JSON extraction handles messy model replies")