"""
AI Project Analyzer — Phase 2
Capstone Market: طبقة عزل كاملة للذكاء الاصطناعي.
لا تعتمد على ai_matcher.py إلا لتوحيد المهارات (read-only).
"""
import os
import json
import re
import logging
from typing import Optional, Tuple
from datetime import datetime, timezone

import httpx  # موجود أصلاً كـ fastapi transitive dependency

from ai_matcher import canonicalize_skill, parse_skills_list  # Phase 1 reuse — read-only

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_DEFAULT_MODEL = "gemini-3.8-flash"
GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", GEMINI_DEFAULT_MODEL)

# ==========================================
# تعليمات النظام — Arabic-first
# ==========================================

SYSTEM_PROMPT_AR = """
أنت محلل تقني متخصص في مشاريع التخرج الجامعية.
سيصف لك شريك صناعي (شركة) مشكلة أو فرصة تجارية بلغة عادية غير تقنية.

مهمتك الوحيدة: تحليل الوصف وتوليد مخطط تقني منظم لمشروع تخرج.

**قواعد صارمة:**
- لا تخترع تفاصيل غير مذكورة في الوصف.
- إذا كان الوصف غامضاً، أعط مهارات عامة وأشر إلى ذلك في الشرح.
- اقترح فقط مهارات حقيقية يمكن لطلاب الجامعة تعلمها.
- أعد إجابتك حصراً بـ JSON منظم وفق المخطط المحدد.
"""

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "suggested_skills": {"type": "ARRAY", "items": {"type": "STRING"}},
        "suggested_category": {"type": "STRING"},
        "complexity_level": {
            "type": "STRING",
            "enum": ["simple", "medium", "complex", "advanced"]
        },
        "complexity_explanation_ar": {"type": "STRING"},
        "complexity_explanation_en": {"type": "STRING"},
        "expected_deliverables": {"type": "ARRAY", "items": {"type": "STRING"}},
        "technical_summary_ar": {"type": "STRING"},
        "technical_summary_en": {"type": "STRING"},
        "skill_explanations": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "skill": {"type": "STRING"},
                    "reason_ar": {"type": "STRING"},
                    "reason_en": {"type": "STRING"}
                },
                "required": ["skill", "reason_ar", "reason_en"]
            }
        },
        "suggested_seat_range": {"type": "STRING"},
        "analysis_confidence": {"type": "NUMBER"}
    },
    "required": [
        "suggested_skills", "complexity_level",
        "complexity_explanation_ar", "complexity_explanation_en",
        "expected_deliverables", "technical_summary_ar", "technical_summary_en",
        "skill_explanations", "suggested_seat_range", "analysis_confidence"
    ]
}


class GeminiAdapter:
    """AIProviderAdapter — Gemini Flash عبر REST مع مصادقة الهيدر الآمنة (x-goog-api-key)"""

    def __init__(self, api_key: str, model_id: Optional[str] = None):
        self.api_key = api_key
        self.model_id = model_id or os.getenv("GEMINI_MODEL_ID", GEMINI_DEFAULT_MODEL)
        self.url = f"{GEMINI_API_BASE}/{self.model_id}:generateContent"

    def generate(self, prompt: str) -> dict:
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": RESPONSE_SCHEMA,
                "temperature": 0.3,
                "maxOutputTokens": 2048
            },
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT_AR}]}
        }
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key
        }
        with httpx.Client(timeout=12.0) as client:
            resp = client.post(self.url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw_text)


class LocalFallbackAdapter:
    """
    تحليل محلي احتياطي — يعمل بدون AI API.
    يستخرج المهارات المعروفة من الأنطولوجيا فقط.
    لا يُولّد ملخصاً لغوياً طبيعياً ولا يتظاهر بكونه AI حقيقي.
    """

    def generate(self, description: str) -> dict:
        # استخراج المهارات المعروفة فقط من النص
        raw_skills = parse_skills_list(description)
        known_skills = [display for _, display in raw_skills[:8]]

        return {
            "suggested_skills": known_skills,
            "suggested_category": None,
            "complexity_level": "medium",
            "complexity_explanation_ar": (
                "تعذّر التحليل الذكي. تم استخراج المهارات المذكورة صراحةً في الوصف فقط. "
                "يرجى التحقق مع المشرف الأكاديمي."
            ),
            "complexity_explanation_en": (
                "AI analysis unavailable. Only skills explicitly mentioned in the description were extracted. "
                "Please verify with the academic supervisor."
            ),
            "expected_deliverables": [],
            "technical_summary_ar": (
                "تعذّر توليد الملخص التقني. الوصف الأصلي متاح للمشرف للمراجعة اليدوية."
            ),
            "technical_summary_en": (
                "Technical summary unavailable. The original description is available for manual supervisor review."
            ),
            "skill_explanations": [],
            "suggested_seat_range": "يحدده المشرف",
            "analysis_confidence": 0.0
        }


