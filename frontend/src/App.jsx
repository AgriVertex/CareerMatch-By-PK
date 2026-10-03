import { useMemo, useState } from "react";

const API = "http://127.0.0.1:8000";

const sampleResume = `Python Developer

I have 3 years of experience building web applications with Python, FastAPI,
TypeScript, React, Docker, and testing workflows. I designed APIs, built
frontend dashboards, and improved reliability across backend services.`;

const sampleJob = `Senior Frontend Engineer

We are looking for a senior frontend engineer with experience in React, JavaScript,
TypeScript, Next.js, REST APIs, Git, responsive design and testing.
Experience with HTML, CSS and Tailwind CSS is preferred.`;

function getDemoStorageKey(email) {
  return `careermatch-demo-used:${email.trim().toLowerCase()}`;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [demoUsed, setDemoUsed] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "User",
    email: "",
  });
  const [settingsForm, setSettingsForm] = useState({
    name: "User",
    email: "",
  });
  const [resume, setResume] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeSkills, setResumeSkills] = useState([]);
  const [job, setJob] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const summaryStats = useMemo(() => {
    if (!result) return [];
    return [
      { label: "Match score", value: `${result.match_score}%`, tone: "primary" },
      { label: "Matched skills", value: String(result.matched_skills.length), tone: "neutral" },
      { label: "Missing skills", value: String(result.missing_skills.length), tone: "warning" },
    ];
  }, [result]);

  function handleLogin(event) {
    event.preventDefault();
    const name = loginForm.name.trim();
    const email = loginForm.email.trim();
    const password = loginForm.password.trim();
    const emailValid = email.length > 0 && email.includes("@");
    const passwordValid = password.length >= 6;

    if (!name || !emailValid || !passwordValid) {
      setMessage("Enter your name, a valid email, and a password of at least 6 characters.");
      return;
    }

    const nextUser = { name, email };

    setUserProfile(nextUser);
    setSettingsForm(nextUser);
    setDemoUsed(localStorage.getItem(getDemoStorageKey(email)) === "true");
    setLoginForm({ name: "", email: "", password: "" });
    setIsAuthenticated(true);
    setProfileOpen(false);
    setSettingsOpen(false);
    setMessage(`Welcome, ${name}!`);
  }

  function handleLogout() {
    setProfileOpen(false);
    setSettingsOpen(false);
    setIsAuthenticated(false);
    setResult(null);
    setLoginForm({ name: "", email: "", password: "" });
    setMessage("");
  }

  async function handleTryDemo() {
    const storageKey = getDemoStorageKey(userProfile.email);
    if (demoUsed || localStorage.getItem(storageKey) === "true") {
      setDemoUsed(true);
      setMessage("The demo has already been used for this account in this browser.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const response = await fetch(`${API}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: sampleResume, job_description: sampleJob }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Demo analysis failed.");

      localStorage.setItem(storageKey, "true");
      setDemoUsed(true);
      setResumeText(sampleResume);
      setResumeSkills(data.resume_skills || []);
      setJob(sampleJob);
      setResult(data);
      setMessage("Demo analysis complete. You can now try your own resume and job description.");
    } catch (error) {
      setMessage(error instanceof TypeError
        ? "Could not reach the analysis server. Please make sure the backend is running."
        : error.message || "Demo analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleSaveSettings() {
    const name = settingsForm.name.trim() || "User";
    const email = settingsForm.email.trim() || userProfile.email || "";

    const validEmail = email.length === 0 || email.includes("@")
    if (!validEmail) {
      setMessage("Please enter a valid email in settings.");
      return;
    }

    const nextUser = { name, email };
    setUserProfile(nextUser);
    setSettingsForm(nextUser);
    setProfileOpen(false);
    setSettingsOpen(false);
    setMessage(`Profile updated for ${name}.`);
  }

  async function uploadResume(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf" || file.type === "application/octet-stream";
    if (!isPdf) {
      setMessage("Please upload a PDF resume file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Resume must be smaller than 5 MB.");
      return;
    }

    setMessage("");
    setResult(null);
    setResume(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setResumeSkills([]);
      const response = await fetch(`${API}/api/resume/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Upload failed.");

      setResumeText(data.text || "");
      setResumeSkills(Array.isArray(data.skills) ? data.skills : []);
      setMessage(`Resume analyzed successfully: ${data.filename || file.name}`);
    } catch (error) {
      setResume(null);
      setMessage(error instanceof TypeError
        ? "Could not reach the analysis server. Please make sure the backend is running."
        : error.message || "Resume upload failed.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function loadSampleResume() {
    setResume(null);
    setResumeText(sampleResume);
    setResumeSkills(["python", "fastapi", "react", "docker", "testing", "typescript"]);
    setMessage("Sample resume loaded. You can compare it with a job description instantly.");
    setResult(null);
  }

  async function analyzeMatch(event) {
    event.preventDefault();
    if (!resumeText.trim()) {
      setMessage("Upload or paste your resume text first.");
      return;
    }
    if (!job.trim()) {
      setMessage("Paste a job description first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const response = await fetch(`${API}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: job,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Matching failed.");
      setResult(data);
      setMessage(data.summary || "Analysis complete.");
    } catch (error) {
      setMessage(error instanceof TypeError
        ? "Could not reach the analysis server. Please make sure the backend is running."
        : error.message || "Matching failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-shell">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="orb orb-three" />

        <div className="auth-card">
          <div className="auth-copy">
            <div className="brand-wrap brand-inline">
              <span className="brand-mark">CM</span>
              <div>
                <div className="brand-name">CareerMatch by PK</div>
              </div>
            </div>

            <p className="eyebrow auth-eyebrow">Career intelligence</p>
            <h1>Design your next move with clarity.</h1>
            <p>
              Match your profile with the right opportunities and turn skill gaps into
              a focused growth roadmap.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="login-header">
              <h2>Welcome</h2>
              <span>Sign in to continue</span>
            </div>

            <label>
              <span>Your name</span>
              <input
                type="text"
                autoComplete="name"
                value={loginForm.name}
                onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                placeholder="Enter your name"
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="Enter your email"
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Enter your password"
              />
            </label>

            <div className="auth-row">
              <label className="remember-box">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <a href="#">Forgot password?</a>
            </div>

            <button type="submit" className="primary auth-button">
              Sign in
            </button>

            {message && <div className="message-banner auth-message">{message}</div>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <span className="brand-mark">CM</span>
          <div>
            <div className="brand-name">CareerMatch by PK</div>
            <small>Professional fit analysis</small>
          </div>
        </div>

        <div className="profile-menu">
          <button type="button" className="profile-button" onClick={() => setProfileOpen((open) => !open)}>
            <span className="profile-avatar">{userProfile.name.split(" ")[0].slice(0, 2).toUpperCase()}</span>
            <span className="profile-text">
              <strong>{userProfile.name}</strong>
              <small className="profile-email">{userProfile.email}</small>
            </span>
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <span className="profile-avatar large">{userProfile.name.split(" ")[0].slice(0, 2).toUpperCase()}</span>
                <div className="profile-meta">
                  <strong>{userProfile.name}</strong>
                  <small className="profile-email">{userProfile.email}</small>
                </div>
              </div>

              <button type="button" className="dropdown-item" onClick={() => {
                setSettingsOpen(true);
                setProfileOpen(false);
              }}>
                Settings
              </button>

              {settingsOpen && (
                <div className="settings-panel">
                  <label>
                    <span>Name</span>
                    <input
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    />
                  </label>
                  <button type="button" className="primary settings-save" onClick={handleSaveSettings}>
                    Save profile
                  </button>
                </div>
              )}

              <button type="button" className="dropdown-item danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="page-shell">
        <section className="hero-panel">
          <div>
            <p className="eyebrow">CAREER INTELLIGENCE PLATFORM</p>
            <h1>Know your fit before you apply.</h1>
            <p className="hero-copy">
              Compare your resume against the role, uncover gaps, and turn the opportunity
              into a clear action plan with measurable priorities.
            </p>
            <div className="demo-cta-row">
              <button type="button" className="secondary demo-button" onClick={handleTryDemo} disabled={loading || demoUsed}>
                {demoUsed ? "Demo used" : loading ? "Preparing demo..." : "Try for demo"}
              </button>
              <span className="demo-note">One demo analysis per account in this browser</span>
            </div>
          </div>
        </section>

        {message && <div className="message-banner">{message}</div>}

        <section className="workspace-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="label">STEP 01</p>
                <h2>Resume profile</h2>
              </div>
              <span className="step-number">01</span>
            </div>

            <label className="upload-box">
              <input type="file" accept=".pdf,application/pdf" onChange={uploadResume} />
              <span className="upload-icon">↑</span>
              <strong>{resume ? resume.name : "Choose PDF resume"}</strong>
              <small>{loading ? "Uploading and reading resume..." : "Text-based PDF · Maximum 5 MB"}</small>
            </label>

            <div className="panel-actions compact">
              <button type="button" className="secondary" onClick={loadSampleResume}>
                Load sample resume
              </button>
            </div>

            <div className="resume-preview">
              <div className="section-heading">Resume text</div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Upload a PDF or paste your resume text here..."
              />
            </div>

            {resumeSkills.length > 0 && (
              <div className="skill-section">
                <div className="section-heading">Detected strengths</div>
                <div className="chips">
                  {resumeSkills.map((skill) => (
                    <span className="chip" key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form className="panel" onSubmit={analyzeMatch}>
            <div className="panel-header">
              <div>
                <p className="label">STEP 02</p>
                <h2>Job requirements</h2>
              </div>
              <span className="step-number">02</span>
            </div>

            <textarea
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="Paste the complete job description here..."
            />

            <div className="panel-actions">
              <button type="button" className="secondary" onClick={() => setJob(sampleJob)}>
                Use sample role
              </button>
              <button className="primary" disabled={loading}>
                {loading ? "Analyzing..." : "Analyze match →"}
              </button>
            </div>
          </form>
        </section>

        {result && (
          <section className="insights-panel">
            <div className="result-header">
              <div>
                <p className="eyebrow">MATCH REPORT</p>
                <h2>Opportunity fit overview</h2>
              </div>
              <div className="score-badge">
                {result.match_score}
                <span>%</span>
              </div>
            </div>

            <div className="summary-grid">
              {summaryStats.map((stat) => (
                <div key={stat.label} className={`metric-card ${stat.tone}`}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className="score-track">
              <div style={{ width: `${result.match_score}%` }} />
            </div>

            <div className="summary-copy">
              <p>{result.summary}</p>
            </div>

            <div className="result-grid">
              <ResultCard
                title="Matched skills"
                items={result.matched_skills}
                empty="No direct matches detected in the skill dictionary yet."
                type="success"
              />
              <ResultCard
                title="Skill gaps"
                items={result.missing_skills}
                empty="No notable gaps identified from this starter dataset."
                type="warning"
              />
              <ResultCard
                title="Resume skills"
                items={result.resume_skills}
                empty="No skills detected from the uploaded resume text."
                type="normal"
              />
              <ResultCard
                title="Role priorities"
                items={result.top_keywords || []}
                empty="Add a detailed job description to surface its key priorities."
                type="normal"
              />
            </div>

            <div className="roadmap">
              <div className="roadmap-head">
                <div>
                  <p className="label">NEXT STEPS</p>
                  <h3>Priority roadmap</h3>
                </div>
              </div>

              {result.roadmap.length === 0 ? (
                <p className="muted">Your detected skills cover the listed requirements.</p>
              ) : (
                <div className="roadmap-list">
                  {result.roadmap.map((item, index) => (
                    <div className="roadmap-item" key={`${item.skill}-${index}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{item.skill}</strong>
                        <p>{item.action}</p>
                      </div>
                      <em>{item.priority}</em>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="site-footer">
          <div className="footer-brand">
            <strong>CareerMatch by PK</strong>
            <span>Make your next career move with clearer evidence.</span>
          </div>
          <div className="footer-details">
            <span>Resume and job skill comparison</span>
            <span>Skill gaps and practical next steps</span>
            <span>Resume text is processed for this analysis, not saved by this app</span>
            <small>Career insights are decision support, not a hiring guarantee.</small>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ResultCard({ title, items, empty, type }) {
  return (
    <div className={`result-card ${type}`}>
      <h3>{title}</h3>
      {items.length ? (
        <div className="chips">
          {items.map((item) => (
            <span className="chip" key={item}>{item}</span>
          ))}
        </div>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </div>
  );
}

export default App;
