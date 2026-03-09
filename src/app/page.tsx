"use client";

import { useState, useCallback, useRef } from "react";

type DiagramType = "SFD" | "CLD";

// ── Example prompts (from the paper) ────────────────────────────────────
const EXAMPLES = [
  {
    icon: "🦠",
    title: "SIR Disease Model",
    desc: "Classic epidemic spread with susceptible, infected & recovered populations",
    text: `Model the spread of a contagious disease in a closed population of 1,000 people.

Variables:
- Susceptible population (S): people who can become infected. Initial value = 995.
- Infected population (I): people currently infected and able to transmit. Initial value = 5.
- Recovered population (R): people who have recovered with permanent immunity. Initial value = 0.

Parameters:
- Contact infectivity (β) = 0.3 persons/persons/day — how many contacts per day and the probability of transmission.
- Duration of infection = 5 days — average time someone stays infectious.

Rules:
- Infection rate = S × I / Total Population × β
- Recovery rate = I / Duration
- Total Population = S + I + R (constant, no births or deaths)

Simulate for 100 days with a time step of 0.03125 days.`,
    options: { initialTime: 0, finalTime: 100, timeStep: 0.03125, timeUnits: "Day" },
  },
  {
    icon: "📦",
    title: "Inventory Management",
    desc: "Manufacturing supply chain with demand forecasting & workforce dynamics",
    text: `A manufacturing firm supplies customers from a stock of finished inventory.

1. Desired production is determined by anticipated (forecasted) shipments, modified by a correction to maintain inventory at the desired stock.
2. The firm forecasts shipments by averaging past orders over an eight-week period.
3. The firm tries to correct discrepancies between desired and actual inventory in eight weeks.
4. Desired inventory is four weeks' worth of anticipated shipments.
5. Actual production rate equals desired production.
6. Initial inventory equals desired inventory, and initial average order rate equals shipment rate.

Customer orders equal a constant of 1,000 units/week until week 10, when orders step up by 10% and remain at the higher rate.

The firm has a no-layoff policy. Workers stay an average of 50 weeks. It takes 24 weeks to hire and train new workers. Hiring replaces quitters plus corrections to reach desired workforce.

Simulate for 100 weeks.`,
    options: { initialTime: 0, finalTime: 100, timeStep: 0.25, timeUnits: "Week" },
  },
  {
    icon: "🦐",
    title: "Fishery Model",
    desc: "Shrimp population with logistic growth, fleet harvesting & technology change",
    text: `Model a shrimp fishery on the Gulf of Mexico coast from 1950 to 2000.

1. Shrimp Population Dynamics:
   - Grows at 50% per year (natural growth rate).
   - Growth is limited by carrying capacity of 37,500 tons.
   - Population change = population increase - harvest.
   - Population increase depends on current population and how close it is to carrying capacity (logistic growth).
   - Initial shrimp population: 20,000 tons.

2. Fishing Fleet and Catch:
   - Harvest depends on catch capacity and the ratio of shrimp population to carrying capacity.
   - Catch capacity = fleet size × boat efficiency.
   - Boat efficiency starts at 60 tons/boat/year and increases 5% per year.
   - Fleet size: 200 boats (constant).

Simulate from 1950 to 2000 with yearly time steps.`,
    options: { initialTime: 1950, finalTime: 2000, timeStep: 1, timeUnits: "Year" },
  },
];

