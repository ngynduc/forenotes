## Brainstorm Summary: Agentic Investigation Platform for Forenotes

The core idea evolved from **“add an AI assistant to Forenotes”** into something much broader:

> **Forenotes becomes the investigation system of record, while AI agents use forensic/security tools to perform investigations and continuously write evidence, observations, hypotheses, timelines, findings, and tasks back into Forenotes.**

### 1. Role of Forenotes

Forenotes should not just store AI chat history. It should hold the persistent, structured investigation state:

```text
Case
├── Evidence
├── Timeline
├── Entities
├── Relationships
├── Observations
├── Hypotheses
├── Findings
├── Tasks
├── Investigation Runs
└── Agent Actions
```

Chat is only one interface into this data.

This allows investigations to be:

* resumable
* auditable
* reproducible
* reviewable by humans
* transferable between different agents/models

The model's context becomes temporary; **Forenotes becomes the long-term investigation memory**.

---

## 2. Forenotes as an MCP server

Expose Forenotes through MCP so your own agent—or external compatible agents—can interact with cases.

Read-oriented tools might include:

```text
get_case()
search_case()
get_timeline()
get_entities()
get_relationships()
get_findings()
get_tasks()
get_evidence()
```

Write-oriented tools might include:

```text
create_observation()
create_hypothesis()
add_timeline_event()
create_entity()
link_entities()
create_task()
create_finding()
attach_evidence()
```

Prefer explicit investigation primitives instead of generic database access.

The agent should **never receive direct PostgreSQL access**.

---

## 3. Separate facts from AI reasoning

A major design principle should be:

> **Evidence → Observation → Hypothesis → Conclusion/Finding**

Example:

```text
Evidence
Security.evtx EventRecordID 29381

        ↓

Observation
WINWORD.EXE spawned powershell.exe at 14:32.

        ↓

Hypothesis
The document may have initiated malicious execution.

        ↓

Additional evidence

        ↓

Finding
The malicious document was the initial execution vector.
```

This prevents an LLM hypothesis from silently becoming accepted fact.

Every important assertion should carry provenance back to the exact evidence.

---

# 4. Two investigation modes

The same agent architecture should eventually support both.

### Live investigation

```text
Agent
  ↓
Security Tool Gateway
  ↓
Splunk / Sentinel / Elastic
CrowdStrike / Defender
VirusTotal / MISP
Velociraptor
etc.
```

### Offline forensic investigation

For CyberDefenders-style labs:

```text
Agent
  ↓
SIFT
  ↓
Velociraptor collection / ZIP / disk image / forensic artifacts
```

This means the agent can investigate even when there is:

* no SIEM
* no EDR
* no live environment
* only collected evidence

---

# 5. Offline evidence ingestion

A submitted forensic archive becomes a first-class evidence source.

Example:

```text
CyberDefenders ZIP
       ↓
Forenotes
       ↓
hash + register evidence
       ↓
isolated forensic worker
       ↓
parse / analyze
       ↓
structured evidence
       ↓
agent investigation
```

The original file should remain immutable.

Suggested case layout:

```text
case-123/
├── evidence/
│   └── velociraptor.zip
│
└── workspace/
    ├── extracted/
    ├── parsed/
    ├── timeline/
    └── results/
```

`evidence/` is read-only.

`workspace/` is writable.

---

# 6. Use existing forensic tooling instead of rebuilding parsers

Rather than writing your own:

```text
EVTX parser
Registry parser
MFT parser
Prefetch parser
Amcache parser
...
```

use an established forensic environment to perform deterministic processing.

We initially considered a disposable **SIFT VM**.

That would work:

```text
Forenotes
   ↓
start SIFT VM
   ↓
mount evidence RO
   ↓
agent operates forensic tools
   ↓
write results to Forenotes
```

But then we found a simpler option.

---

# 7. Use SIFT Docker as the forensic execution environment

The `digitalsleuth/sift-docker` project already packages SIFT into Docker.

That significantly simplifies the architecture.

Instead of:

```text
boot VM
attach disk
configure sharing
wait for guest
connect to guest
```

Forenotes can launch an ephemeral container:

```text
Case evidence
     │
     │ read-only bind mount
     ▼
┌──────────────────────┐
│ SIFT Docker worker   │
│                      │
│ /evidence     RO     │
│ /workspace    RW     │
└──────────────────────┘
```

Potential launch pattern:

