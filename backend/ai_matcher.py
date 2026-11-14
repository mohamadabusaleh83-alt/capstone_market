"""
AI Matching & Recommendation Engine for Capstone Market.
Pure Python, lightweight (< 5MB RAM), zero heavy ML frameworks, 100% deterministic.

Features:
- Bilingual (Arabic/English) Skills Ontology and Synonym Graph
- Word and Character N-Gram TF-IDF Vectorizer with Cosine Similarity
- Multi-Factor Explainable Scoring (Skills 50%, Semantic 30%, Major 10%, Profile 10%)
- Dynamic Arabic Explanations & Gap Analysis
"""

import math
import re
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Set, Tuple, Any


# ==========================================
# 1. تطهير ومعالجة النصوص ثنائية اللغة (عربي / إنجليزي)
# ==========================================

_ARABIC_DIACRITICS = re.compile(r"[\u064B-\u0652\u0640]")  # التشكيل والتطويل
_NON_ALPHANUM = re.compile(r"[^\w\s\+\#\.\-]", re.UNICODE)
_MULTI_SPACE = re.compile(r"\s+")


def normalize_text(text: Optional[str]) -> str:
    """تطهير وتوحيد النصوص العربية والإنجليزية بدقة وسرعة فائقة"""
    if not text or not isinstance(text, str):
        return ""
    
    t = text.strip().lower()
    # إزالة علامات التشكيل والتطويل
    t = _ARABIC_DIACRITICS.sub("", t)
    
    # توحيد أشكال الهمزات والألف والياء والتاء المربوطة
    t = re.sub(r"[إأآٱ]", "ا", t)
    t = re.sub(r"ة\b", "ه", t)
    t = re.sub(r"ى\b", "ي", t)
    t = re.sub(r"ؤ", "و", t)
    t = re.sub(r"ئ", "ي", t)
    
    # استبدال الرموز غير النصية بمسافات مع الحفاظ على C++, C#, .NET
    t = t.replace("c++", "cpp").replace("c#", "csharp").replace(".net", "dotnet")
    t = _NON_ALPHANUM.sub(" ", t)
    t = _MULTI_SPACE.sub(" ", t)
    return t.strip()


# ==========================================
# 2. أنطولوجيا المهارات التقنية والمترادفات (Bilingual Skills Ontology)
# ==========================================

