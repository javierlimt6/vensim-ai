# Vensim AI

Built by [Javier Lim](https://javlim.dev)
> ⚠️ **Beta** — This model is not yet fine-tuned. Outputs may contain errors and should be verified before use.

Transform natural language descriptions or diagram images into complete [Vensim](https://vensim.com/) `.mdl` simulation models, powered by the DAVID© (Draw A Vensim Initial Draft) methodology.

## Features

- **Text-to-Model** — Describe a system in plain English and get a complete `.mdl` file
- **Diagram-to-Model** — Upload a Stock and Flow Diagram (SFD) or Causal Loop Diagram (CLD) image and generate the corresponding `.mdl`
- **DAVID© Methodology** — Structured 7-step prompt pipeline: Variable Extraction → Mapping → Equations → Control Section → Sketch → Self-Verification → Assembly
- **Real-time Progress** — Server-Sent Events (SSE) stream pipeline progress to the frontend
- **One-click Download** — Download the generated `.mdl` file ready to open in Vensim

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19, Vanilla CSS |
| AI Model | [Qwen3-VL-235B](https://huggingface.co/Qwen/Qwen3-VL-235B-A22B) via [OpenRouter](https://openrouter.ai/) |
| API Format | OpenAI-compatible chat completions (multimodal) |
| Streaming | Server-Sent Events (SSE) |

## Architecture

```
┌──────────────┐     POST /api/generate     ┌──────────────────┐
│              │  ──────────────────────────▶│                  │
│   Frontend   │                            │   Next.js API    │
│   (React)    │  ◀─── SSE progress ────────│   Route Handler  │
│              │  ◀─── SSE done/error ──────│                  │
└──────────────┘                            └────────┬─────────┘
                                                     │
                                                     │ OpenRouter API
                                                     ▼
                                            ┌──────────────────┐
                                            │  Qwen3-VL-235B   │
                                            │  (Thinking)      │
                                            └──────────────────┘
```

### Pipeline

**Text input:**
```
Description → buildSystemPrompt() → Qwen3-VL → strip <think> tags → clean .mdl → download
```

**Image input:**
```
Image + context → buildImagePrompt() → Qwen3-VL (multimodal) → strip <think> tags → clean .mdl → download
```

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenRouter](https://openrouter.ai/) API key

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/vensim-ai.git
cd vensim-ai

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local and add your OpenRouter API key:
# OPENROUTER_API_KEY=your_key_here

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | API key from [OpenRouter](https://openrouter.ai/) |

## Project Structure

```
src/
├── app/
│   ├── api/generate/
│   │   └── route.ts          # SSE API endpoint, model orchestration
│   ├── globals.css            # Design system & component styles
│   ├── layout.tsx             # Root layout with metadata
│   └── page.tsx               # Main UI (form, progress bar, output)
└── lib/
    └── mdl-format.ts          # Prompt builders, MDL reference example
```

## Prompt Engineering (DAVID© Methodology)

The prompts follow the DAVID© methodology adapted from *"How ChatGPT Writes a Complete Vensim Model"* (Campuzano-Bolarín et al.):

1. **Variable Extraction** — Identify stocks, flows, auxiliaries, constants
2. **Element Mapping** — Classify diagram elements to Vensim types
3. **Equation Formulation** — Write dimensionally consistent equations with proper INTEG() usage
4. **Control Section** — Set simulation parameters (time bounds, time step, units)
5. **Sketch Generation** — Produce Vensim sketch code for visual layout
6. **Self-Verification** — Count elements, verify arrow→equation reflection, check for orphans
7. **Assembly** — Combine into a valid `.mdl` file starting with `{UTF-8}`

## Disclaimers

- 🔬 **Beta Model** — The AI model is not fine-tuned for Vensim generation. Generated models should be reviewed and validated before use in any analysis.
- 🎨 **UI/UX** — The interface is vibe-coded and is not representative of production-quality frontend work.

## License

MIT
