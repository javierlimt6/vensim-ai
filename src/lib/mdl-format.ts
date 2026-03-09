/**
 * Vensim .mdl file format utilities.
 *
 * This module implements the DAVID©-inspired prompt engineering approach
 * described in "How ChatGPT Writes a Complete Vensim Model" (Campuzano-Bolarín
 * et al.), adapted for the Google Gemini API.
 */

// ---------------------------------------------------------------------------
// Reference .mdl example (SIR model) – embedded in the prompt so the LLM
// learns the exact syntax by example.
// ---------------------------------------------------------------------------
export const MDL_EXAMPLE = `{UTF-8}
********************************************************
\t.sir
********************************************************~
\t\tThis is a standard 'Susceptible - Infectious - Recovered' model.
\t|

Contact Infectivity=
\t0.3
\t~\tPersons/Persons/Day
\t~\tA joint parameter listing both how many people you contact, and how likely \\
\t\tyou are to give them the disease.
\t|

Duration=
\t5
\t~\tDays
\t~\tHow long are you infectious for?
\t|

Infectious= INTEG (
\tSuccumbing-Recovering,
\t\t5)
\t~\tPersons
\t~\tThe population with the disease, manifesting symptoms, and able to \\
\t\ttransmit it to other people.
\t|

Recovered= INTEG (
\tRecovering,
\t\t0)
\t~\tPersons
\t~\tThese people have recovered from the disease. Yay! Nobody dies in this \\
\t\tmodel.
\t|

Recovering=
\tInfectious/Duration
\t~\tPersons/Day
\t~\t\t|

Succumbing=
\tSusceptible*Infectious/Total Population * Contact Infectivity
\t~\tPersons/Day
\t~\t\t|

Susceptible= INTEG (
\t-Succumbing,
\t\tTotal Population)
\t~\tPersons
\t~\tThe population that has not yet been infected.
\t|

Total Population=
\t1000
\t~\tPersons
\t~\tThis is just a simplification to make it easer to track how many folks \\
\t\tthere are without having to sum up all the stocks.
\t|

********************************************************
\t.Control
********************************************************~
\t\tSimulation Control Parameters
\t|

FINAL TIME  = 100
\t~\tDay
\t~\tThe final time for the simulation.
\t|

INITIAL TIME  = 0
\t~\tDay
\t~\tThe initial time for the simulation.
\t|

SAVEPER  = 
        TIME STEP
\t~\tDay [0,?]
\t~\tThe frequency with which output is stored.
\t|

TIME STEP  = 0.03125
\t~\tDay [0,?]
\t~\tThe time step for the simulation.
\t|

\\\\\\---/// Sketch information - do not modify anything except names
V300  Do not put anything below this section - it will be ignored
*View 1
$192-192-192,0,Times New Roman|12||0-0-0|0-0-0|0-0-255|-1--1--1|-1--1--1|72,72,100,0
10,1,Susceptible,248,267,40,20,3,3,0,0,0,0,0,0
10,2,Infectious,413,267,40,20,3,3,0,0,0,0,0,0
10,3,Recovered,579,267,40,20,3,3,0,0,0,0,0,0
1,4,6,2,4,0,0,22,0,0,0,-1--1--1,,1|(355,268)|
1,5,6,1,100,0,0,22,0,0,0,-1--1--1,,1|(306,268)|
11,6,268,331,268,6,8,34,3,0,0,1,0,0,0
10,7,Succumbing,331,284,32,8,40,3,0,0,-1,0,0,0
1,8,10,3,4,0,0,22,0,0,0,-1--1--1,,1|(520,268)|
1,9,10,2,100,0,0,22,0,0,0,-1--1--1,,1|(471,268)|
11,10,236,495,268,6,8,34,3,0,0,1,0,0,0
10,11,Recovering,495,284,30,8,40,3,0,0,-1,0,0,0
1,12,2,11,1,0,0,0,0,64,0,-1--1--1,,1|(459,313)|
1,13,1,7,1,0,0,0,0,64,0,-1--1--1,,1|(258,298)|
1,14,2,7,1,0,0,0,0,64,0,-1--1--1,,1|(388,311)|
10,15,Contact Infectivity,263,200,47,8,8,3,0,0,0,0,0,0
10,16,Total Population,401,200,42,8,8,3,0,0,0,0,0,0
1,17,15,6,1,0,0,0,0,64,0,-1--1--1,,1|(308,228)|
1,18,16,6,1,0,0,0,0,64,0,-1--1--1,,1|(367,223)|
10,19,Duration,530,200,24,8,8,3,0,0,0,0,0,0
1,20,19,10,1,0,0,0,0,64,0,-1--1--1,,1|(509,225)|
1,21,16,1,0,0,0,0,0,64,1,-1--1--1,,1|(341,225)|
///---\\\\\\
:L<%^E!@
1:Current.vdf
9:Current
22:$,Dollar,Dollars,$s
22:Hour,Hours
22:Month,Months
22:Person,People,Persons
22:Unit,Units
22:Week,Weeks
22:Year,Years
22:Day,Days
15:0,0,0,0,0,0
19:100,0
27:2,
34:0,
4:Time
5:Contact Infectivity
35:Date
36:YYYY-MM-DD
37:2000
38:1
39:1
40:4
41:0
42:1
24:0
25:100
26:100`;