CANONICAL_SKILLS_MAP: Dict[str, str] = {
    # Python & Frameworks
    "python": "python", "بايثون": "python", "python3": "python", "py": "python",
    "django": "django", "ديجانجو": "django", "دجانغو": "django",
    "fastapi": "fastapi", "فاست ابي": "fastapi", "فاست_اي_بي_اي": "fastapi",
    "flask": "flask", "فلاسك": "flask",
    
    # JavaScript / TypeScript & Web Frontend
    "javascript": "javascript", "js": "javascript", "جافاسكريبت": "javascript", "جافا سكريبت": "javascript",
    "typescript": "typescript", "ts": "typescript", "تايب سكريبت": "typescript",
    "react": "react", "react.js": "react", "reactjs": "react", "رياكت": "react", "رياكت جي اس": "react",
    "vue": "vue", "vue.js": "vue", "vuejs": "vue", "فيو": "vue",
    "angular": "angular", "انجولار": "angular", "انغيولار": "angular",
    "next.js": "nextjs", "nextjs": "nextjs", "نيكست": "nextjs", "نيكست جي اس": "nextjs",
    "html": "html", "html5": "html", "اتش تي ام ال": "html",
    "css": "css", "css3": "css", "سي اس اس": "css",
    "tailwind": "tailwindcss", "tailwindcss": "tailwindcss", "تيلويند": "tailwindcss",
    "bootstrap": "bootstrap", "بوتستراب": "bootstrap",
    "frontend": "frontend", "front-end": "frontend", "تطوير الواجهات": "frontend", "واجهات المستخدم": "frontend", "فرونت اند": "frontend", "فرونت": "frontend",
    "web development": "web_dev", "تطوير الويب": "web_dev", "مواقع الويب": "web_dev", "web": "web_dev", "ويب": "web_dev",

    # Backend & Runtimes
    "nodejs": "nodejs", "node.js": "nodejs", "node": "nodejs", "نود": "nodejs", "نود جي اس": "nodejs",
    "express": "express", "expressjs": "express", "اكسبريس": "express",
    "backend": "backend", "back-end": "backend", "الواجهات الخلفية": "backend", "باك اند": "backend", "باك": "backend", "تطوير الخوادم": "backend",
    "fullstack": "fullstack", "full-stack": "fullstack", "تطوير شامل": "fullstack", "فول ستاك": "fullstack",
    "api": "api", "rest api": "api", "restful": "api", "واجهة برمجية": "api",

    # AI / Machine Learning / Data Science
    "machine learning": "machine_learning", "ml": "machine_learning", "تعلم الالة": "machine_learning", "تعلم الآلة": "machine_learning",
    "deep learning": "deep_learning", "dl": "deep_learning", "تعلم عميق": "deep_learning",
    "artificial intelligence": "ai", "ai": "ai", "ذكاء اصطناعي": "ai", "الذكاء الاصطناعي": "ai",
    "data science": "data_science", "علم البيانات": "data_science",
    "data analysis": "data_analysis", "data analytics": "data_analysis", "تحليل البيانات": "data_analysis",
    "nlp": "nlp", "natural language processing": "nlp", "معالجة اللغات الطبيعية": "nlp",
    "computer vision": "computer_vision", "cv": "computer_vision", "رؤية حاسوبية": "computer_vision", "معالجة الصور": "computer_vision",
    "tensorflow": "tensorflow", "تنسرفلو": "tensorflow",
    "pytorch": "pytorch", "بايتورش": "pytorch",
    "scikit-learn": "scikit_learn", "scikitlearn": "scikit_learn", "sklearn": "scikit_learn",
    "pandas": "pandas", "بانداس": "pandas",
    "numpy": "numpy", "نامباي": "numpy",
    "power bi": "power_bi", "powerbi": "power_bi", "باور بي اي": "power_bi",
    "tableau": "tableau", "تابلو": "tableau",
    "big data": "big_data", "بيانات ضخمة": "big_data",

    # Databases
    "sql": "sql", "اس كيو ال": "sql", "spl": "sql",
    "postgresql": "postgresql", "postgres": "postgresql", "بوستجريس": "postgresql", "بوستجر": "postgresql",
    "mysql": "mysql", "ماي اس كيو ال": "mysql",
    "sqlite": "sqlite", "سيكولايت": "sqlite",
    "mongodb": "mongodb", "مونجو": "mongodb", "nosql": "nosql",
    "redis": "redis", "ريديس": "redis",
    "database": "database", "قواعد بيانات": "database", "قواعد البيانات": "database",

    # Mobile Development
    "flutter": "flutter", "فلاتر": "flutter",
    "react native": "react_native", "reactnative": "react_native", "رياكت نيتف": "react_native",
    "android": "android", "اندرويد": "android",
    "ios": "ios", "ايفون": "ios", "swift": "swift", "سويفت": "swift",
    "kotlin": "kotlin", "كوتلن": "kotlin",
    "mobile development": "mobile_dev", "تطبيقات الجوال": "mobile_dev", "تطبيقات الهاتف": "mobile_dev", "موبايل": "mobile_dev",

    # DevOps & Cloud & Infrastructure
    "docker": "docker", "دوكر": "docker",
    "kubernetes": "kubernetes", "k8s": "kubernetes", "كوبرنيتس": "kubernetes",
    "cloud": "cloud", "سحابية": "cloud", "الحوسبة السحابية": "cloud",
    "aws": "aws", "امازون ويب سيرفس": "aws",
    "azure": "azure", "ازور": "azure",
    "gcp": "gcp", "google cloud": "gcp",
    "devops": "devops", "ديف اوبس": "devops",
    "ci/cd": "cicd", "cicd": "cicd",
    "git": "git", "github": "github", "جيت": "git", "جيت هاب": "github",
    "linux": "linux", "لينكس": "linux",

    # Cybersecurity & Networks
    "cybersecurity": "cybersecurity", "security": "cybersecurity", "امن سيبراني": "cybersecurity", "الأمن السيبراني": "cybersecurity", "أمن المعلومات": "cybersecurity",
    "ethical hacking": "ethical_hacking", "اختراق اخلاقي": "ethical_hacking",
    "penetration testing": "pen_testing", "اختبار اختراق": "pen_testing",
    "cryptography": "cryptography", "تشفير": "cryptography",
    "networking": "networking", "شبكات": "networking", "شبكات الحاسب": "networking", "cisco": "cisco",

    # IoT & Embedded Systems
    "iot": "iot", "internet of things": "iot", "انترنت الاشياء": "iot", "إنترنت الأشياء": "iot",
    "arduino": "arduino", "اردوينو": "arduino",
    "raspberry pi": "raspberry_pi", "راسبيري باي": "raspberry_pi",
    "embedded systems": "embedded", "انظمة مدمجة": "embedded", "أنظمة مدمجة": "embedded",

    # Other Languages
    "cpp": "cpp", "c++": "cpp", "سي بلس بلس": "cpp",
    "csharp": "csharp", "c#": "csharp", "سي شارب": "csharp",
    "dotnet": "dotnet", ".net": "dotnet", "دوت نت": "dotnet",
    "java": "java", "جافا": "java",
    "php": "php", "بي اتش بي": "php",
    "laravel": "laravel", "لارافيل": "laravel",
    "golang": "golang", "go": "golang", "جو": "golang",
    "rust": "rust", "رست": "rust",

    # UI/UX & Design
    "ui/ux": "ui_ux", "ui": "ui_ux", "ux": "ui_ux", "ui_ux": "ui_ux",
    "figma": "figma", "فيجما": "figma",
    "design": "ui_ux", "تصميم واجهات": "ui_ux", "تجربة المستخدم": "ui_ux"
}

