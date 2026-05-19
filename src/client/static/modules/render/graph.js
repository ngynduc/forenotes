import { escapeHtml } from "../helpers.js";
import { state } from "../state.js";

/* ── Main Graph Workspace ── */

export function renderGraphWorkspace() {
  if (!state.selectedIncidentId) {
    return `<section class="panel"><div class="empty-state is-large">Select an incident to explore the graph.</div></section>`;
  }

  const isMatrix = state.ui.graphView === "matrix";
  return `
    <div class="graph-workspace">
      <div class="graph-tabs">
        <button class="graph-tab ${isMatrix ? "" : "is-active"}" type="button" data-action="set-graph-view" data-view="relationship">Relationship Graph</button>
        <button class="graph-tab ${isMatrix ? "is-active" : ""}" type="button" data-action="set-graph-view" data-view="matrix">MITRE Matrix</button>
      </div>
      ${isMatrix ? renderMatrixView() : renderRelationshipView()}
    </div>
  `;
}

/* ── Relationship Graph View ── */

function renderRelationshipView() {
  const graph = state.ui.graph;
  const graphData = graph.data;
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const stats = graphData?.stats;
  const zoomPct = Math.round(graph.zoom * 100);

  const positionedNodes = layoutNodes(nodes);

  return `
    <div class="graph-toolbar">
      <input class="input" type="search" placeholder="Search graph..." value="${escapeHtml(graph.q)}" data-action="graph-search" data-table="graph" />
      <select class="select" data-action="graph-filter-mode">
        ${renderSelectOptions(["overview", "investigation", "timeline", "assets", "tasks", "mitre"], graph.mode)}
      </select>
      <label class="toggle-label"><input type="checkbox" data-action="graph-filter-derived" ${graph.includeDerived ? "checked" : ""} /> Derived</label>
      <label class="toggle-label"><input type="checkbox" data-action="graph-filter-manual" ${graph.includeManual ? "checked" : ""} /> Manual</label>
    </div>
    ${stats ? renderGraphStats(stats) : ""}
    <div class="graph-body">
      <div class="graph-canvas-wrap" id="graph-canvas-wrap">
        ${nodes.length ? renderGraphCanvas(positionedNodes, edges, graph) : `<div class="graph-empty"><div class="empty-state is-large">No graph data loaded. Attach MITRE tags to findings, timeline events, or queries to populate the graph.</div></div>`}
        <div class="graph-legend">
          <span class="graph-legend-item"><span class="graph-legend-swatch swatch-manual"></span> Manual edge</span>
          <span class="graph-legend-item"><span class="graph-legend-swatch swatch-derived"></span> Derived edge</span>
        </div>
        ${nodes.length ? `
        <div class="graph-zoom-controls">
          <button class="graph-zoom-btn" type="button" data-action="graph-zoom-in" title="Zoom in">+</button>
          <span class="graph-zoom-level">${zoomPct}%</span>
          <button class="graph-zoom-btn" type="button" data-action="graph-zoom-out" title="Zoom out">−</button>
          <button class="graph-zoom-btn" type="button" data-action="graph-zoom-reset" title="Reset zoom">⟲</button>
        </div>
        ` : ""}
      </div>
      <aside class="graph-inspector">
        ${renderNodeInspector()}
      </aside>
    </div>
  `;
}

/* ── Graph Canvas ── */

function renderGraphCanvas(positionedNodes, edges, graph) {
  const canvasWidth = 1100;
  const canvasHeight = Math.max(640, ...positionedNodes.map((n) => n.y + 120));

  const nodeEls = positionedNodes.map((node) => {
    const shortType = node.type.replace("mitre_", "");
    return `
      <button
        class="graph-node type-${escapeHtml(node.type)} ${state.ui.graph.selectedNodeId === node.id ? "is-selected" : ""}"
        style="left: ${node.x}px; top: ${node.y}px"
        type="button"
        data-action="select-graph-node"
        data-node-id="${escapeHtml(node.id)}"
        aria-label="${escapeHtml(node.label)}"
      >
        <div class="graph-node-header">${escapeHtml(shortType)}</div>
        <div class="graph-node-title">${escapeHtml(node.label)}</div>
        ${node.subtitle ? `<div class="graph-node-sub">${escapeHtml(node.subtitle)}</div>` : ""}
      </button>
    `;
  }).join("");

  const svgEdges = edges.map((edge) => {
    const sourcePos = positionedNodes.find((n) => n.id === edge.source);
    const targetPos = positionedNodes.find((n) => n.id === edge.target);
    if (!sourcePos || !targetPos) return "";

    const sx = sourcePos.x + 85;
    const sy = sourcePos.y + 45;
    const tx = targetPos.x + 85;
    const ty = targetPos.y + 45;
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2 - 6;

    return `
      <path class="graph-edge-line ${edge.derived ? "is-derived" : ""}" d="M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}" />
      <text class="graph-edge-label" x="${mx}" y="${my}" text-anchor="middle">${escapeHtml(edge.label)}</text>
    `;
  }).join("");

  return `
    <div class="graph-canvas-inner" id="graph-canvas-inner" style="transform: translate(${graph.panX}px, ${graph.panY}px) scale(${graph.zoom})">
      <div class="graph-canvas" style="min-width:${canvasWidth}px; min-height:${canvasHeight}px">
        <svg class="graph-svg-layer" viewBox="0 0 ${canvasWidth} ${canvasHeight}" preserveAspectRatio="none" aria-hidden="true">
          ${svgEdges}
        </svg>
        ${nodeEls}
      </div>
    </div>
  `;
}

