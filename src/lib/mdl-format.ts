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
export interface GenerateOptions {
  initialTime?: number;
  finalTime?: number;
  timeStep?: number;
  timeUnits?: string;
}

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

**Step 3 – Control Section**
Add a .Control section with:
• INITIAL TIME = ${initialTime}
• FINAL TIME = ${finalTime}
• TIME STEP = ${timeStep}
• SAVEPER = TIME STEP
• Time units: ${timeUnits}

**Step 4 – Sketch / Diagram Section**
Generate Vensim sketch code that visually lays out the Stock-and-Flow Diagram:
• Place stocks horizontally spaced ~165 pixels apart, vertically centered around y=267.
• Place flow valves between connected stocks.
• Place auxiliaries above or below the stocks they influence.
• Use connector arrows (type 1) from auxiliaries/stocks to the flows they affect.
• Follow the exact Vensim sketch syntax shown in the reference example.

**Step 5 – Assemble the .mdl file**
Combine everything into a single valid .mdl file. The file MUST:
• Start with \`{UTF-8}\`
• Have the main model section header
• Have all variable definitions
• Have the .Control section
• Have the sketch section starting with \`\\\\\\---/// Sketch information\`
• End with the metadata footer section

**CRITICAL RULES:**
1. Output ONLY the raw .mdl file content. No markdown fences, no explanations, no commentary.
2. Every variable mentioned in the text must appear in the model.
3. Every stock must have at least one inflow or outflow.
4. All units must be specified (use "Dimensionless" if truly unitless).
5. The model must be internally consistent — no undefined variables referenced in equations.

---

**REFERENCE EXAMPLE** of a valid .mdl file (SIR disease model):

${MDL_EXAMPLE}

---

Now generate a complete .mdl file for the following system description:

${description}`;
}