# المجموعات البديلة ذات الصلة المباشرة لمنح نقاط أساسية جزئية فقط (Related Substitute Clusters)
# تُفصل بصرامة لضمان عدم معاملة التقنيات المستقلة كأنها متطابقة (مثل فصل لغات البرمجة عن قواعد البيانات)
RELATED_SUBSTITUTE_CLUSTERS: List[Set[str]] = [
    # قواعد البيانات العلائقية
    {"sql", "postgresql", "mysql", "sqlite", "database"},
    # قواعد بيانات NoSQL
    {"mongodb", "nosql", "redis"},
    # أطر عمل الواجهات الأمامية
    {"react", "vue", "angular", "nextjs"},
    # تقنيات التنسيق والتصميم
    {"css", "tailwindcss", "bootstrap"},
    # لغات الويب الأساسية
    {"javascript", "typescript"},
    # أطر عمل بايثون للويب
    {"django", "fastapi", "flask"},
    # بيئات عمل نود للويب
    {"nodejs", "express"},
    # أطر تطوير تطبيقات الجوال الهجينة
    {"flutter", "react_native"},
    # تطوير أندرويد الأصيل
    {"android", "kotlin"},
    # تطوير آيفون الأصيل
    {"ios", "swift"},
    # منصات الحوسبة السحابية
    {"aws", "azure", "gcp", "cloud"},
    # الحاويات وإدارتها
    {"docker", "kubernetes"},
    # أطر التعلم العميق
    {"tensorflow", "pytorch"},
    # أدوات ومكتبات تحليل البيانات
    {"pandas", "numpy", "data_analysis"},
    # أدوات ذكاء الأعمال والتقارير
    {"power_bi", "tableau"},
    # مجالات الأمن واختبار الاختراق
    {"ethical_hacking", "pen_testing", "cybersecurity"},
    # أنظمة مدمجة وإنترنت الأشياء
    {"arduino", "raspberry_pi", "embedded", "iot"}
]

# للتوافقية
SKILL_CLUSTERS = RELATED_SUBSTITUTE_CLUSTERS

# الأسماء الرسمية للعرض الأنيق في الواجهة
DISPLAY_NAMES: Dict[str, str] = {
    "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript",
    "react": "React", "vue": "Vue.js", "angular": "Angular", "nextjs": "Next.js",
    "html": "HTML", "css": "CSS", "tailwindcss": "TailwindCSS", "bootstrap": "Bootstrap",
    "nodejs": "Node.js", "express": "Express", "fastapi": "FastAPI", "django": "Django",
    "flask": "Flask", "sql": "SQL", "postgresql": "PostgreSQL", "mysql": "MySQL",
    "mongodb": "MongoDB", "sqlite": "SQLite", "redis": "Redis",
    "flutter": "Flutter", "react_native": "React Native", "android": "Android",
    "ios": "iOS", "swift": "Swift", "kotlin": "Kotlin",
    "machine_learning": "Machine Learning", "deep_learning": "Deep Learning",
    "ai": "Artificial Intelligence", "data_science": "Data Science",
    "data_analysis": "Data Analysis", "nlp": "NLP", "computer_vision": "Computer Vision",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch", "scikit_learn": "Scikit-Learn",
    "pandas": "Pandas", "numpy": "NumPy", "power_bi": "Power BI", "tableau": "Tableau",
    "docker": "Docker", "kubernetes": "Kubernetes", "aws": "AWS", "azure": "Azure",
    "gcp": "Google Cloud", "devops": "DevOps", "git": "Git", "linux": "Linux",
    "cybersecurity": "Cybersecurity", "networking": "Networking",
    "iot": "Internet of Things (IoT)", "arduino": "Arduino", "embedded": "Embedded Systems",
    "cpp": "C++", "csharp": "C#", "dotnet": ".NET", "java": "Java", "php": "PHP",
    "laravel": "Laravel", "golang": "Go", "rust": "Rust",
    "ui_ux": "UI/UX", "figma": "Figma", "frontend": "Frontend",
    "backend": "Backend", "fullstack": "Full-Stack", "web_dev": "Web Development",
    "mobile_dev": "Mobile Development"
}


