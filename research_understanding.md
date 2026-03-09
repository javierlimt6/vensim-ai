# Complete Understanding of "How ChatGPT Writes a Complete Vensim Model"

## 1. Purpose and Context of the Paper

The paper explains how ChatGPT, combined with a tool called **DAVID© (Draw A Vensim Initial Draft)**, can automate most of the workflow for building **System Dynamics** models in **Vensim**.[file:18] It targets both practitioners and educators who work with stock–flow models and want to reduce the manual work of translating a textual problem description into a full simulation model.[file:18]

The central claim is that large language models can reliably: (a) extract and classify variables, (b) propose equations, and (c) emit valid Vensim `.mdl` code, leaving humans to focus on validation, refinement, and policy analysis instead of low‑level diagram construction.[file:18]

## 2. Traditional System Dynamics Modelling Workflow

Traditionally, building a System Dynamics model has several steps:[file:18]

1. **Problem description** – write a detailed narrative of the system, including key variables, relationships, boundaries, and assumptions.[file:18]
2. **Causal Loop Diagram (CLD)** – map feedback loops qualitatively to understand structure and reinforcing/balancing effects.[file:18]
3. **Stock and Flow Diagram (SFD)** – convert feedback structure into quantified stocks, flows, auxiliaries, and connectors; this is labour‑intensive and error‑prone.[file:18]
4. **Equation formulation** – translate conceptual relationships into mathematical equations for each variable.[file:18]
5. **Implementation and testing** – encode the model in software such as Vensim, simulate it, and iteratively refine.[file:18]

The paper emphasises that the **CLD → SFD → equations → implementation** pipeline historically demands substantial manual effort and is a bottleneck in practice.[file:18]

## 3. Role of ChatGPT in Modelling

The authors argue that modern ChatGPT versions (especially 4.5 and o1) can meaningfully assist or partly automate much of this pipeline.[file:18]

### 3.1 Variable Identification and Classification

Given a textual description of a problem, ChatGPT can:
- Extract candidate variables mentioned in the narrative.[file:18]
- Classify each variable as a **stock, flow, or auxiliary** based on its semantics and its described behaviour over time.[file:18]

This creates a first pass at the SFD’s variable set without the modeller manually combing through the text.[file:18]

### 3.2 Equation Generation

Once variables and their roles are known, ChatGPT can:
- Propose algebraic or differential equations capturing the relationships between variables, often in Vensim’s own syntax.[file:18]
- Respect constraints and assumptions described in the text (e.g., closed populations, conservation of mass, fixed delays).[file:18]

These equations can frequently be directly pasted into Vensim with only minor syntactic clean‑up.[file:18]

### 3.3 Guidance and Refinement

ChatGPT can also act as an **interactive tutor** that:
- Suggests how to structure the SFD, where to place stocks and flows, and what auxiliaries or constants may be needed.[file:18]
- Explains choices, prompts the user to check realism, and offers alternative formulations or sensitivity suggestions.[file:18]

Thus, the modeler’s role shifts from hand‑crafting every piece to **reviewing, critiquing, and improving** an AI‑generated draft.[file:18]

## 4. Educational Implications

The paper places strong emphasis on consequences for **System Dynamics teaching**.[file:18]

- Students can already obtain usable models by feeding a problem statement to ChatGPT, so merely grading them on diagram or code production is no longer meaningful.[file:18]
- Instructors must re‑orient learning outcomes towards **critical thinking**, model validation, and policy interpretation: “Does this make sense?”, “What happens if we change this parameter?”, “What empirical evidence supports these structures and values?”.[file:18]
- Assessment should emphasise a student’s ability to **audit AI output**, explain model logic and limitations, design experiments, and interpret simulation results.[file:18]

Teachers will need to keep up with AI developments, design more challenging, open‑ended tasks, and in many cases learn alongside students as AI‑assisted modelling becomes standard practice.[file:18]

## 5. DAVID©: Automating the Vensim Draft

DAVID© is presented as a specialised tool that orchestrates ChatGPT for Vensim model generation.[file:18]

### 5.1 High‑Level Idea