// ---------------------------------------------------------------------------
// Prompt builder – constructs the DAVID©-inspired system prompt that instructs
// Gemini to output a valid .mdl file.
// ---------------------------------------------------------------------------
export type DiagramType = "SFD" | "CLD";

export interface GenerateOptions {
  initialTime?: number;
  finalTime?: number;
  timeStep?: number;
  timeUnits?: string;
  diagramType?: DiagramType;
}

// ---------------------------------------------------------------------------
// Text-based prompt
// ---------------------------------------------------------------------------
export function buildSystemPrompt(
  description: string,
  options: GenerateOptions = {}
): string {
  const {
    initialTime = 0,
    finalTime = 100,
    timeStep = 1,
    timeUnits = "Year",
  } = options;

  return `You are DAVID© (Draw A Vensim Initial Draft), an expert System Dynamics modeler.
Your task is to convert a natural-language system description into a **complete, valid Vensim .mdl file**.

Follow these steps internally (do NOT output intermediate steps — only output the final .mdl file):

**Step 1 – Variable Extraction**
Read the description carefully. Identify every variable and classify each as:
• Stock (level) — accumulated quantities that change over time via inflows/outflows. Use INTEG().
• Flow (rate) — rates of change that feed into or out of stocks.
• Auxiliary — intermediate calculated variables.
• Constant — fixed parameter values.

**Step 2 – Equation Formulation**
Write Vensim equations for every variable. Rules:
• Stocks use: \`Stock Name= INTEG (inflow - outflow, initial_value)\`
• Flows, auxiliaries, and constants use: \`Variable Name= <expression>\`
• After each equation, add a units line: \`~ units\`
• Then a comment line: \`~ description\`
• End each variable block with: \`|\`
• Use tab indentation for continuation lines.
• Variable names may contain spaces. Do NOT use underscores for multi-word variable names.
• Use Vensim built-in functions where appropriate: MIN, MAX, IF THEN ELSE, DELAY FIXED, SMOOTH, STEP, PULSE, RANDOM UNIFORM, LN, EXP, etc.
• Every flow that drains a stock must appear with a negative sign in that stock's INTEG. Every flow that fills a stock must appear with a positive sign.
• Ensure dimensional consistency: the units on the left side of each equation must match the units of the right-side expression.
• If one variable influences another (causal relationship), the influencing variable MUST appear in the influenced variable's equation.
• Provide reasonable initial values for all stocks.

**Step 3 – Control Section**
Add a .Control section with:
• INITIAL TIME = ${initialTime}
• FINAL TIME = ${finalTime}
• TIME STEP = ${timeStep}
• SAVEPER = TIME STEP
• Time units: ${timeUnits}

**Step 4 – Sketch / Diagram Section**
Generate Vensim sketch code that visually lays out the Stock-and-Flow Diagram:
• If the model has multiple sectors or chains, place each chain at a different y-level (e.g., first chain at y=200, second at y=450). Maintain left-to-right stock ordering within each chain.
• Within a chain, space stocks ~165 pixels apart horizontally.
• Place flow valves between connected stocks.
• Place auxiliaries above or below the stocks they influence.
• Use connector arrows (type 1) from auxiliaries/stocks to the flows they affect.
• Follow the exact Vensim sketch syntax shown in the reference example.

**Step 5 – Self-Verification**
Before producing the final output, verify:
• Count your stocks, flows, auxiliaries, and constants. Every variable mentioned in the description must be present.
• Every causal relationship described must be reflected in the equations.
• No extra variables that weren't mentioned should appear.
• Every flow referenced in a stock's INTEG() is also defined as a separate equation.

**Step 6 – Assemble the .mdl file**
Combine everything into a single valid .mdl file. The file MUST:
• Start with \`{UTF-8}\`
• Have the main model section header
• Have all variable definitions
• Have the .Control section
• Have the sketch section starting with \`\\\\\\---/// Sketch information\`
• End with the metadata footer section

**CRITICAL RULES:**
1. Output ONLY the raw .mdl file content. No markdown fences, no explanations, no commentary.
2. Every variable mentioned in the description must appear in the model.
3. Every stock must have at least one inflow or outflow.
4. All units must be dimensionally consistent throughout the model.
5. All units must be specified (use "Dimensionless" if truly unitless).
6. The model must be internally consistent — no undefined variables referenced in equations.
7. Every flow variable referenced inside a stock's INTEG() must also be defined as a separate equation.
8. Do NOT create shadow variables for model variables. Each model variable must be defined exactly once. The only acceptable angle-bracket references are built-in Vensim variables: \`<TIME STEP>\`, \`<Time>\`, \`<INITIAL TIME>\`, \`<FINAL TIME>\`.

---

**REFERENCE EXAMPLE** of a valid .mdl file (SIR disease model):

${MDL_EXAMPLE}

---

Now generate a complete .mdl file for the following system description:

${description}`;
}