# تطبيع كافة المفاتيح في جدول المترادفات والأنطولوجيا لضمان الدقة الكاملة
NORMALIZED_CANONICAL_SKILLS_MAP: Dict[str, str] = {
    normalize_text(k): v for k, v in CANONICAL_SKILLS_MAP.items() if k
}


def canonicalize_skill(raw_skill: str) -> Tuple[str, str]:
    """
    تحويل أي مسمى مهارة إلى معرّفه القياسي واسم العرض المنسق.
    ترجع (canonical_key, display_name).
    """
    if not raw_skill or not isinstance(raw_skill, str):
        return "", ""
    
    clean = raw_skill.strip()
    norm = normalize_text(clean)
    
    # 1. فحص المطابقة المباشرة في القاموس المعياري
    if norm in NORMALIZED_CANONICAL_SKILLS_MAP:
        canon = NORMALIZED_CANONICAL_SKILLS_MAP[norm]
        return canon, DISPLAY_NAMES.get(canon, clean)
    
    # 2. فحص الكلمات المركبة داخل النص
    for key, canon in NORMALIZED_CANONICAL_SKILLS_MAP.items():
        if f" {key} " in f" {norm} " or norm == key:
            return canon, DISPLAY_NAMES.get(canon, clean)
    
    # 3. إذا لم تكن مسجلة في القاموس، استخدام الاسم الأصلي المنظف
    fallback_key = norm.replace(" ", "_")
    return fallback_key, clean.title()


def parse_skills_list(skills_input: Any) -> List[Tuple[str, str]]:
    """استخراج وتوحيد قائمة المهارات من نص أو قائمة"""
    if not skills_input:
        return []
    
    raw_list: List[str] = []
    if isinstance(skills_input, list):
        raw_list = [str(s) for s in skills_input if s]
    elif isinstance(skills_input, str):
        # فصل المهارات بالفواصل أو الأسطر
        raw_list = re.split(r"[,;\n\r]+", skills_input)
    
    seen_keys: Set[str] = set()
    results: List[Tuple[str, str]] = []
    
    for item in raw_list:
        clean = item.strip().strip("'\"<>")
        if not clean:
            continue
        canon_key, disp = canonicalize_skill(clean)
        if canon_key and canon_key not in seen_keys:
            seen_keys.add(canon_key)
            results.append((canon_key, disp))
            
    return results


# ==========================================
# 3. محرك TF-IDF والنماذج الشعاعية بلغة بايثون النقية (Pure Python TF-IDF)
# ==========================================