/* ── Simple Columnar Node Layout ── */

function layoutNodes(nodes) {
  const columnOrder = [
    "finding", "timeline_event", "task", "system", "account",
    "ioc", "query", "user", "tag", "mitre_technique", "mitre_tactic"
  ];

  const columns = new Map();
  for (const node of nodes) {
    const col = columns.get(node.type) || [];
    col.push(node);
    columns.set(node.type, col);
  }

  const positioned = [];
  const colWidth = 200;
  const rowHeight = 100;
  const startX = 60;
  const startY = 40;

  let colIndex = 0;
  for (const nodeType of columnOrder) {
    const colNodes = columns.get(nodeType) || [];
    if (colNodes.length === 0) {
      colIndex += 1;
      continue;
    }

    colNodes.forEach((node, rowIndex) => {
      positioned.push({
        ...node,
        x: startX + colIndex * colWidth,
        y: startY + rowIndex * rowHeight
      });
    });
    colIndex += 1;
  }

  return positioned;
}

/* ── Graph Stats ── */

function renderGraphStats(stats) {
  const chips = [
    ["Nodes", stats.totalNodes],
    ["Edges", stats.totalEdges],
    ["Findings", stats.findings],
    ["Timeline", stats.timelineEvents],
    ["Tasks", stats.tasks],
    ["Techniques", stats.mitreTechniques],
    ["Tactics", stats.mitreTactics],
    ["Systems", stats.systems],
    ["Accounts", stats.accounts],
    ["IOCs", stats.iocs],
    ["Manual", stats.manualLinks],
    ["Derived", stats.derivedLinks]
  ].filter(([, count]) => count > 0);

  return `
    <div class="graph-stats">
      ${chips.map(([label, count]) => `
        <span class="graph-stat-chip">${escapeHtml(label)} <span class="chip-value">${count}</span></span>
      `).join("")}
    </div>
  `;
}

/* ── Node Inspector ── */

function renderNodeInspector() {
  const nodeId = state.ui.graph.selectedNodeId;
  if (!nodeId) {
    return `<div class="inspector-empty">Select a node or technique to inspect.</div>`;
  }

  if (nodeId.startsWith("mitre_technique:") || nodeId.startsWith("mitre_tactic:")) {
    return renderMitreNodeInspector(nodeId);
  }

  const graphData = state.ui.graph.data;
  const node = graphData?.nodes?.find((n) => n.id === nodeId);
  if (!node) {
    return `<div class="inspector-empty">Node not found.</div>`;
  }

  const typeLabel = node.type.replace(/_/g, " ");
  const iconLetter = typeLabel.charAt(0).toUpperCase();

  return `
    <div class="inspector-card">
      <div class="inspector-header">
        <div class="inspector-icon">${escapeHtml(iconLetter)}</div>
        <div>
          <div class="inspector-type">${escapeHtml(typeLabel)}</div>
          <h2>${escapeHtml(node.label)}</h2>
        </div>
      </div>
      <div class="inspector-divider"></div>
      <div class="inspector-stats">
        ${node.status ? `<div class="inspector-stat"><span class="stat-value">${escapeHtml(node.status)}</span><span class="stat-label">Status</span></div>` : ""}
        ${node.severity ? `<div class="inspector-stat"><span class="stat-value">${escapeHtml(node.severity)}</span><span class="stat-label">Severity</span></div>` : ""}
        ${node.owner ? `<div class="inspector-stat"><span class="stat-value">${escapeHtml(node.owner)}</span><span class="stat-label">Owner</span></div>` : ""}
        ${node.subtitle ? `<div class="inspector-stat"><span class="stat-value">${escapeHtml(node.subtitle)}</span><span class="stat-label">Detail</span></div>` : ""}
      </div>
    </div>
  `;
}