```bash
docker run --rm \
  --network none \
  --mount type=bind,source=<case-evidence>,target=/evidence,readonly \
  --mount type=bind,source=<case-workspace>,target=/workspace \
  digitalsleuth/sift-docker:<version>
```

This makes **one disposable forensic environment per investigation** practical.

---

# 8. Per-case SIFT workers

The execution model could become:

```text
Case A → SIFT Container A
Case B → SIFT Container B
Case C → SIFT Container C
```

When an investigation starts:

```text
Create InvestigationRun
        ↓
Launch SIFT worker
        ↓
Mount case evidence RO
        ↓
Mount workspace RW
        ↓
Perform investigation
        ↓
Persist outputs
        ↓
Destroy container
```

Containers themselves are disposable.

Evidence and generated results remain persistent.

---

# 9. SIFT should expose an agent-friendly interface

Don't require the LLM to know every forensic command-line option.

Create a **SIFT MCP / forensic tool service** exposing higher-level operations:

```text
list_evidence()
inspect_archive()
extract_archive()

hash_file()
file_metadata()
search_files()

parse_evtx()
query_evtx()

parse_registry()
query_registry()

parse_mft()
parse_prefetch()

create_timeline()
query_timeline()

extract_strings()
run_yara()
run_volatility()
```

Underneath, these tools call the real SIFT utilities.

You can still expose a restricted shell for unusual investigations:

```text
run_command(...)
```

but treat it as a higher-risk capability and log every command.

---

# 10. Record every forensic action

An agent action should itself become an auditable object.

Example:

```text
Agent Action A-391

Investigation Run:
IR-992

Tool:
parse_evtx

Input:
Security.evtx

Command:
<actual underlying command>

Exit code:
0

Output:
security-events.json

Output hash:
...

Started:
...

Finished:
...
```

Then findings can point to:

```text
Finding
  ↓
Observation
  ↓
Parsed record
  ↓
Original evidence
  ↓
Forensic command that produced it
```

That gives you strong provenance.

---

# 11. Build deterministic timelines outside the LLM

The LLM should not invent or construct timelines from raw data itself.

Instead:

```text
EVTX ──────┐
MFT ───────┤
Prefetch ──┤
Registry ──┤
Browser ───┤
LNK ───────┤
Amcache ───┤
            ▼
      Timeline engine
            ↓
       normalized events
            ↓
           Agent
```

The agent interprets and correlates the timeline.

The forensic tooling establishes the underlying events.

---

# 12. Normalize common forensic concepts

You do not have to normalize every parser output, but useful common structures include:

```text
Event
Entity
Artifact
Relationship
Observation
Evidence Reference
```

Example relationships:

```text
user
  └── executed
        └── powershell.exe
              └── created
                    └── payload.dll
                          └── contacted
                                └── 185.x.x.x
```

This fits naturally with Forenotes' entity/graph capabilities.

---

# 13. Autonomous investigation loop

The eventual agent loop could be:

```text
1. Load case context

2. Inventory available evidence

3. Determine investigation objective

4. Form hypotheses

5. Decide which forensic query/tool to run

6. Execute through SIFT

7. Record evidence

8. Create observations

9. Update entities/timeline/relationships

10. Evaluate hypotheses

11. Identify unanswered questions

12. Repeat

13. Produce supported findings

14. Recommend next actions
```

For example:

```text
Objective:
Determine initial access.

Agent discovers:

14:27 invoice.docm downloaded
14:30 invoice.docm opened
14:32 WINWORD → powershell
14:33 payload.dll created
14:34 outbound C2 connection
```

Forenotes then stores the investigation chain rather than merely receiving an AI-generated paragraph.

---

# 14. MCP architecture

The emerging architecture is roughly:

```text
                    Investigation Agent
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    Forenotes MCP       SIFT MCP      Security MCP
                                         Gateway
          │                │                │
      case state       offline          live systems
      evidence         forensics         SIEM
      findings         disk/files        EDR
      hypotheses       memory            threat intel
      timeline         artifacts         etc.
      entities
      tasks
```

### Forenotes MCP

Stores what the investigation **knows**.

### SIFT MCP

Analyzes what the collected evidence **contains**.

### Security MCP Gateway

Queries what the live environment **currently knows**.

The agent can use any combination depending on the case.

---

# 15. Security architecture

The LLM should not directly control Docker or infrastructure.

Avoid:

```text
Agent
  ↓
/var/run/docker.sock
```

because Docker socket access effectively becomes host control.

