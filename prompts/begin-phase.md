### Mission: Execute Phase [X]

You are now transitioning to **Phase [X]** as defined in `plan.md`. Your goal is to move this phase from "Planned" to "Complete" while maintaining synchronization with `progress.md`.

### Step 1: Pre-Implementation Audit

Read `plan.md` and `progress.md` to align with the current project state. Before writing any code, perform a "Gap Analysis" on Phase [X]:

1. **Ambiguity Check**: Are the deliverables and "Definition of Done" for this phase specific enough to execute without guessing?
2. **Integration Check**: How will the code in this phase interact with existing files?
3. **Hardware Constraint Check**: Does the proposed implementation respect my system limits (16GB RAM / CPU-only optimization)?

### Step 2: Implementation Proposal

Provide a **brief summary** of your technical approach for my approval:

- List of files to create/modify.
- Core logic and libraries to be used.
- Atomic sub-tasks for this phase.

### Step 3: Environment Optimization (Selective)

Evaluate if this phase involves repetitive manual actions, complex external data needs, or strict styling/testing standards. **Only if highly beneficial**, suggest a Claude Code customization to streamline our development cycle:

- **MCP Servers**: If we need to pull live data from external APIs or databases.
- **Custom Slash Commands**: If a task in this phase will be repeated frequently (e.g., a custom `/test-ui` or `/sync-db` command).
- **Agent Skills**: If there are complex architectural patterns or "laws" the agent should learn and apply automatically.
- **Hooks**: If we need automatic triggers (e.g., auto-linting on file save or pre-commit checks).
- **Plugins**: If a bundle of the above would significantly lower our friction.

_If no customization is needed to maintain velocity, skip this step._

### Step 4: Execution

Do not begin coding until I approve the Proposal and any suggested Environment Optimizations. Once approved, update the "Current Status" in `progress.md` and begin work.

---

**Phase to Initialize**: [INSERT PHASE NAME/NUMBER HERE]