function renderMitreNodeInspector(nodeId) {
  const graphData = state.ui.graph.data;
  const node = graphData?.nodes?.find((n) => n.id === nodeId);
  if (!node) {
    return `<div class="inspector-empty">Technique not found.</div>`;
  }

  const matrixData = state.ui.graph.matrix;
  const technique = matrixData?.techniques?.find((t) => t.mitreId === node.mitreId);
  const counts = technique?.counts || {};
  const isTactic = node.type === "mitre_tactic";

  return `
    <div class="inspector-card">
      <div class="inspector-header">
        <div class="inspector-icon">${escapeHtml(isTactic ? "T" : node.mitreId?.charAt(0) || "T")}</div>
        <div>
          <div class="inspector-type">MITRE ${isTactic ? "Tactic" : "Technique"}</div>
          <h2>${escapeHtml(node.mitreId || "")}</h2>
        </div>
      </div>
      <div class="inspector-tactic">${escapeHtml(node.label)}</div>
      <div class="inspector-divider"></div>
      <div class="inspector-stats">
        <div class="inspector-stat"><span class="stat-value">${counts.total || 0}</span><span class="stat-label">Evidence</span></div>
        <div class="inspector-stat"><span class="stat-value">${counts.findings || 0}</span><span class="stat-label">Findings</span></div>
        <div class="inspector-stat"><span class="stat-value">${counts.timelineEvents || 0}</span><span class="stat-label">Timeline</span></div>
        <div class="inspector-stat"><span class="stat-value">${counts.queries || 0}</span><span class="stat-label">Queries</span></div>
        ${counts.tasks ? `<div class="inspector-stat"><span class="stat-value">${counts.tasks}</span><span class="stat-label">Tasks</span></div>` : ""}
      </div>
      ${technique?.evidence?.length ? `
        <div class="inspector-section-title">Evidence (${technique.evidence.length})</div>
        <div class="inspector-evidence-list">
          ${technique.evidence.map((ev) => `
            <div class="inspector-evidence-item">
              <span class="inspector-evidence-dot dot-${escapeHtml(ev.entityType)}"></span>
              <div>
                <div class="inspector-evidence-type">${escapeHtml(ev.entityType)}</div>
                <div class="inspector-evidence-title">${escapeHtml(ev.title)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

/* ── MITRE Matrix View ── */

function renderMatrixView() {
  const graph = state.ui.graph;
  const matrixData = graph.matrix;
  const tactics = matrixData?.tactics || [];
  const techniques = matrixData?.techniques || [];

  const tacticOrder = [
    "Initial Access", "Execution", "Persistence", "Privilege Escalation",
    "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
    "Collection", "Command and Control", "Exfiltration", "Impact"
  ];

  const sortedTactics = [...tactics].sort((a, b) => {
    const ai = tacticOrder.indexOf(a.name);
    const bi = tacticOrder.indexOf(b.name);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.name.localeCompare(b.name);
  });

  return `
    <div class="graph-toolbar">
      <input class="input" type="search" placeholder="Search techniques..." value="${escapeHtml(graph.matrixQ)}" data-action="matrix-search" />
      <select class="select" data-action="matrix-filter-tactic">
        <option value="">All tactics</option>
        ${sortedTactics.map((t) => `<option value="${escapeHtml(t.name)}" ${graph.matrixTactic === t.name ? "selected" : ""}>${escapeHtml(t.name)}</option>`).join("")}
      </select>
      <select class="select" data-action="matrix-filter-entity">
        <option value="">All evidence</option>
        <option value="finding" ${graph.matrixEntityType === "finding" ? "selected" : ""}>Findings</option>
        <option value="timeline_event" ${graph.matrixEntityType === "timeline_event" ? "selected" : ""}>Timeline</option>
        <option value="query" ${graph.matrixEntityType === "query" ? "selected" : ""}>Queries</option>
        <option value="task" ${graph.matrixEntityType === "task" ? "selected" : ""}>Tasks</option>
      </select>
      <label class="toggle-label"><input type="checkbox" data-action="matrix-filter-subtech" ${graph.matrixIncludeSubtechniques ? "checked" : ""} /> Sub-techniques</label>
    </div>
    <div class="graph-body">
      <div class="matrix-wrap">
        ${sortedTactics.length ? renderMatrixGrid(sortedTactics, techniques) : `<div class="graph-empty"><div class="empty-state is-large">No MITRE matrix data. Attach ATT&CK tags to findings, timeline events, or queries.</div></div>`}
      </div>
      <aside class="graph-inspector">
        ${renderTechniqueInspector()}
      </aside>
    </div>
  `;
}

function renderMatrixGrid(tactics, techniques) {
  return `
    <div class="matrix-grid">
      ${tactics.map((tactic) => {
        const tacticTechniques = techniques.filter((t) => t.tacticId === tactic.id);
        const sortedTechniques = [...tacticTechniques].sort((a, b) => a.mitreId.localeCompare(b.mitreId));
        const parents = sortedTechniques.filter((t) => !t.parentTechniqueId);
        const children = sortedTechniques.filter((t) => t.parentTechniqueId);

        return `
          <div class="tactic-column">
            <div class="tactic-header">${escapeHtml(tactic.name)}</div>
            <div class="tech-list">
              ${parents.map((tech) => renderTechniqueCard(tech) + children.filter((c) => c.parentTechniqueId === tech.id).map((sub) => renderTechniqueCard(sub, true)).join("")).join("")}
              ${sortedTechniques.length === 0 ? `<div class="matrix-empty"></div>` : ""}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderTechniqueCard(technique, isSubtech = false) {
  const counts = technique.counts;
  const dimClass = counts.total < (state.ui.graph.matrixMinEvidence || 1) + 1 ? " is-dim" : "";
  const subClass = isSubtech ? " is-subtech" : "";
  const selClass = state.ui.graph.selectedTechniqueId === technique.id ? " is-selected" : "";

  return `
    <button
      class="technique-card${dimClass}${subClass}${selClass}"
      type="button"
      data-action="select-technique"
      data-technique-id="${escapeHtml(technique.id)}"
      aria-label="${escapeHtml(technique.mitreId)} ${escapeHtml(technique.name)}"
    >
      <div class="tech-id">${escapeHtml(technique.mitreId)}</div>
      <div class="tech-name">${escapeHtml(technique.name)}</div>
      <div class="tech-footer"><span>${counts.total} evidence</span></div>
    </button>
  `;
}

/* ── Technique Inspector ── */

function renderTechniqueInspector() {
  const techId = state.ui.graph.selectedTechniqueId;
  if (!techId) {
    return `<div class="inspector-empty">Select a technique to inspect.</div>`;
  }

  const matrixData = state.ui.graph.matrix;
  const technique = matrixData?.techniques?.find((t) => t.id === techId);
  if (!technique) {
    return `<div class="inspector-empty">Technique not found.</div>`;
  }

  const tactic = matrixData?.tactics?.find((t) => t.id === technique.tacticId);
  const counts = technique.counts;

  return `
    <div class="inspector-card">
      <div class="inspector-header">
        <div class="inspector-icon">${escapeHtml(technique.mitreId.charAt(0))}</div>
        <div>
          <div class="inspector-type">MITRE Technique</div>
          <h2>${escapeHtml(technique.mitreId)}</h2>
        </div>
      </div>
      <div class="inspector-tactic">${escapeHtml(technique.name)}${tactic ? ` · ${escapeHtml(tactic.name)}` : ""}${technique.parentTechniqueId ? ` · Sub-technique` : ""}</div>
      <div class="inspector-divider"></div>
      <div class="inspector-stats">
        <div class="inspector-stat"><span class="stat-value">${counts.total}</span><span class="stat-label">Evidence</span></div>
        <div class="inspector-stat"><span class="stat-value">${counts.findings}</span><span class="stat-label">Findings</span></div>
        <div class="inspector-stat"><span class="stat-value">${counts.timelineEvents}</span><span class="stat-label">Timeline</span></div>
        <div class="inspector-stat"><span class="stat-value">${counts.queries}</span><span class="stat-label">Queries</span></div>
        ${counts.tasks ? `<div class="inspector-stat"><span class="stat-value">${counts.tasks}</span><span class="stat-label">Tasks</span></div>` : ""}
        ${technique.firstSeen ? `<div class="inspector-stat"><span class="stat-value">${escapeHtml(new Date(technique.firstSeen).toLocaleDateString())}</span><span class="stat-label">First Seen</span></div>` : ""}
        ${technique.lastSeen ? `<div class="inspector-stat"><span class="stat-value">${escapeHtml(new Date(technique.lastSeen).toLocaleDateString())}</span><span class="stat-label">Last Seen</span></div>` : ""}
      </div>
      ${technique.evidence?.length ? `
        <div class="inspector-section-title">Evidence (${technique.evidence.length})</div>
        <div class="inspector-evidence-list">
          ${technique.evidence.map((ev) => `
            <div class="inspector-evidence-item">
              <span class="inspector-evidence-dot dot-${escapeHtml(ev.entityType)}"></span>
              <div>
                <div class="inspector-evidence-type">${escapeHtml(ev.entityType)}</div>
                <div class="inspector-evidence-title">${escapeHtml(ev.title)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

/* ── Helpers ── */

function renderSelectOptions(options, selectedValue) {
  return options.map((val) => {
    const label = String(val).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return `<option value="${escapeHtml(val)}" ${val === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}
