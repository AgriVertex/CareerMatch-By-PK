import unittest

from app.analyzer import analyze, extract_skills


class AnalyzerProfessionalOutputTests(unittest.TestCase):
    def test_analyze_returns_summary_metrics_and_roadmap(self):
        resume = """
        Python software engineer with React, FastAPI, Docker, and testing experience.
        I built APIs, dashboards, and web apps using TypeScript and Python.
        """
        job = """
        Senior full stack engineer needed for React.js, TypeScript, Python,
        FastAPI, REST APIs, Docker, and testing. Must work across frontend and backend.
        """

        result = analyze(resume, job)

        self.assertIn("coverage", result)
        self.assertIn("summary", result)
        self.assertIn("roadmap", result)
        self.assertIsInstance(result["roadmap"], list)
        self.assertTrue(result["summary"])
        self.assertGreaterEqual(result["coverage"], 0)
        self.assertLessEqual(result["coverage"], 100)

    def test_skill_detection_uses_word_boundaries(self):
        skills = extract_skills("JavaScript developer with React and Python experience.")

        self.assertIn("javascript", skills)
        self.assertIn("react", skills)
        self.assertIn("python", skills)
        self.assertNotIn("java", skills)

    def test_results_are_specific_to_resume_and_job_pair(self):
        python_result = analyze(
            "Python developer with FastAPI and Docker experience building APIs.",
            "Python engineer required with FastAPI, Docker, and PostgreSQL.",
        )
        design_result = analyze(
            "Product designer experienced in Figma and accessibility.",
            "UX designer required with Figma, accessibility, and user research.",
        )

        self.assertIn("fastapi", python_result["matched_skills"])
        self.assertIn("figma", design_result["matched_skills"])
        self.assertNotEqual(python_result["job_skills"], design_result["job_skills"])
        self.assertEqual(
            python_result,
            analyze(
                "Python developer with FastAPI and Docker experience building APIs.",
                "Python engineer required with FastAPI, Docker, and PostgreSQL.",
            ),
        )


if __name__ == "__main__":
    unittest.main()