// ── SVG Icons ───────────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const BoltIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Page Component ──────────────────────────────────────────────────────
export default function Home() {
  const [description, setDescription] = useState("");
  const [initialTime, setInitialTime] = useState("0");
  const [finalTime, setFinalTime] = useState("100");
  const [timeStep, setTimeStep] = useState("1");
  const [timeUnits, setTimeUnits] = useState("Year");
  const [diagramType, setDiagramType] = useState<DiagramType>("SFD");
  const [mdlOutput, setMdlOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Progress state for SSE pipeline
  const [progressStep, setProgressStep] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressDetail, setProgressDetail] = useState("");

  // Image upload state
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/png");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageMimeType(file.type);
    setImagePreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageBase64(null);
    setImageMimeType("image/png");
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [imagePreviewUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  }, [handleImageFile]);

  const handleGenerate = useCallback(async () => {
    if (!description.trim() && !imageBase64) return;
    setLoading(true);
    setError("");
    setMdlOutput("");
    setProgressStep(0);
    setProgressTotal(0);
    setProgressMessage("Starting...");
    setProgressDetail("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description || undefined,
          initialTime: parseFloat(initialTime) || 0,
          finalTime: parseFloat(finalTime) || 100,
          timeStep: parseFloat(timeStep) || 1,
          timeUnits,
          diagramType,
          imageBase64: imageBase64 || undefined,
          imageMimeType: imageBase64 ? imageMimeType : undefined,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) {
        setError("Failed to read response stream.");
        setLoading(false);
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "progress") {
                setProgressStep(event.step);
                setProgressTotal(event.totalSteps);
                setProgressMessage(event.message);
                setProgressDetail(event.detail || "");
              } else if (event.type === "done") {
                setMdlOutput(event.mdl);
              } else if (event.type === "error") {
                setError(event.error);
              }
            } catch {
              // skip malformed events
            }
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
      setProgressStep(0);
      setProgressTotal(0);
      setProgressMessage("");
      setProgressDetail("");
    }
  }, [description, initialTime, finalTime, timeStep, timeUnits, diagramType, imageBase64, imageMimeType]);

  const handleDownload = useCallback(() => {
    if (!mdlOutput) return;
    const blob = new Blob([mdlOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const nameMatch = description.match(/model(?:ing)?\s+(?:the\s+)?(\w+)/i);
    const name = nameMatch ? nameMatch[1].toLowerCase() : "model";
    a.download = `${name}_vensim.mdl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [mdlOutput, description]);

  const handleCopy = useCallback(() => {
    if (!mdlOutput) return;
    navigator.clipboard.writeText(mdlOutput).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  }, [mdlOutput]);

  const handleExampleClick = (example: (typeof EXAMPLES)[number]) => {
    setDescription(example.text);
    if (example.options) {
      setInitialTime(String(example.options.initialTime));
      setFinalTime(String(example.options.finalTime));
      setTimeStep(String(example.options.timeStep));
      setTimeUnits(example.options.timeUnits);
    }
    setMdlOutput("");
    setError("");
  };

  const canGenerate = description.trim().length > 0 || !!imageBase64;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-badge">
          <SparkleIcon />
          Powered by DAVID© Methodology & Gemini AI
        </div>
        <h1>Vensim AI</h1>
        <p>
          Transform natural language descriptions or diagram images into complete Vensim simulation
          models. Describe your system and download a ready-to-use <strong>.mdl</strong> file.
        </p>
      </header>

      {/* Main Card */}
      <div className="glass-card" style={{ padding: "28px" }}>
        {/* Diagram Type Selector */}
        <div className="section">
          <label className="section-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16M4 12h16M4 19h16" />
            </svg>
            Diagram Type
          </label>
          <div className="diagram-type-toggle">
            <button
              className={`toggle-btn ${diagramType === "SFD" ? "active" : ""}`}
              onClick={() => setDiagramType("SFD")}
            >
              <span className="toggle-icon">📊</span>
              <span className="toggle-label">Stock & Flow (SFD)</span>
              <span className="toggle-desc">Stocks, flows, auxiliaries</span>
            </button>
            <button
              className={`toggle-btn ${diagramType === "CLD" ? "active" : ""}`}
              onClick={() => setDiagramType("CLD")}
            >
              <span className="toggle-icon">🔄</span>
              <span className="toggle-label">Causal Loop (CLD)</span>
              <span className="toggle-desc">Feedback loops & polarity</span>
            </button>
          </div>
        </div>

        {/* Image Upload */}
        <div className="section">
          <label className="section-label">
            <ImageIcon />
            Upload Diagram Image
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)", marginLeft: 4 }}>(optional)</span>
          </label>
          {imagePreviewUrl ? (
            <div className="image-preview-container">
              <img src={imagePreviewUrl} alt="Uploaded diagram" className="image-preview" />
              <button className="image-remove-btn" onClick={handleRemoveImage} title="Remove image">
                <XIcon />
              </button>
              <div className="image-preview-badge">
                {diagramType === "CLD" ? "CLD" : "SFD"} diagram uploaded
              </div>
            </div>
          ) : (
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="upload-zone-icon">
                <ImageIcon />
              </div>
              <div className="upload-zone-text">
                Drop a diagram image here or <span className="upload-zone-link">browse files</span>
              </div>
              <div className="upload-zone-hint">PNG, JPG, or WEBP • The AI will parse and recreate this diagram</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />
            </div>
          )}
        </div>

        {/* Description Input */}
        <div className="section">
          <label className="section-label" htmlFor="system-description">
            <FileIcon />
            {imageBase64 ? "Additional Context" : "System Description"}
            {imageBase64 && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)", marginLeft: 4 }}>(optional — adds detail to the image)</span>}
          </label>
          <div className="textarea-wrapper">
            <textarea
              id="system-description"
              className="description-textarea"
              placeholder={imageBase64
                ? "Optionally add additional context or instructions for interpreting the uploaded diagram..."
                : "Describe the system you want to model. Include stocks, flows, parameters, initial values, and relationships between variables..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className="char-count">{description.length} chars</span>
          </div>
        </div>

        {/* Simulation Parameters */}
        <div className="section">
          <label className="section-label">
            <SettingsIcon />
            Simulation Parameters
          </label>
          <div className="params-row">
            <div className="param-group">
              <span className="param-label">Initial Time</span>
              <input
                id="initial-time"
                type="number"
                className="param-input"
                value={initialTime}
                onChange={(e) => setInitialTime(e.target.value)}
              />
            </div>
            <div className="param-group">
              <span className="param-label">Final Time</span>
              <input
                id="final-time"
                type="number"
                className="param-input"
                value={finalTime}
                onChange={(e) => setFinalTime(e.target.value)}
              />
            </div>
            <div className="param-group">
              <span className="param-label">Time Step</span>
              <input
                id="time-step"
                type="number"
                className="param-input"
                step="any"
                value={timeStep}
                onChange={(e) => setTimeStep(e.target.value)}
              />
            </div>
            <div className="param-group">
              <span className="param-label">Time Units</span>
              <input
                id="time-units"
                type="text"
                className="param-input"
                value={timeUnits}
                onChange={(e) => setTimeUnits(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="section">
          <label className="section-label">
            <BoltIcon />
            Quick Examples
          </label>
          <div className="examples-grid">
            {EXAMPLES.map((ex, i) => (
              <div
                key={i}
                className="example-card"
                onClick={() => handleExampleClick(ex)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleExampleClick(ex)}
              >
                <div className="example-icon">{ex.icon}</div>
                <div className="example-title">{ex.title}</div>
                <div className="example-desc">{ex.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          id="generate-btn"
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading || !canGenerate}
        >
          {loading ? (
            <>
              <div className="spinner" />
              Generating Model
              <div className="loading-dots">
                <span />
                <span />
                <span />
              </div>
            </>
          ) : (
            <>
              <SparkleIcon />
              {imageBase64 ? "Generate from Diagram" : "Generate Vensim Model"}
            </>
          )}
        </button>

        {/* Progress Bar */}
        {loading && progressTotal > 0 && (
          <div className="progress-container">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(progressStep / progressTotal) * 100}%` }}
              />
            </div>
            <div className="progress-steps">
              <span className="progress-step-label">
                Step {progressStep} of {progressTotal}
              </span>
              <span className="progress-percentage">
                {Math.round((progressStep / progressTotal) * 100)}%
              </span>
            </div>
            <div className="progress-message">{progressMessage}</div>
            {progressDetail && (
              <div className="progress-detail">{progressDetail}</div>
            )}
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <AlertIcon />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Output */}
      {mdlOutput && (
        <div className="output-section">
          <div className="glass-card" style={{ padding: "24px" }}>
            <div className="output-header">
              <div className="output-title">
                <CheckIcon />
                Model Generated Successfully
              </div>
              <div className="output-actions">
                <button className="action-btn" onClick={handleCopy}>
                  <CopyIcon />
                  Copy
                </button>
                <button className="action-btn primary" onClick={handleDownload}>
                  <DownloadIcon />
                  Download .mdl
                </button>
              </div>
            </div>
            <div className="code-block">
              <div className="code-block-header">
                <span className="code-filename">model_vensim.mdl</span>
              </div>
              <div className="code-content">
                <pre>{mdlOutput}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>
          Inspired by the{" "}
          <a
            href="https://youtu.be/t1yKiHKLBE8"
            target="_blank"
            rel="noopener noreferrer"
          >
            DAVID© (Draw A Vensim Initial Draft)
          </a>{" "}
          methodology by Martín-García, Campuzano-Bolarín &amp; López-López.
        </p>
      </footer>

      {/* Copy toast */}
      <div className={`copy-toast ${showToast ? "visible" : ""}`}>
        ✓ Copied to clipboard
      </div>
    </div>
  );
}