DAVID© takes a **text problem description** as input and outputs a **complete Vensim `.mdl` file** containing:
- Stocks, flows, and auxiliaries.
- Equations for all variables.
- The SFD layout encoded in Vensim’s diagram language.[file:18]

Effectively, DAVID© automates the **entire path from text to executable model**, using ChatGPT as the reasoning engine and then assembling the responses into a valid model file.[file:18]

### 5.2 Internal Workflow of DAVID©

The tool operates through several structured steps:[file:18]

1. **Define variables** – summarise the problem description, list all relevant variables, and classify them into stocks, flows, and auxiliaries.[file:18]
2. **Write equations** – generate equations describing relationships between the variables and convert them to Vensim notation.[file:18]
3. **Draw SFD** – specify the stock–flow diagram structure (number of stocks, connections, placement) in terms of Vensim diagram code.[file:18]
4. **Add auxiliaries and arrows** – position auxiliary variables and causal connectors to avoid overlaps and maintain readability.[file:18]
5. **Create MDL file** – assemble everything into a text file with `.mdl` extension that can be opened directly in Vensim.[file:18]

These stages are executed by a long prompt broken into numbered sections that ChatGPT follows step‑by‑step.[file:18]

## 6. How to Use DAVID© in Practice

The authors propose a concrete user workflow:[file:18]

1. **Write a detailed problem description** – include variables, assumptions, system boundaries, and key parameters, but avoid unnecessary narrative fluff.[file:18]
2. **Paste the description into `DAVID.docx`** – this file contains the predefined multi‑step prompt that guides ChatGPT through the workflow.[file:18]
3. **Run the prompt in ChatGPT** – execute the prompt (ideally in o1 or 4.5). With models like 4o or DeepSeek, they recommend running the steps manually one‑by‑one to maintain reliability.[file:18]
4. **Save the MDL file** – copy the resulting Vensim code into a plain text file and save it with `.mdl` extension.[file:18]
5. **Open and refine in Vensim** – adjust layout, tune parameter values, add documentation, and run simulations to verify behaviour.[file:18]

The philosophy is that DAVID© produces a **first draft**, not a finished product; user validation and tailoring remain essential.[file:18]

## 7. Example Case Study: SIR Disease Model

To demonstrate the approach, the paper uses a classic **SIR epidemic** example.[file:18]

### 7.1 Problem Setup

- **Stocks**: Susceptible (S), Infected (I), Recovered (R).[file:18]
- **Parameters/auxiliaries**: transmission rate \(\beta\), recovery rate \(\gamma\).[file:18]
- **Assumptions**: closed population (no births/deaths), permanent immunity after recovery.[file:18]

The task is to build a Vensim model that captures disease spread, recovery, and immunity dynamics over time.[file:18]

### 7.2 Use of DAVID©

1. The textual problem description explicitly lists variables, assumptions, and parameters.[file:18]
2. This description is pasted into the DAVID© prompt; ChatGPT identifies S, I, R as stocks, with flows for infection and recovery, and auxiliaries \(\beta\) and \(\gamma\).[file:18]
3. DAVID© generates the standard SIR equations in differential form:
   - \(dS/dt = -\beta S I\)
   - \(dI/dt = \beta S I - \gamma I\)
   - \(dR/dt = \gamma I\)[file:18]
4. These equations plus an SFD layout are output as Vensim code, written to an `.mdl` file.[file:18]
5. The modeller can then open the file, refine diagram aesthetics and parameter values, and run simulations.[file:18]

This case illustrates that for well‑understood canonical structures, ChatGPT+DAVID© can rapidly produce textbook models from natural language alone.[file:18]

## 8. Additional Example Models

The paper briefly summarises other problem domains tackled by DAVID© to show generality.[file:18]

