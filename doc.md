## Chapter 3: System Design and Architecture

### 3.1 Overall Architecture Overview

The proposed system is built on two fundamental pillars: a **hierarchical memory model** that separates transient and persistent knowledge, and a **safe skill update pipeline** that mathematically guarantees no performance regression. Figure 3.1 shows the high‑level architecture, illustrating how the four memory tiers interact with the two operational loops: the *online execution loop* that serves user requests using the currently active skill, and the *offline validation loop* that evaluates candidate skill versions and promotes only those satisfying a strict Pareto improvement condition.

Plot the function

$$y = x^2 + 2x - 3$$

and verify it matches this flow:

```mermaid
graph TD
  A[Input x] --> B[Compute x^2 + 2x - 3]
  B --> C[Output y]

sequenceDiagram
    participant Dev as Developer
    participant Val as Validator
    participant Sandbox as Sandbox Runtime
    participant Test as Test Suite
    participant Dep as Deployer
    participant Sem as Semantic Memory
    
    Dev->>Val: Submit candidate v_cand
    Val->>Sandbox: Load v_cand
    loop for each (u_i, y_i) in Test Suite
        Sandbox->>Sandbox: Execute task, produce trace e_i
        Sandbox->>Test: Compute m(e_i)
    end
    Sandbox->>Val: Aggregated m_cand
    Val->>Sem: Fetch m_current (stored with active version)
    Val->>Val: Check m_cand > m_current
    alt Pareto check passes
        Val->>Dep: Promote v_cand
        Dep->>Sem: Store v_cand as new version
        Dep->>Meta: Update active pointer
    else Pareto check fails
        Val->>Dev: Reject with reason
    end

    ```mermaid
    flowchart TD
        A[User Query] --> B[Agent Runtime]
        B --> C[Working Memory]
        B --> D[Episodic Memory]
        E[Meta‑Memory] --> B
        F[Semantic Memory] --> B
        B --> G[Response]
        
        subgraph Online Execution
            B
            C
            D
        end
        
        H[Developer] --> I[Candidate Skill]
        I --> J[Validator]
        J --> K[Episodic Memory - Test Runs]
        K --> J
        J --> L{Pareto Check}
        L -->|Pass| M[Deployer]
        M --> F
        M --> E
        L -->|Fail| N[Reject]
        
        subgraph Offline Validation
            I
            J
            K
            L
            M
            N
        end
        

**Figure 3.1: System architecture. Solid arrows represent data flow; dashed arrows represent control or configuration references.**

The design is guided by three principles:

1. **Strict memory separation** – every piece of data belongs to exactly one memory tier, with well‑defined read/write permissions.
2. **Atomic skill decomposition** – every agent capability is composed of four independent components, each instrumented with observability hooks.
3. **Provable safety** – no skill version is promoted unless it strictly Pareto‑dominates the current active version across five quantitative, deterministically computed metrics on a fixed regression suite.

### 3.2 Hierarchical Memory Model

The memory architecture is inspired directly by cognitive models of human memory. It consists of four tiers, summarised in Table 3.1.

| Tier | Contents | Persistence | Mutable by |
|------|----------|-------------|------------|
| Working Memory | Current task state (parsed input, retrieved context, reasoning, tool results) | Single task | Agent runtime |
| Episodic Memory | Complete execution traces including all component states and computed metrics | Append‑only | Agent runtime (write) |
| Semantic Memory | Versioned skill components (code, prompts, embeddings) | Permanent, versioned | Deployer (controlled) |
| Meta‑Memory | Active version pointer, test suite, safety thresholds, allowed tools | Permanent, rarely changed | Developer (manual) |

**Table 3.1: Summary of the four memory tiers.**

#### 3.2.1 Working Memory

Working memory holds all transient data relevant to a single task execution. Let a task be defined by its raw input $u$. The working memory $W$ for task $u$ contains:

- $p = \text{InputParser}(u)$ – structured representation,
- $C = \text{ContextManager}(p)$ – assembled context (e.g., retrieved documents),
- $r = \text{DecisionEngine}(p, C)$ – reasoning trace and selected action,
- $o = \text{Executor}(r.\text{action})$ – tool output and system success flag.

Working memory is discarded after the task completes. Its contents are first serialised into an episodic trace.

#### 3.2.2 Episodic Memory

Episodic memory $\mathcal{E}$ is an append‑only log of task executions. For the $k$-th task, the stored trace is a tuple:

$$e_k = (t_k, u_k, s_k, v_k, p_k, C_k, r_k, o_k, \mathbf{m}_k)$$

where $t_k$ is a timestamp, $u_k$ the input, $s_k$ the task outcome, $v_k$ the active skill version used, and $\mathbf{m}_k = (m_{\text{DT}}, m_{\text{CF}}, m_{\text{TEV}}, m_{\text{SD}}, m_{\text{HIV}})$ the vector of five observability metrics. $\mathcal{E}$ is immutable under normal operation – entries are never deleted or modified.

#### 3.2.3 Semantic Memory