class PureTFIDF:
    """
    محرك استخراج الميزات النحوية والشعاعية بحساب الترددات وتردد الوثائق المعكوس.
    يستخدم Word N-Grams و Character N-Grams لدعم التشابه الصرفي واللغوي للعربية والإنجليزية.
    خفيف جداً ومثالي لمواصفات السحابة المجانية بدون أي مكتبات ثقيلة.
    """
    def __init__(self):
        self.doc_freq: Dict[str, int] = defaultdict(int)
        self.num_docs: int = 0
        self.idf_cache: Dict[str, float] = {}

    def _tokenize(self, text: str) -> List[str]:
        norm = normalize_text(text)
        if not norm:
            return []
        
        words = norm.split()
        tokens = list(words)
        
        # Word Bigrams
        for i in range(len(words) - 1):
            tokens.append(f"{words[i]}_{words[i+1]}")
            
        # Character N-Grams (3-to-4 grams) لمعالجة التصريف العربي والأخطاء الإملائية
        for word in words:
            if len(word) >= 3:
                for n in (3, 4):
                    for i in range(len(word) - n + 1):
                        tokens.append(f"char_{word[i:i+n]}")
                        
        return tokens

    def fit(self, documents: List[str]) -> "PureTFIDF":
        """تدريب نموذج الـ IDF على مجموعة النصوص المرجعية"""
        self.doc_freq.clear()
        self.idf_cache.clear()
        self.num_docs = len(documents)
        
        for doc in documents:
            tokens = set(self._tokenize(doc))
            for tok in tokens:
                self.doc_freq[tok] += 1
                
        # حساب IDF مع التنعيم الرياضي Smooth IDF: log((1 + N) / (1 + df)) + 1
        for tok, df in self.doc_freq.items():
            self.idf_cache[tok] = math.log((1.0 + self.num_docs) / (1.0 + df)) + 1.0
            
        return self

    def transform(self, text: str) -> Dict[str, float]:
        """تحويل النص إلى متجه أوزان TF-IDF مقاس معيارياً L2"""
        tokens = self._tokenize(text)
        if not tokens:
            return {}
        
        counts = Counter(tokens)
        total_tokens = len(tokens)
        
        vec: Dict[str, float] = {}
        for tok, count in counts.items():
            tf = count / total_tokens
            # الكلمات الجديدة غير المعروفة تأخذ IDF افتراضي للوثائق النادرة
            idf = self.idf_cache.get(tok, math.log(1.0 + self.num_docs) + 1.0)
            vec[tok] = tf * idf
            
        # تسوية المتجه L2 Normalization
        norm = math.sqrt(sum(v * v for v in vec.values()))
        if norm > 1e-9:
            for k in vec:
                vec[k] /= norm
                
        return vec

    @staticmethod
    def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        """حساب جيب تمام الزاوية (Cosine Similarity) بين متجهين في نطاق [0.0, 1.0]"""
        if not vec1 or not vec2:
            return 0.0
        
        # نضرب فقط في المفاتيح المشتركة لسرعة فائقة O(min(len1, len2))
        smaller, larger = (vec1, vec2) if len(vec1) < len(vec2) else (vec2, vec1)
        dot_product = sum(weight * larger.get(term, 0.0) for term, weight in smaller.items())
        return max(0.0, min(1.0, dot_product))


# ==========================================
# 4. حساب توافق التخصص الأكاديمي (Major Compatibility)
# ==========================================

MAJOR_NORMALIZATION: Dict[str, str] = {
    "software engineering": "se", "هندسة البرمجيات": "se", "برمجيات": "se", "se": "se",
    "computer science": "cs", "علوم الحاسب": "cs", "علوم الحاسوب": "cs", "علم الحاسوب": "cs", "cs": "cs",
    "artificial intelligence": "ai_ds", "ذكاء اصطناعي": "ai_ds", "الذكاء الاصطناعي": "ai_ds", "ai": "ai_ds",
    "data science": "ai_ds", "علم البيانات": "ai_ds", "ds": "ai_ds",
    "information technology": "it", "تقنية المعلومات": "it", "تكنولوجيا المعلومات": "it", "it": "it",
    "information systems": "is", "نظم المعلومات": "is", "أنظمة المعلومات": "is", "cis": "is", "mis": "is",
    "computer engineering": "ce", "هندسة الحاسوب": "ce", "هندسة الحاسب": "ce", "ce": "ce",
    "cybersecurity": "cyber", "امن سيبراني": "cyber", "الأمن السيبراني": "cyber", "أمن المعلومات": "cyber", "cyber": "cyber",
    "networks": "net", "شبكات": "net", "شبكات الحاسب": "net"
}

NORMALIZED_MAJOR_MAP: Dict[str, str] = {
    normalize_text(k): v for k, v in MAJOR_NORMALIZATION.items() if k
}

# المجالات المتوافقة بشدة مع كل تخصص
MAJOR_TECH_DOMAINS: Dict[str, Set[str]] = {
    "se": {"web_dev", "frontend", "backend", "fullstack", "mobile_dev", "cloud", "devops", "sql", "api", "software"},
    "cs": {"ai", "machine_learning", "data_science", "deep_learning", "nlp", "computer_vision", "backend", "python", "algorithms"},
    "ai_ds": {"ai", "machine_learning", "data_science", "data_analysis", "nlp", "computer_vision", "deep_learning", "python"},
    "it": {"web_dev", "database", "cloud", "networking", "linux", "devops", "it"},
    "is": {"database", "data_analysis", "power_bi", "web_dev", "sql", "systems"},
    "ce": {"iot", "embedded", "networking", "arduino", "raspberry_pi", "cpp", "hardware"},
    "cyber": {"cybersecurity", "networking", "cloud", "linux", "ethical_hacking", "pen_testing"},
    "net": {"networking", "cloud", "iot", "cybersecurity", "cisco"}
}


