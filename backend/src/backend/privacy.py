import json
import re

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+")
URL_RE = re.compile(r"(?:https?://|www\.)\S+|(?:linkedin|github)\.com/\S*", re.IGNORECASE)
PHONE_RE = re.compile(r"\+?\d[\d\s().-]{7,}\d")


class PrivacyError(Exception):
    pass


def _mask_phone(match: re.Match) -> str:
    digits = re.sub(r"\D", "", match.group())
    return "[PHONE]" if len(digits) >= 10 else match.group()


def scrub_text(text: str, contact: dict) -> str:
    if not text:
        return text

    text = EMAIL_RE.sub("[EMAIL]", text)
    text = URL_RE.sub("[LINK]", text)
    text = PHONE_RE.sub(_mask_phone, text)

    for field in ("full_name", "linkedin", "github", "portfolio"):
        value = contact.get(field, "").strip()
        if len(value) >= 3:
            text = re.sub(re.escape(value), "[REMOVED]", text, flags=re.IGNORECASE)

    for part in contact.get("full_name", "").split():
        if len(part) >= 3:
            text = re.sub(rf"\b{re.escape(part)}\b", "[NAME]", text, flags=re.IGNORECASE)

    return text


def _scrub_any(value, contact: dict):
    if isinstance(value, str):
        return scrub_text(value, contact)
    if isinstance(value, list):
        return [_scrub_any(item, contact) for item in value]
    if isinstance(value, dict):
        return {key: _scrub_any(item, contact) for key, item in value.items()}
    return value


def assert_clean(ai_view: dict, contact: dict) -> None:
    blob = json.dumps(ai_view, ensure_ascii=False).lower()
    leaks = []

    for field in ("full_name", "phone", "email", "linkedin", "github", "portfolio"):
        value = contact.get(field, "").strip().lower()
        if len(value) >= 3 and value in blob:
            leaks.append(field)

    for part in contact.get("full_name", "").split():
        if len(part) >= 3 and re.search(rf"\b{re.escape(part.lower())}\b", blob):
            leaks.append("name part")

    phone_digits = re.sub(r"\D", "", contact.get("phone", ""))
    if len(phone_digits) >= 10 and phone_digits[-10:] in re.sub(r"\D", "", blob):
        leaks.append("phone digits")

    if leaks:
        raise PrivacyError(f"Blocked: personal data still present ({', '.join(set(leaks))})")


def build_ai_view(contact: dict, content: dict) -> dict:
    ai_view = _scrub_any(content, contact)
    assert_clean(ai_view, contact)
    return ai_view