Semantic memory $\mathcal{S}$ stores all known versions of every skill component. A skill $S$ is a composition of four atomic components:

$$S = (\mathcal{I}, \mathcal{C}, \mathcal{D}, \mathcal{X})$$

where $\mathcal{I}$ is the Input Parser, $\mathcal{C}$ the Context Manager, $\mathcal{D}$ the Decision Engine, and $\mathcal{X}$ the Executor. Each version of a component is stored immutably with a unique version identifier. Additionally, an embedding vector $\mathbf{e}_S \in \mathbb{R}^{d}$ of the skill’s definition is indexed in a vector database to enable similarity‑based retrieval of past variants. Semantic memory is modified **only** by the Deployer after a successful validation.

#### 3.2.4 Meta‑Memory

Meta‑memory $\mathcal{M}$ contains the configuration that governs system operation:

- $\text{active}(A) \in \mathbb{N}$ – the version number of the currently active skill for agent $A$,
- $\mathcal{T} = \{(u_i, y_i)\}_{i=1}^{N}$ – the regression test suite, where $y_i$ is the expected answer or reference,
- $\tau$ – numerical tolerance for Pareto comparison,
- $\mathcal{A}_{\text{allowed}}$ – set of permitted tool actions (safety boundary).

$\mathcal{M}$ is stored in a version‑controlled file and is only updated manually by a developer.

### 3.3 Atomic Skill Interface

Every agent skill is decomposed into four independently replaceable components, each conforming to a strict interface that exposes its internal state for inspection.

    classDiagram
        class InputParser {
            +parse(raw: Any) : Dict
            +hook_input_parsed(raw, parsed)
        }
        class ContextManager {
            +assemble(parsed: Dict) : Dict
            +hook_context_assembled(query, chunks, scores)
        }
        class DecisionEngine {
            +decide(parsed, context) : Action
            +hook_decision(reasoning, action, params)
        }
        class Executor {
            +execute(action, params) : Result
            +hook_execution(tool, params, result, success)
        }
        InputParser --> ContextManager : parsed
        ContextManager --> DecisionEngine : context
        DecisionEngine --> Executor : action

**Figure 3.2: Atomic skill components and data flow.**

#### 3.3.1 Component Specifications

- **InputParser** $\mathcal{I}: \mathcal{U} \to \mathcal{P}$ transforms raw input $u \in \mathcal{U}$ into a structured dictionary $p \in \mathcal{P}$.
- **ContextManager** $\mathcal{C}: \mathcal{P} \to \mathcal{K}$ assembles relevant knowledge $C \in \mathcal{K}$ (e.g., retrieved documents) from semantic memory or external tools.
- **DecisionEngine** $\mathcal{D}: \mathcal{P} \times \mathcal{K} \to \mathcal{A}$ produces an action $a \in \mathcal{A}$ (tool call or final answer) together with a reasoning trace.
- **Executor** $\mathcal{X}: \mathcal{A} \to \mathcal{O} \times \{0,1\}$ invokes the chosen tool and returns the result $o \in \mathcal{O}$ along with a system‑level success flag $\sigma \in \{0,1\}$.

Observability hooks are injected at runtime. They log all inputs and outputs of each component, ensuring that the full causal chain from $u$ to the final output is recorded.

### 3.4 Moat Observability Metrics

The quality of a skill version is quantified by a vector of five deterministic metrics, computed solely from the episodic trace of a task.

Let $e = (u, p, C, r, a, o, \sigma)$ be a trace. Define the embedding function $\phi: \mathcal{T} \to \mathbb{R}^{d}$ that maps text to a fixed‑dimensional vector (using a frozen sentence‑transformer model).

#### Decision Traceability (DT)

For a task trace, let $D$ be the set of atomic decisions (actions chosen). A decision is *traceable* if its full causal chain is present. Then:

$$\text{DT}(e) = \frac{| \{ d \in D : \text{causal\_path}(d) \text{ is complete} \} |}{|D|}$$

When all components are instrumented, $\text{DT} = 1$.

#### Context Fidelity (CF)

Let $C = \{c_1, \dots, c_k\}$ be the retrieved context chunks, and $y$ the ground‑truth answer (from the test suite). The relevance of chunk $c_j$ is its cosine similarity to $y$:

$$\text{sim}(c_j, y) = \frac{ \phi(c_j) \cdot \phi(y) }{ \|\phi(c_j)\| \, \|\phi(y)\| }$$

Then:

$$\text{CF}(e) = \frac{1}{k} \sum_{j=1}^{k} \max(0, \text{sim}(c_j, y))$$

Higher CF indicates more relevant retrieved context.

#### Tool Execution Veracity (TEV)

Let $\mathcal{T}$ be the set of tool calls in the trace. For each call, compare the agent’s self‑reported success $\hat{\sigma}_t$ with the system‑level flag $\sigma_t$:

$$\text{TEV}(e) = \frac{ |\{ t \in \mathcal{T} : \hat{\sigma}_t = 1 \land \sigma_t = 1 \}| }{ |\mathcal{T}| }$$