def evaluate_major_compatibility(student_major: Optional[str], project_category: Optional[str], project_text: str) -> float:
    """
    حساب نسبة توافق تخصص الطالب مع متطلبات وتصنيف المشروع من [0.0 إلى 100.0].
    """
    if not student_major:
        return 70.0  # إذا لم يحدد الطالب تخصصه بعد، يعطى درجة محايدة جيدة
    
    clean_major = normalize_text(student_major)
    major_code = None
    for pattern, code in NORMALIZED_MAJOR_MAP.items():
        if pattern in clean_major:
            major_code = code
            break
            
    if not major_code:
        # فحص مباشر
        major_code = "cs"  # افتراضي للتخصصات الحاسوبية العامة
        
    favored_domains = MAJOR_TECH_DOMAINS.get(major_code, set())
    
    clean_cat = normalize_text(project_category or "")
    clean_proj = normalize_text(project_text)
    
    # 1. مطابقة مباشرة بين اسم التخصص وفئة المشروع
    for pattern, code in NORMALIZED_MAJOR_MAP.items():
        if pattern in clean_cat:
            if code == major_code:
                return 100.0
            else:
                return 75.0  # تخصصات تكنولوجيا المعلومات تتقارب عموماً
                
    # 2. استخراج المهارات والمجالات التقنية من نص المشروع وفئته
    combined_proj = f"{clean_cat} {clean_proj}"
    extracted_canonical = set()
    for raw_key, canon in NORMALIZED_CANONICAL_SKILLS_MAP.items():
        if f" {raw_key} " in f" {combined_proj} " or combined_proj == raw_key:
            extracted_canonical.add(canon)

    matched_domains = len(favored_domains.intersection(extracted_canonical))
    if matched_domains >= 2:
        return 95.0
    elif matched_domains == 1:
        return 88.0
    else:
        for domain in favored_domains:
            if domain in combined_proj:
                matched_domains += 1
        if matched_domains > 0:
            return 85.0
        return 70.0


# ==========================================
# 5. حساب اكتمال الملف الشخصي وخبرة الطالب (Profile Completeness)
# ==========================================

def evaluate_profile_completeness(user: Any, profile: Optional[Any]) -> float:
    """
    حساب درجة اكتمال الملف الشخصي [0.0 إلى 100.0] بناءً على:
    - وجود مهارات مسجلة (30%)
    - وجود نبذة تعريفية Bio (25%)
    - وجود رابط معرض أعمال / GitHub / Portfolio (25%)
    - رفع السيرة الذاتية CV (20%)
    """
    score = 0.0
    
    # 1. المهارات
    user_skills = getattr(user, "skills", None) or (profile and getattr(profile, "skills", None))
    if user_skills and len(str(user_skills).strip()) > 2:
        score += 30.0
        
    # 2. النبذة
    bio = getattr(user, "bio", None) or (profile and getattr(profile, "bio", None))
    if bio and len(str(bio).strip()) >= 15:
        score += 25.0
    elif bio and len(str(bio).strip()) > 0:
        score += 15.0
        
    # 3. رابط البورتفوليو أو الأعمال
    portfolio = getattr(user, "portfolio_url", None) or (profile and getattr(profile, "portfolio_url", None))
    if portfolio and len(str(portfolio).strip()) > 5:
        score += 25.0
        
    # 4. السيرة الذاتية المرفوعة
    cv_key = profile and getattr(profile, "cv_key", None)
    if cv_key:
        score += 20.0
    else:
        # إذا كانت بيانات الطالب قوية بدون ملف pdf
        score += 10.0
        
    return min(100.0, max(20.0, score))


# ==========================================
# 6. التوليد الديناميكي لتفسير الذكاء الاصطناعي (Dynamic Arabic Explanation)
# ==========================================

