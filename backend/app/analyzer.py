import re
from collections import Counter

SKILLS = {
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "javascript": ["javascript", "js", "ecmascript"],
    "typescript": ["typescript", "ts"],
    "react": ["react", "react.js", "reactjs"],
    "next.js": ["next.js", "nextjs", "next js"],
    "vue": ["vue", "vue.js"],
    "angular": ["angular"],
    "tailwind css": ["tailwind", "tailwind css"],
    "bootstrap": ["bootstrap"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "google cloud": ["google cloud", "gcp"],
    "kubernetes": ["kubernetes", "k8s"],
    "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
    "linux": ["linux"],
    "agile": ["agile"],
    "scrum": ["scrum"],
    "jira": ["jira"],
    "graphql": ["graphql"],
    "redis": ["redis"],
    "spring boot": ["spring boot"],
    "php": ["php"],
    "ruby": ["ruby"],
    "go": ["golang", "go language"],
    "power bi": ["power bi", "powerbi"],
    "excel": ["excel", "microsoft excel"],
    "data analysis": ["data analysis", "data analytics"],
    "data science": ["data science"],
    "project management": ["project management", "project manager"],
    "communication": ["communication", "communicate effectively"],
    "leadership": ["leadership", "team leadership"],
    "cybersecurity": ["cybersecurity", "cyber security"],
    "node.js": ["node.js", "nodejs", "node js"],
    "express": ["express", "express.js"],
    "python": ["python"],
    "fastapi": ["fastapi"],
    "django": ["django"],
    "flask": ["flask"],
    "java": ["java"],
    "c++": ["c++"],
    "sql": ["sql"],
    "mysql": ["mysql"],
    "postgresql": ["postgresql", "postgres"],
    "mongodb": ["mongodb", "mongo db"],
    "git": ["git"],
    "github": ["github"],
    "docker": ["docker"],
    "rest api": ["rest api", "restful api", "restful services", "api development", "rest apis"],
    "testing": ["testing", "unit testing", "jest", "pytest"],
    "figma": ["figma"],
    "machine learning": ["machine learning", "ml"],
    "artificial intelligence": ["artificial intelligence", "ai"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "opencv": ["opencv"],
    "mediapipe": ["mediapipe"],
    "streamlit": ["streamlit"],
    "qiskit": ["qiskit"],
    "responsive design": ["responsive design", "responsive web"],
    "accessibility": ["accessibility", "web accessibility"],
}

STOP_WORDS = {
    "with", "for", "from", "into", "this", "that", "these", "those",
    "about", "across", "must", "work", "using", "build", "built",
    "team", "role", "skills", "years", "experience", "experienced",
    "senior", "developer", "engineer", "engineering", "needed", "looking",
    "strong", "candidate", "ability", "passion", "through", "would",
    "highly", "preferred", "including", "understand", "understanding",
    "required", "position", "full", "stack", "teams", "deliver", "enable"
}


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def _has_alias_match(text: str, alias: str) -> bool:
    term = alias.lower().strip()
    if not term:
        return False

    pattern = rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])"
    for match in re.finditer(pattern, text):
        start, end = match.span()
        before = text[start - 1] if start > 0 else " "
        after = text[end] if end < len(text) else " "
        before_is_token_joiner = before in ".-/" and start > 1 and text[start - 2].isalnum()
        after_is_token_joiner = after in ".-/" and end + 1 < len(text) and text[end + 1].isalnum()
        if before_is_token_joiner or after_is_token_joiner:
            continue
        return True
    return False


def extract_skills(text: str):
    normalized = normalize(text)
    found = []
    for canonical, aliases in SKILLS.items():
        for alias in sorted(aliases, key=len, reverse=True):
            term = alias.lower().strip()
            if _has_alias_match(normalized, term):
                found.append(canonical)
                break
    return sorted(set(found))


def extract_keywords(text: str):
    tokens = re.findall(r"[a-z0-9]+(?:[./+-][a-z0-9]+)*", normalize(text))
    filtered = []
    for token in tokens:
        token = token.strip(".,;:!?()[]{}\"'")
        if not token or len(token) < 4:
            continue
        if token in STOP_WORDS:
            continue
        filtered.append(token)
    frequency = Counter(filtered)
    return [word for word, _ in frequency.most_common(8)]


def score_match(resume_skills, job_skills):
    resume_set = set(resume_skills)
    job_set = set(job_skills)
    if not job_set:
        return 0
    matched = resume_set & job_set
    return round((len(matched) / len(job_set)) * 100)


def analyze(resume_text: str, job_description: str):
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)
    matched = sorted(set(resume_skills) & set(job_skills))
    missing = sorted(set(job_skills) - set(resume_skills))
    score = score_match(resume_skills, job_skills)

    top_keywords = extract_keywords(job_description)

    roadmap = [
        {
            "skill": skill,
            "priority": "High" if i < 3 else "Medium",
            "action": f"Build a focused project around {skill} and validate it in a small portfolio example."
        }
        for i, skill in enumerate(missing[:5])
    ]

    if score >= 80:
        summary = "Strong fit — you already cover most of the key requirements for this role."
    elif score >= 60:
        summary = "Good foundation — a few strategic skill gaps remain to improve fit and confidence."
    elif score > 0:
        summary = "Promising start — the role is still a stretch, but the right upskilling plan can close the gap."
    else:
        summary = "This role is a significant skill stretch. Start with the highest-priority gaps below."

    if missing:
        summary = f"{summary} Next priority: {', '.join(missing[:3])}."

    return {
        "match_score": score,
        "coverage": score,
        "summary": summary,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "matched_skills": matched,
        "missing_skills": missing,
        "top_keywords": top_keywords,
        "roadmap": roadmap,
    }