If no tools are used, $\text{TEV} = 1$ by convention.

#### Semantic Drift (SD)

Let $v_0 = \phi(u)$ be the embedding of the task input, and $v_f = \phi(r)$ be the embedding of the final reasoning trace (or concatenated context). The semantic drift is defined as:

$$\Delta(e) = 1 - \frac{ v_0 \cdot v_f }{ \|v_0\| \, \|v_f\| }$$

We define the metric as the complement, so that larger values are better:

$$\text{SD}(e) = 1 - \Delta(e) = \frac{ v_0 \cdot v_f }{ \|v_0\| \, \|v_f\| }$$

#### Human Intervention Velocity (HIV)

A task is flagged with a binary intervention indicator $h \in \{0,1\}$ (1 means human correction was required). Over a set of tasks $E$, the intervention rate is:

$$\text{HIV}_{\text{raw}}(E) = \frac{ \sum_{e \in E} h_e }{ |E| }$$

The metric used for optimisation is its complement:

$$\text{HIV}(E) = 1 - \text{HIV}_{\text{raw}}(E)$$

All five metrics lie in $[0,1]$, with $1$ representing optimal quality.

#### 3.4.1 Aggregated Metric Vector

Given a skill version $v$ and a regression test suite $\mathcal{T} = \{(u_i, y_i)\}_{i=1}^{N}$, the version’s quality vector is computed by running $v$ on each task, obtaining a trace $e_i$, and averaging:

$$\mathbf{m}(v) = \frac{1}{N} \sum_{i=1}^{N} \mathbf{m}(e_i)$$

where $\mathbf{m}(e) = (\text{DT}(e), \text{CF}(e), \text{TEV}(e), \text{SD}(e), \text{HIV}(e))$. This vector is deterministic given the test suite.

### 3.5 Safe Skill Update Mechanism

The promotion of a new skill version is governed by a strict Pareto improvement rule.

**Definition 1 (Pareto Dominance).**  
Let $\mathbf{m}, \mathbf{m}' \in [0,1]^5$ be metric vectors. $\mathbf{m}'$ **strictly Pareto‑dominates** $\mathbf{m}$, written $\mathbf{m}' \succ \mathbf{m}$, if and only if:

1. $\forall i \in \{1,\dots,5\}, \; m'_i \ge m_i - \epsilon$ (no metric worsens), and
2. $\exists j \in \{1,\dots,5\}, \; m'_j > m_j + \epsilon$ (at least one metric strictly improves),

where $\epsilon$ is a small tolerance (e.g., $10^{-6}$) to account for floating‑point noise.

**Promotion Rule.**  
Let $v_{\text{current}}$ be the active skill version with metric vector $\mathbf{m}_{\text{current}}$, and $v_{\text{cand}}$ a candidate version with vector $\mathbf{m}_{\text{cand}}$. The candidate is accepted if and only if $\mathbf{m}_{\text{cand}} \succ \mathbf{m}_{\text{current}}$.

This rule guarantees that the sequence of accepted versions forms a monotonically non‑decreasing trajectory in all five quality dimensions with respect to $\mathcal{T}$.

#### 3.5.1 Validation Protocol

    sequenceDiagram
        participant Dev as Developer
        participant Val as Validator
        participant Sandbox as Sandbox Runtime
        participant Test as Test Suite
        participant Dep as Deployer
        participant Sem as Semantic Memory
        
        Dev->>Val: Submit candidate v_cand
        Val->>Sandbox: Load v_cand
        loop for each (u_i, y_i) in Test Suite
            Sandbox->>Sandbox: Execute task, produce trace e_i
            Sandbox->>Test: Compute m(e_i)
        end
        Sandbox->>Val: Aggregated m_cand
        Val->>Sem: Fetch m_current (stored with active version)
        Val->>Val: Check m_cand > m_current
        alt Pareto check passes
            Val->>Dep: Promote v_cand
            Dep->>Sem: Store v_cand as new version
            Dep->>Meta: Update active pointer
        else Pareto check fails
            Val->>Dev: Reject with reason
        end

**Figure 3.3: Validation and deployment protocol.**

The protocol ensures that no version is deployed without having demonstrated strict improvement on every dimension measured by the test suite.

### 3.6 Multi‑Agent Extension (Design)

Although the prototype focuses on a single agent, the architecture extends naturally to multi‑agent systems. Multiple agents $\{A_1, A_2, \dots\}$ each have their own active version pointer in meta‑memory but share the same episodic and semantic memory stores. Traces are tagged with agent identifiers, enabling cross‑agent failure analysis. A future enhancement could allow a validated improvement to a shared Context Manager, for example, to be promoted for all agents that depend on it after a single validation.

### 3.7 Summary

This chapter has presented the formal design of a hierarchical memory architecture that supports atomic skill decomposition and provides a mathematically rigorous safe update mechanism. The combination of deterministic observability metrics and a Pareto‑based promotion rule guarantees non‑regression with respect to the regression test suite, while the cognitive memory model ensures separation of concerns and full auditability.