def generate_arabic_explanation(
    match_score: float,
    project_title: str,
    matched_skills: List[str],
    missing_skills: List[str],
    major_compatible: bool,
    major_name: Optional[str] = None
) -> str:
    """
    توليد نص تفسيري احترافي وذكي باللغة العربية يشرح سبب الترشيح،
    المهارات المتوافقة، وفرص التطوير بدون أي عبارات عامية أو عشوائية.
    """
    matched_count = len(matched_skills)
    missing_count = len(missing_skills)
    
    matched_str = "، ".join(matched_skills[:3]) if matched_skills else ""
    missing_str = "، ".join(missing_skills[:2]) if missing_skills else ""
    
    major_phrase = f"تخصصك الأكاديمي ({major_name})" if major_name else "مسارك الأكاديمي"

    if match_score >= 80.0:
        if matched_count > 0:
            exp = f"تطابق استثنائي ({match_score}%)! تتكامل مهاراتك في ({matched_str}) بشكل مباشر مع المتطلبات التقنية لمشروع «{project_title}»"
            if major_compatible:
                exp += f"، مع توافق رفيع مع {major_phrase}."
            else:
                exp += "."
        else:
            exp = f"تطابق مرتفع جداً ({match_score}%) لمشروع «{project_title}» وفقاً لتحليل الاهتمامات والتشابه الدلالي مع ملفك الأكاديمي."
            
        if missing_str:
            exp += f" الإلمام بـ ({missing_str}) سيعزز تميزك في هذا المشروع."
        return exp

    elif match_score >= 60.0:
        if matched_count > 0:
            exp = f"تطابق واعد ({match_score}%). تمتلك رصيداً تقنياً جيداً يشمل ({matched_str}) يؤهلك للمساهمة الفاعلة في «{project_title}»."
        else:
            exp = f"تطابق جيد ({match_score}%) مع توجهات مشروع «{project_title}» استناداً إلى اهتماماتك وتخصصك الأكاديمي."
            
        if missing_str:
            exp += f" ننصح بتعزيز مهاراتك في ({missing_str}) لضمان الجاهزية القصوى."
        return exp

    else:
        if matched_count > 0:
            exp = f"تطابق تمهيدي ({match_score}%). يغطي ملفك بعض متطلبات «{project_title}» مثل ({matched_str})"
            if missing_str:
                exp += f"، لكن المشروع يتطلب تعزيز خبرتك في ({missing_str})."
            else:
                exp += "."
        else:
            exp = f"فرصة لتوسيع المعرفة ({match_score}%). يتطلب مشروع «{project_title}» مهارات إضافية مثل ({missing_str or 'تقنيات متقدمة'}) تشكل تحدياً تدريبياً قيماً."
            
        return exp


# ==========================================
# 7. محرك المطابقة المتكامل (AIMatchingEngine)
# ==========================================