1. **Warehouse stock** – distributor serving stochastic customer demand with replenishment orders to a manufacturer that has effectively infinite stock; includes batch ordering, lead time, and lost sales when stockouts occur.[file:18]
2. **Inventory management** – manufacturing firm with forecasted shipments, desired inventory proportional to forecasted demand, and workforce adjustment with hiring delays and no‑layoff policy; adapted from Sterman’s supply‑chain examples.[file:18]
3. **Fishery** – shrimp population with logistic growth, harvesting by a fleet whose capacity depends on fleet size and boat efficiency; efficiency increases over time via technology improvements.[file:18]
4. **Two reservoirs** – hydroelectric system with upper and lower reservoirs, charge/return/discharge flows, and rules that adjust flow rates based on water levels relative to min/max targets.[file:18]
5. **Cows and jaguars** – predator–prey–economics model simulating jaguar population control policies and their impact on cattle deaths and farm revenues.[file:18]

In each case, the DAVID© workflow produces an SFD and an executable model; human modellers still validate, calibrate, and interpret the results.[file:18]

## 9. Validation Approach

To test DAVID©, the authors focus on the **Inventory Management** example.[file:18]

- They use the “Tests of Model Behavior” framework, which checks whether the model’s simulated behaviour matches real systems or, here, a trusted reference model.[file:18]
- DAVID©’s generated model is compared with John Sterman’s original manufacturing supply chain model from *Business Dynamics*.[file:18]
- Time series outputs (orders, production, inventory) from both models show qualitatively similar patterns, supporting that DAVID© can reproduce established dynamics reasonably well.[file:18]

Validation therefore centres on **behavioural equivalence** rather than exact numerical identity, acknowledging that multiple structural formulations can yield similar dynamics.[file:18]

## 10. Known Limitations of DAVID©

The paper is explicit about constraints and risks.[file:18]

1. **Dependence on specific LLM versions** – DAVID© is tuned for ChatGPT o1 and 4.5; other providers or free tiers often yield poorer, less reliable outputs.[file:18]
2. **Model size limit** – not recommended for models with more than about eight stocks; beyond this, LLM performance degrades and the risk of structural or syntactic errors rises.[file:18]
3. **Sensitivity to input text** – the algorithm faithfully follows the given description and will not invent missing variables, so ambiguous or incomplete descriptions propagate directly into the model.[file:18]
4. **Non‑determinism** – repeated runs on the same prompt can produce slightly different models because LLM outputs are stochastic, unlike deterministic algorithms.[file:18]

These limitations reinforce the message that DAVID© is a **drafting assistant**, not a replacement for skilled human modelling and rigorous validation.[file:18]

## 11. Advantages of ChatGPT + DAVID©

Despite its limitations, the combination offers several clear benefits.[file:18]

1. **Time efficiency** – automating initial SFD and equation generation significantly shortens the time from narrative problem description to runnable Vensim model.[file:18]
2. **Reduced human error** – algorithmic generation tends to avoid common manual mistakes such as missing connectors, sign errors, or inconsistent units (although AI can introduce different errors, hence the need for review).[file:18]
3. **Accessibility for novices** – beginners can produce complex models without deep familiarity with Vensim syntax, as ChatGPT guides them through variable definitions and equations step‑by‑step.[file:18]
4. **Domain flexibility** – examples show applicability across logistics, manufacturing, ecology, hydrology, and socio‑environmental systems, suggesting broad usefulness wherever System Dynamics is applied.[file:18]

## 12. Overall Conclusions of the Paper

The authors conclude that integrating ChatGPT with structured prompting and a wrapper like DAVID© **transforms the early phases** of System Dynamics modelling.[file:18]

- Instead of labouring over diagram drawing and code entry, modellers can devote more time to **conceptualisation, data gathering, scenario design, and policy evaluation**.[file:18]
- In education, the emphasis should shift from coding diagrams to **interpreting, critiquing, and stress‑testing AI‑generated models**, aligning assessment with higher‑order thinking skills.[file:18]
- As generative AI capabilities improve, such workflows are likely to expand, further lowering entry barriers and making System Dynamics more widely accessible to non‑experts.[file:18]

The paper positions ChatGPT and DAVID© not as replacements for experienced system dynamicists, but as productivity tools that can **amplify expertise** and extend modelling to wider audiences, provided that rigorous validation and critical thinking remain central.