// ---------------------------------------------------------------------------
// Image-based prompt (multimodal) – single-prompt pipeline
// ---------------------------------------------------------------------------
export function buildImagePrompt(
  options: GenerateOptions = {},
  additionalContext: string = ""
): string {
  const {
    initialTime = 0,
    finalTime = 100,
    timeStep = 1,
    timeUnits = "Year",
  } = options;
  const diagramType = options.diagramType || "SFD";
  const diagramLabel =
    diagramType === "CLD" ? "Causal Loop Diagram (CLD)" : "Stock and Flow Diagram (SFD)";

  return `You are DAVID© (Draw A Vensim Initial Draft), an expert System Dynamics modeler.

The user has uploaded an image of a **${diagramLabel}**. Your task is to analyze it and produce a **complete, valid Vensim .mdl file**.

Follow these steps internally (do NOT output intermediate steps — only output the final .mdl file):

**Step 1 – Diagram Analysis**
Carefully analyze the diagram image. Identify every variable, stock, flow, auxiliary, constant, and causal connection visible in the diagram. Read all labels exactly as shown. Trace every single arrow to note which variable it originates from and which it points to.

${diagramType === "CLD" ? `**Step 2 – Convert CLD to SFD**
Since Vensim uses Stock-and-Flow Diagrams, convert the Causal Loop Diagram:
• Identify which variables should be stocks (accumulated quantities that persist over time).
• Determine the flows (rates of change) that connect stocks — these are the mechanisms of change.
• Convert reinforcing (+) and balancing (-) polarity into proper mathematical relationships.
• Identify feedback loops and translate them into equation structure.
• Add reasonable initial values and parameter estimates where the CLD doesn't specify them.
• Create auxiliary variables for any intermediate calculations needed.` : `**Step 2 – Map SFD Elements**
Map the diagram elements to Vensim variable types:
• Rectangles/boxes → stocks (use INTEG()).
• Valve/hourglass symbols on pipes → flows (rates).
• Circles or free text labels → auxiliaries or constants.
• Arrows → causal connections (determine which variables influence which equations).
• Clouds at flow ends → sources/sinks (do not need to be modeled as stocks).`}

**Step 3 – Equation Formulation**
Write Vensim equations for every variable. Rules:
• Stocks use: \`Stock Name= INTEG (inflow - outflow, initial_value)\`
• Flows, auxiliaries, and constants use: \`Variable Name= <expression>\`
• After each equation, add a units line: \`~ units\`
• Then a comment line: \`~ description\`
• End each variable block with: \`|\`
• Use tab indentation for continuation lines.
• Variable names may contain spaces. Do NOT use underscores for multi-word variable names.
• Every flow that drains a stock must appear with a negative sign in that stock's INTEG. Every flow that fills a stock must appear with a positive sign.
• Ensure dimensional consistency: the units on the left side of each equation must match the units of the right-side expression.
• Trace every arrow in the diagram. If variable A has an arrow pointing to variable B, then A MUST appear in B's equation. Every single arrow must be reflected in the equations.
• Provide reasonable initial values for all stocks.

**Step 4 – Control Section**
Add a .Control section with:
• INITIAL TIME = ${initialTime}
• FINAL TIME = ${finalTime}
• TIME STEP = ${timeStep}
• SAVEPER = TIME STEP
• Time units: ${timeUnits}

**Step 5 – Sketch / Diagram Section**
Generate Vensim sketch code that visually lays out the Stock-and-Flow Diagram:
• Reproduce the spatial layout from the diagram as closely as possible.
• If the diagram has multiple sectors or chains, place each chain at a different y-level (e.g., first chain at y=200, second at y=450). Maintain left-to-right stock ordering within each chain.
• Within a chain, space stocks ~165 pixels apart horizontally.
• Place flow valves between connected stocks.
• Place auxiliaries above or below the stocks they influence.
• Use connector arrows (type 1) from auxiliaries/stocks to the flows they affect.
• Follow the exact Vensim sketch syntax shown in the reference example.

**Step 6 – Self-Verification**
Before producing the final output, verify:
• Count your stocks, flows, auxiliaries, and constants. Compare against the diagram — every labeled element must be present exactly once.
• Trace every arrow again. For each arrow from A to B, confirm A appears in B's equation.
• No extra variables that aren't in the diagram should appear.
• Every flow referenced in a stock's INTEG() is also defined as a separate equation.

**Step 7 – Assemble the .mdl file**
Combine everything into a single valid .mdl file. The file MUST:
• Start with \`{UTF-8}\`
• Have the main model section header
• Have all variable definitions
• Have the .Control section
• Have the sketch section starting with \`\\\\\\---/// Sketch information\`
• End with the metadata footer section

**CRITICAL RULES:**
1. Output ONLY the raw .mdl file content. No markdown fences, no explanations, no commentary.
2. Every variable visible in the diagram must appear in the model.
3. Every stock must have at least one inflow or outflow.
4. All units must be dimensionally consistent throughout the model.
5. All units must be specified (use "Dimensionless" if truly unitless).
6. The model must be internally consistent — no undefined variables referenced in equations.
7. Every flow variable referenced inside a stock's INTEG() must also be defined as a separate equation.
8. Do NOT create shadow variables for model variables. Each model variable must be defined exactly once. The only acceptable angle-bracket references are built-in Vensim variables: \`<TIME STEP>\`, \`<Time>\`, \`<INITIAL TIME>\`, \`<FINAL TIME>\`.

---

**REFERENCE EXAMPLE** of a valid .mdl file (SIR disease model):

${MDL_EXAMPLE}

---

${additionalContext ? `Additional context from the user:\n${additionalContext}\n\n---\n\n` : ""}Now analyze the uploaded diagram image and generate a complete .mdl file that faithfully recreates the model shown in the diagram.`;
}