class AIMatchingEngine:
    """
    محرك المطابقة والترشيح الذكي الشامل.
    يحسب درجات المطابقة بين الطالب والمشاريع بناءً على 4 معايير معلنة:
    1. المهارات المباشرة والمترادفة (50%)
    2. التشابه الدلالي النحوي TF-IDF (30%)
    3. توافق التخصص الأكاديمي (10%)
    4. اكتمال الملف الشخصي وخبرة الطالب (10%)
    """
    def __init__(self):
        self.vectorizer = PureTFIDF()
        self._fitted = False

    def build_project_corpus(self, projects: List[Any]) -> List[str]:
        """إنشاء نصوص المشاريع للتدريب الشعاعي"""
        corpus = []
        for p in projects:
            title = getattr(p, "title", "") or ""
            desc = getattr(p, "description", "") or ""
            skills = getattr(p, "required_skills", "") or ""
            cat = getattr(p, "category", "") or ""
            corpus.append(f"{title} {desc} {skills} {cat}")
        return corpus

    def calculate_explicit_skill_match(
        self,
        student_skills: List[Tuple[str, str]],
        project_skills: List[Tuple[str, str]]
    ) -> Tuple[float, List[str], List[str]]:
        """
        حساب نسبة تطابق المهارات الصريحة والمترادفة.
        ترجع (score_0_to_100, matched_display_list, missing_display_list)
        """
        if not project_skills:
            # إذا لم يحدد المشروع مهارات، لا نظلم الطالب ونعطيه درجة متوسطة مشجعة
            return (70.0, [d for _, d in student_skills], [])

        if not student_skills:
            # الطالب لم يدخل أي مهارة بعد
            return (0.0, [], [d for _, d in project_skills])

        student_keys = {canon for canon, _ in student_skills}
        student_map = {canon: disp for canon, disp in student_skills}

        matched_display: List[str] = []
        missing_display: List[str] = []
        earned_score = 0.0

        for p_canon, p_disp in project_skills:
            # 1. مطابقة قياسية مباشرة أو مترادف لغوي مطابق (Exact Canonical Match) -> 1.0
            if p_canon in student_keys:
                earned_score += 1.0
                matched_display.append(p_disp)
                continue

            # 2. المهارة غير متوفرة مباشرة لدى الطالب وتسجل كمهارة مطلوبة
            missing_display.append(p_disp)

            # هل يمتلك الطالب مهارة بديلة وثيقة الصلة في نفس المجال التخصصي الدقيق؟
            for cluster in RELATED_SUBSTITUTE_CLUSTERS:
                if p_canon in cluster:
                    common = cluster.intersection(student_keys)
                    if common:
                        # رصيد جزئي للأساسيات القابلة للنقل (0.35) دون الادعاء بامتلاك المهارة ذاتها
                        earned_score += 0.35
                        break

        raw_ratio = earned_score / len(project_skills)
        final_score = min(100.0, max(0.0, raw_ratio * 100.0))
        return (final_score, matched_display, missing_display)

    def evaluate_project_for_student(
        self,
        student_user: Any,
        student_profile: Optional[Any],
        project: Any
    ) -> Dict[str, Any]:
        """
        تقييم مشروع محدد لطالب معين وإرجاع النتيجة الكاملة مع التفسير والتقسيم.
        """
        # استخراج مهارات الطالب والمشروع
        raw_user_skills = getattr(student_user, "skills", "") or (student_profile and getattr(student_profile, "skills", "")) or ""
        student_skills = parse_skills_list(raw_user_skills)

        raw_project_skills = getattr(project, "required_skills", "") or ""
        project_skills = parse_skills_list(raw_project_skills)

        # 1. Explicit Skill Match (50%)
        explicit_score, matched_skills, missing_skills = self.calculate_explicit_skill_match(
            student_skills, project_skills
        )

        # 2. Semantic Similarity TF-IDF (30%)
        student_bio = getattr(student_user, "bio", "") or (student_profile and getattr(student_profile, "bio", "")) or ""
        student_major = getattr(student_user, "major", "") or (student_profile and getattr(student_profile, "major", "")) or ""
        student_interests = (student_profile and getattr(student_profile, "interests", "")) or ""
        student_doc = f"{raw_user_skills} {student_interests} {student_bio} {student_major}"

        p_title = getattr(project, "title", "") or ""
        p_desc = getattr(project, "description", "") or ""
        p_cat = getattr(project, "category", "") or ""
        project_doc = f"{p_title} {p_desc} {raw_project_skills} {p_cat}"

        vec_student = self.vectorizer.transform(student_doc)
        vec_project = self.vectorizer.transform(project_doc)
        cosine_sim = PureTFIDF.cosine_similarity(vec_student, vec_project)
        semantic_score = round(cosine_sim * 100.0, 1)

        # 3. Major Compatibility (10%)
        major_score = evaluate_major_compatibility(student_major, p_cat, project_doc)
        major_compatible = major_score >= 70.0

        # 4. Profile Completeness (10%)
        profile_score = evaluate_profile_completeness(student_user, student_profile)

        # الحساب التراكمي النهائي وفق الأوزان المعتمدة
        composite_score = (
            explicit_score * 0.50 +
            semantic_score * 0.30 +
            major_score * 0.10 +
            profile_score * 0.10
        )
        composite_score = round(min(100.0, max(0.0, composite_score)), 1)

        # توليد الشرح العربي
        ai_exp = generate_arabic_explanation(
            match_score=composite_score,
            project_title=p_title,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            major_compatible=major_compatible,
            major_name=student_major
        )

        return {
            "project_id": getattr(project, "id", None),
            "match_score": composite_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "major_compatible": major_compatible,
            "score_breakdown": {
                "explicit_skill_score": round(explicit_score, 1),
                "semantic_similarity_score": round(semantic_score, 1),
                "major_compatibility_score": round(major_score, 1),
                "profile_completeness_score": round(profile_score, 1),
                "weights": {
                    "explicit_skills": 50,
                    "semantic_similarity": 30,
                    "major_compatibility": 10,
                    "profile_completeness": 10
                }
            },
            "ai_explanation": ai_exp
        }

    def recommend_projects_for_student(
        self,
        student_user: Any,
        student_profile: Optional[Any],
        projects: List[Any],
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        تقييم وترشيح المشاريع المعتمدة فقط للطالب وترتيبها تنازلياً حسب درجة المطابقة.
        """
        # تدريب الـ TF-IDF على نصوص المشاريع الحالية
        corpus = self.build_project_corpus(projects)
        if corpus:
            self.vectorizer.fit(corpus)
            self._fitted = True

        scored_projects: List[Dict[str, Any]] = []

        for p in projects:
            # التحقق الصارم من حالة المشروع: فقط المشاريع المعتمدة
            status = getattr(p, "status", None)
            if status not in ("approved", "academically_approved"):
                continue

            eval_result = self.evaluate_project_for_student(student_user, student_profile, p)
            # دمج كائن المشروع أو بياناته الأساسية
            eval_result["project"] = p
            scored_projects.append(eval_result)

        # ترتيب تنازلي حسب match_score
        scored_projects.sort(key=lambda x: x["match_score"], reverse=True)

        if limit and limit > 0:
            scored_projects = scored_projects[:limit]

        return scored_projects


# نسخة مفردة مشتركة للاستخدام المباشر
default_matcher = AIMatchingEngine()