Instead:

```text
Agent
   ↓
SIFT MCP
   ↓
Worker Orchestrator
   ↓
Docker
   ↓
case-specific SIFT container
```

The orchestrator performs narrowly defined operations:

```text
create_worker(caseId)
execute_tool(workerId, ...)
get_result(...)
destroy_worker(...)
```

The agent never chooses arbitrary host mounts.

---

# 16. SIFT Docker needs two security profiles

The current `sift-docker` example uses powerful permissions including:

```text
privileged: true
SYS_ADMIN
MKNOD
/dev/fuse
```

Those capabilities are useful for forensic mounting but weaken Docker as a security boundary.

So we discussed two worker types.

### Standard artifact worker

Use for CyberDefenders/Velociraptor collections containing things like:

```text
EVTX
Registry
MFT
Prefetch
browser artifacts
Amcache
PowerShell logs
JSON/CSV
```

Run with:

```text
no network
no privileged mode
evidence RO
workspace RW
ephemeral container
```

### Privileged forensic worker

Use only when you genuinely need:

```text
E01 mounting
raw filesystem images
FUSE
loop devices
filesystem mounts
```

This worker should ideally execute on a dedicated analysis node or isolated VM rather than the main Forenotes application host.

---

# 17. Host paths should remain invisible to the agent

The LLM should only ever see:

```text
/evidence
/workspace
```

—not:

```text
/var/lib/forenotes/cases/<other-case>
```

The worker orchestrator decides which host directories map into those paths.

That gives you a strong case isolation model.

---

# 18. Network access should normally be disabled

For offline forensic analysis:

```text
--network none
```

is a useful default.

Reasons include:

* evidence may contain malware
* tools may encounter hostile files
* extracted scripts must not phone home
* prompt-injected artifacts shouldn't cause external actions
* investigations should be reproducible

Threat-intelligence enrichment can happen separately through an explicitly controlled MCP/tool.

---

# 19. AI/tool trust boundary

Forensic evidence must always be treated as **untrusted data**.

Anything inside:

```text
email
HTML
PDF
script
log
malware string
document
registry value
command line
```

may contain text that looks like an instruction to the model.

It must never be allowed to become a trusted system/tool instruction.

---

# 20. Action authorization

Eventually tools should have risk levels.

Conceptually:

| Type                | Example             | Behavior            |
| ------------------- | ------------------- | ------------------- |
| Read                | query evidence      | automatic           |
| Analyze             | run EVTX/MFT parser | automatic           |
| External enrichment | VT/MISP lookup      | policy-controlled   |
| Write investigation | observation/note    | allowed or reviewed |
| Case conclusion     | final finding       | analyst review      |
| Response            | isolate endpoint    | explicit approval   |
| Destructive         | delete/disable      | strongly restricted |

The policy engine—not the model—decides what an agent is permitted to execute.

---

# 21. Best initial development target

Instead of integrating Splunk/CrowdStrike first, CyberDefenders labs could make an excellent initial test environment.

Build:

```text
Upload evidence.zip
        ↓
Forenotes hashes/stores it
        ↓
Launch SIFT Docker worker
        ↓
Analyze evidence
        ↓
Agent investigates autonomously
        ↓
Write structured investigation to Forenotes
```

Success criteria:

```text
✓ inventories evidence

✓ identifies important time periods

✓ builds timeline

✓ identifies suspicious executions

✓ correlates filesystem/event/registry artifacts

✓ extracts indicators

✓ creates entities and relationships

✓ records observations

✓ creates/tests hypotheses

✓ produces evidence-backed findings

✓ maps relevant ATT&CK techniques

✓ records every forensic command

✓ links conclusions back to source evidence
```

---

## Overall direction

The product concept emerging from this session is no longer:

> **Forenotes — DFIR note-taking with AI**

It's closer to:

> **Forenotes — an investigation orchestration and evidence platform for human and autonomous investigators.**

And the initial technical stack could be:

```text
              Forenotes
                  │
          Investigation Agent
                  │
        ┌─────────┴─────────┐
        │                   │
  Forenotes MCP         SIFT MCP
        │                   │
 PostgreSQL/files      Worker Manager
                            │
                    SIFT Docker
                            │
                ┌───────────┴───────────┐
                │                       │
           /evidence RO            /workspace RW
```

That gives you a practical path to an end-to-end autonomous forensic investigation **without first having to build SIEM/EDR integrations or reimplement an entire forensic toolkit**.