class ProjectAnalyzer:
    """المحلل الرئيسي — يفوّض للـ Adapter المناسب"""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self._adapter = GeminiAdapter(api_key)
            self._is_fallback = False
        else:
            self._adapter = LocalFallbackAdapter()
            self._is_fallback = True
            logger.warning("GEMINI_API_KEY not set — using local fallback analyzer")

    def analyze(self, description: str, language: str = "ar") -> dict:
        """نقطة الدخول الوحيدة. ترجع مخطط ProjectAnalysisResponse."""
        try:
            if self._is_fallback:
                raw = self._adapter.generate(description)
            else:
                prompt = self._build_prompt(description, language)
                raw = self._adapter.generate(prompt)

            # التوحيد الإلزامي للمهارات عبر Phase 1 — MANDATORY
            canonicalized_skills, skill_explanations = self._canonicalize_skills(
                raw.get("suggested_skills", []),
                raw.get("skill_explanations", [])
            )

            return {
                "suggested_skills": canonicalized_skills,
                "suggested_category": raw.get("suggested_category"),
                "complexity_level": raw.get("complexity_level", "medium"),
                "complexity_explanation_ar": raw.get("complexity_explanation_ar", ""),
                "complexity_explanation_en": raw.get("complexity_explanation_en", ""),
                "expected_deliverables": raw.get("expected_deliverables", []),
                "technical_summary_ar": raw.get("technical_summary_ar", ""),
                "technical_summary_en": raw.get("technical_summary_en", ""),
                "skill_explanations": skill_explanations,
                "suggested_seat_range": raw.get("suggested_seat_range", "2-4 طلاب"),
                "analysis_confidence": float(raw.get("analysis_confidence", 0.0)),
                "provider_used": "local_fallback" if self._is_fallback else "gemini",
                "model_id": "local" if self._is_fallback else getattr(self._adapter, "model_id", GEMINI_DEFAULT_MODEL),
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "is_fallback": self._is_fallback,
                "disclaimer_ar": (
                    "هذا تحليل اقتراحي للمساعدة فقط. "
                    "المشرف الأكاديمي هو المسؤول الوحيد عن تحديد المتطلبات النهائية وعدد المقاعد."
                ),
                "disclaimer_en": (
                    "This is a suggestive analysis only. "
                    "The academic supervisor has sole authority over final requirements and seat allocation."
                ),
            }

        except httpx.TimeoutException:
            logger.error("Gemini API timeout")
            raise  # يُحوَّل إلى 503 في main.py
        except Exception as e:
            logger.error(f"ProjectAnalyzer error: {e}", exc_info=True)
            raise

    def _build_prompt(self, description: str, language: str) -> str:
        sanitized = self._sanitize(description)
        if language == "ar":
            return (
                "حلّل هذا الوصف التجاري وأنتج مخططاً تقنياً لمشروع تخرج جامعي:\n\n"
                f"---\n{sanitized}\n---\n\n"
                "أجب بـ JSON منظم وفق المخطط المطلوب."
            )
        return (
            "Analyze this business description and produce a technical plan for a university capstone project:\n\n"
            f"---\n{sanitized}\n---\n\n"
            "Respond with structured JSON as specified."
        )

    def _sanitize(self, text: str) -> str:
        """تعقيم النص لمنع Prompt Injection"""
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'```[\s\S]*?```', '[code block removed]', text)
        text = re.sub(
            r'(ignore|forget|disregard|تجاهل|انس).{0,30}(instructions|prompt|تعليمات)',
            '[filtered]', text, flags=re.IGNORECASE
        )
        return text[:5000].strip()

    def _canonicalize_skills(
        self, raw_skills: list, raw_explanations: list
    ) -> Tuple[list, list]:
        """
        تمرير كل مهارة عبر محرك Phase 1 للتوحيد — إلزامي.
        يضمن توافق مخرجات Phase 2 مع مطابقة الطلاب في Phase 1.
        """
        seen: set = set()
        canonical_display_names: list = []
        name_map: dict = {}  # raw_name_lower → display_name

        for skill in raw_skills:
            canon_key, display_name = canonicalize_skill(skill)
            if canon_key and canon_key not in seen:
                seen.add(canon_key)
                canonical_display_names.append(display_name)
                name_map[skill.lower()] = display_name

        # تحديث أسماء المهارات في التفسيرات بالأسماء الموحدة
        updated_explanations = []
        for exp in raw_explanations:
            raw_skill = exp.get("skill", "")
            display = name_map.get(raw_skill.lower(), raw_skill)
            if display in canonical_display_names:  # فقط المهارات الموحدة
                updated_explanations.append({
                    "skill": display,
                    "reason_ar": exp.get("reason_ar", ""),
                    "reason_en": exp.get("reason_en", "")
                })

        return canonical_display_names, updated_explanations


# Singleton — يُشارك عبر جميع الطلبات
_analyzer_instance: Optional[ProjectAnalyzer] = None


def get_analyzer() -> ProjectAnalyzer:
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = ProjectAnalyzer()
    return _analyzer_instance
