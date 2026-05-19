import { escapeHtml } from "../helpers.js";
import { state } from "../state.js";
import { formatMemberName } from "../tableDefinitions.js";

const GRAPH_NODE_WIDTH = 170;
const GRAPH_NODE_MIN_HEIGHT = 78;
const GRAPH_CANVAS_MIN_WIDTH = 960;
const GRAPH_CANVAS_MIN_HEIGHT = 560;
const GRAPH_NODE_GAP_X = 28;
const GRAPH_NODE_GAP_Y = 18;
const GRAPH_LANE_GAP_Y = 88;
const RELATIONSHIP_VISIBLE_NODE_TYPES = new Set(["finding", "timeline_event", "user"]);

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
  const { nodes, edges } = getRenderableGraphData(graphData);
  const stats = graphData?.stats ? buildVisibleStats(nodes, edges, graphData.stats) : null;
  const zoomPct = Math.round(graph.zoom * 100);

  const positionedNodes = layoutNodes(nodes, edges, graph.nodePositions);

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
  const selectedNodeId = state.ui.graph.selectedNodeId;
  const canvasWidth = Math.max(
    GRAPH_CANVAS_MIN_WIDTH,
    ...positionedNodes.map((node) => node.x + GRAPH_NODE_WIDTH + 80)
  );
  const canvasHeight = Math.max(
    GRAPH_CANVAS_MIN_HEIGHT,
    ...positionedNodes.map((node) => node.y + GRAPH_NODE_MIN_HEIGHT + 80)
  );

  const nodeEls = positionedNodes.map((node) => {
    const shortType = node.type.replace("mitre_", "");
    return `
      <button
        class="graph-node type-${escapeHtml(node.type)} ${state.ui.graph.selectedNodeId === node.id ? "is-selected" : ""}"
        style="left: ${node.x}px; top: ${node.y}px"
        type="button"
        data-action="select-graph-node"
        data-node-id="${escapeHtml(node.id)}"
        data-node-type="${escapeHtml(node.type)}"
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

    const geometry = getEdgeGeometry(sourcePos, targetPos);
    const isConnectedToSelected = selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
    const edgeClass = [
      "graph-edge",
      isConnectedToSelected ? "is-highlighted" : "",
      selectedNodeId && !isConnectedToSelected ? "is-muted" : ""
    ].filter(Boolean).join(" ");

    return `
      <g class="${edgeClass}" data-edge-id="${escapeHtml(edge.id)}" data-source-node="${escapeHtml(edge.source)}" data-target-node="${escapeHtml(edge.target)}">
        <path class="graph-edge-line ${edge.derived ? "is-derived" : ""}" d="${geometry.path}" />
        <text class="graph-edge-label" x="${geometry.labelX}" y="${geometry.labelY}" text-anchor="middle">${escapeHtml(edge.label)}</text>
      </g>
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

function layoutNodes(nodes, edges, savedPositions = {}) {
  const fallbackLayout = layoutNodesByColumns(nodes, savedPositions);
  const edgeAdjacency = buildEdgeAdjacency(edges);
  const laneOrder = ["finding", "timeline_event", "user"];
  const laneConfig = new Map(laneOrder.map((lane) => [lane, { rows: [] }]));
  const timeNodes = nodes
    .map((node) => ({
      node,
      lane: getLaneForNode(node),
      timestamp: getNodeTimestamp(node)
    }))
    .filter((entry) => entry.lane !== "user" && entry.timestamp !== null)
    .sort((left, right) => left.timestamp - right.timestamp || left.node.label.localeCompare(right.node.label));

  if (!timeNodes.length) {
    return resolveNodeCollisions(fallbackLayout);
  }

  const minTimestamp = timeNodes[0].timestamp;
  const maxTimestamp = timeNodes[timeNodes.length - 1].timestamp;
  const positioned = [];
  const xPadding = 72;
  const availableWidth = Math.max(
    GRAPH_CANVAS_MIN_WIDTH - xPadding * 2 - GRAPH_NODE_WIDTH,
    240,
    (timeNodes.length - 1) * 184
  );
  const timestampSpan = Math.max(maxTimestamp - minTimestamp, 1);

  for (const { node, lane, timestamp } of timeNodes) {
    const saved = savedPositions[node.id];
    if (saved) {
      positioned.push({ ...node, x: saved.x, y: saved.y, lane });
      continue;
    }

    const normalized = (timestamp - minTimestamp) / timestampSpan;
    const baseX = xPadding + normalized * availableWidth;
    const lanePlacement = placeNodeInLane(baseX, laneConfig.get(lane)?.rows || []);
    positioned.push({ ...node, x: lanePlacement.x, rowIndex: lanePlacement.rowIndex, lane });
  }

  const positionedById = new Map(positioned.map((node) => [node.id, node]));

  const remainingNodes = nodes
    .filter((node) => !positionedById.has(node.id))
    .sort((left, right) => {
      const leftLane = getLaneForNode(left);
      const rightLane = getLaneForNode(right);
      if (leftLane !== rightLane) {
        return leftLane.localeCompare(rightLane);
      }
      return left.label.localeCompare(right.label);
    });

  for (const node of remainingNodes) {
    const saved = savedPositions[node.id];
    if (saved) {
      positioned.push({ ...node, x: saved.x, y: saved.y, lane: getLaneForNode(node) });
      positionedById.set(node.id, { ...node, x: saved.x, y: saved.y, lane: getLaneForNode(node) });
      continue;
    }

    const lane = getLaneForNode(node);
    const anchorX = getAnchoredNodeX(node.id, edgeAdjacency, positionedById) ?? getFallbackNodeX(positionedById, lane);
    const lanePlacement = placeNodeInLane(anchorX, laneConfig.get(lane)?.rows || []);
    const placedNode = { ...node, x: lanePlacement.x, rowIndex: lanePlacement.rowIndex, lane };
    positioned.push(placedNode);
    positionedById.set(node.id, placedNode);
  }

  return resolveNodeCollisions(applyLaneVerticalSpacing(positioned, laneOrder));
}

function layoutNodesByColumns(nodes, savedPositions = {}) {
  const columnOrder = ["finding", "timeline_event", "user"];
  const columns = new Map();
  for (const node of nodes) {
    const col = columns.get(node.type) || [];
    col.push(node);
    columns.set(node.type, col);
  }

  const positioned = [];
  const colWidth = 240;
  const rowHeight = 128;
  const startX = 60;
  const startY = 40;
  const nonUserRowCount = Math.max(
    1,
    ...columnOrder
      .filter((nodeType) => nodeType !== "user")
      .map((nodeType) => (columns.get(nodeType) || []).length)
  );
  const userStartRowIndex = nonUserRowCount - 1;

  let colIndex = 0;
  for (const nodeType of columnOrder) {
    const colNodes = columns.get(nodeType) || [];
    if (colNodes.length === 0) {
      colIndex += 1;
      continue;
    }

    colNodes.forEach((node, rowIndex) => {
      const saved = savedPositions[node.id];
      const defaultRowIndex = nodeType === "user" ? userStartRowIndex + rowIndex : rowIndex;
      positioned.push({
        ...node,
        x: saved?.x ?? (startX + colIndex * colWidth),
        y: saved?.y ?? (startY + defaultRowIndex * rowHeight)
      });
    });
    colIndex += 1;
  }

  return positioned;
}

function buildEdgeAdjacency(edges) {
  const adjacency = new Map();
  for (const edge of edges) {
    const source = adjacency.get(edge.source) || [];
    source.push(edge.target);
    adjacency.set(edge.source, source);
    const target = adjacency.get(edge.target) || [];
    target.push(edge.source);
    adjacency.set(edge.target, target);
  }
  return adjacency;
}

function getLaneForNode(node) {
  if (node.type === "timeline_event") return "timeline_event";
  if (node.type === "user") return "user";
  return "finding";
}

function getNodeTimestamp(node) {
  const metadata = node.metadata || {};
  const candidate =
    (node.type === "timeline_event" ? metadata.eventTime : undefined) ||
    metadata.observedAt ||
    metadata.createdAt ||
    metadata.updatedAt;
  const timestamp = Date.parse(candidate || "");
  return Number.isNaN(timestamp) ? null : timestamp;
}

function placeNodeInLane(baseX, laneRows) {
  const minGap = GRAPH_NODE_WIDTH + GRAPH_NODE_GAP_X;
  let rowIndex = 0;

  while (true) {
    const row = laneRows[rowIndex] || [];
    const previous = row[row.length - 1];
    const nextX = previous ? Math.max(baseX, previous + minGap) : baseX;
    if (nextX === baseX || nextX - baseX <= minGap * 0.75) {
      row.push(nextX);
      laneRows[rowIndex] = row;
      return {
        x: Math.round(nextX),
        rowIndex
      };
    }
    rowIndex += 1;
  }
}

function applyLaneVerticalSpacing(nodes, laneOrder) {
  const rowHeight = GRAPH_NODE_MIN_HEIGHT + GRAPH_NODE_GAP_Y;
  let laneBaseY = 64;
  const nodesByLane = new Map(laneOrder.map((lane) => [lane, nodes.filter((node) => getLaneForNode(node) === lane)]));
  const positioned = [];

  for (const lane of laneOrder) {
    const laneNodes = nodesByLane.get(lane) || [];
    const maxRowIndex = laneNodes.length ? Math.max(...laneNodes.map((node) => node.rowIndex || 0)) : 0;

    for (const node of laneNodes) {
      positioned.push({
        ...node,
        y: Number.isFinite(node.y) ? node.y : laneBaseY + (node.rowIndex || 0) * rowHeight
      });
    }

    laneBaseY += GRAPH_NODE_MIN_HEIGHT + maxRowIndex * rowHeight + GRAPH_LANE_GAP_Y;
  }

  return positioned;
}

function resolveNodeCollisions(nodes) {
  const placed = [];

  for (const node of [...nodes].sort(compareNodePositions)) {
    let candidate = { ...node };
    let attempts = 0;

    while (true) {
      const overlapping = placed.find((existing) => nodesOverlap(candidate, existing));
      if (!overlapping || attempts > nodes.length * 4) {
        break;
      }

      candidate = {
        ...candidate,
        y: overlapping.y + GRAPH_NODE_MIN_HEIGHT + GRAPH_NODE_GAP_Y
      };
      attempts += 1;
    }

    placed.push(candidate);
  }

  return placed;
}

function compareNodePositions(left, right) {
  if (left.y !== right.y) {
    return left.y - right.y;
  }
  return left.x - right.x;
}

function nodesOverlap(left, right) {
  return !(
    left.x + GRAPH_NODE_WIDTH + GRAPH_NODE_GAP_X <= right.x ||
    right.x + GRAPH_NODE_WIDTH + GRAPH_NODE_GAP_X <= left.x ||
    left.y + GRAPH_NODE_MIN_HEIGHT + GRAPH_NODE_GAP_Y <= right.y ||
    right.y + GRAPH_NODE_MIN_HEIGHT + GRAPH_NODE_GAP_Y <= left.y
  );
}

function getAnchoredNodeX(nodeId, edgeAdjacency, positionedById) {
  const neighbors = edgeAdjacency.get(nodeId) || [];
  const anchoredXs = [];

  for (const neighborId of neighbors) {
    const placed = positionedById.get(neighborId);
    if (placed) {
      anchoredXs.push(placed.x);
    }
  }

  if (!anchoredXs.length) {
    return null;
  }

  const average = anchoredXs.reduce((sum, value) => sum + value, 0) / anchoredXs.length;
  return Number.isFinite(average) ? average : null;
}

function getFallbackNodeX(positionedById, lane) {
  const placedNodes = [...positionedById.values()].filter((node) => getLaneForNode(node) === lane);
  if (!placedNodes.length) {
    return 72;
  }
  return Math.max(...placedNodes.map((node) => node.x)) + GRAPH_NODE_WIDTH + 40;
}

function getRenderableGraphData(graphData) {
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const visibleNodes = nodes.filter((node) => RELATIONSHIP_VISIBLE_NODE_TYPES.has(node.type));
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));

  return {
    nodes: visibleNodes,
    edges: edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
  };
}

function buildVisibleStats(nodes, edges, stats) {
  const countByType = (type) => nodes.filter((node) => node.type === type).length;
  return {
    ...stats,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    findings: countByType("finding"),
    timelineEvents: countByType("timeline_event"),
    tasks: countByType("task"),
    mitreTechniques: countByType("mitre_technique"),
    mitreTactics: countByType("mitre_tactic"),
    systems: countByType("system"),
    accounts: countByType("account"),
    iocs: countByType("ioc"),
    manualLinks: edges.filter((edge) => !edge.derived).length,
    derivedLinks: edges.filter((edge) => edge.derived).length
  };
}

function getEdgeGeometry(sourcePos, targetPos) {
  const sourcePoint = getNodeAnchorPoint(sourcePos, targetPos);
  const targetPoint = getNodeAnchorPoint(targetPos, sourcePos);
  const dx = targetPoint.x - sourcePoint.x;
  const dy = targetPoint.y - sourcePoint.y;
  const curveOffset = Math.max(36, Math.min(120, Math.max(Math.abs(dx), Math.abs(dy)) * 0.35));
  const control1X = sourcePoint.x + (Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx || 1) * curveOffset : 0);
  const control1Y = sourcePoint.y + (Math.abs(dx) >= Math.abs(dy) ? 0 : Math.sign(dy || 1) * curveOffset);
  const control2X = targetPoint.x - (Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx || 1) * curveOffset : 0);
  const control2Y = targetPoint.y - (Math.abs(dx) >= Math.abs(dy) ? 0 : Math.sign(dy || 1) * curveOffset);

  return {
    path: `M ${sourcePoint.x} ${sourcePoint.y} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${targetPoint.x} ${targetPoint.y}`,
    labelX: (sourcePoint.x + targetPoint.x) / 2,
    labelY: (sourcePoint.y + targetPoint.y) / 2 - 8
  };
}

function getNodeAnchorPoint(node, otherNode) {
  const nodeCenterX = node.x + GRAPH_NODE_WIDTH / 2;
  const nodeCenterY = node.y + GRAPH_NODE_MIN_HEIGHT / 2;
  const otherCenterX = otherNode.x + GRAPH_NODE_WIDTH / 2;
  const otherCenterY = otherNode.y + GRAPH_NODE_MIN_HEIGHT / 2;
  const dx = otherCenterX - nodeCenterX;
  const dy = otherCenterY - nodeCenterY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: node.x + (dx >= 0 ? GRAPH_NODE_WIDTH : 0),
      y: nodeCenterY
    };
  }

  return {
    x: nodeCenterX,
    y: node.y + (dy >= 0 ? GRAPH_NODE_MIN_HEIGHT : 0)
  };
}

function getLinkedEntities(nodeId) {
  const graphData = state.ui.graph.data;
  const nodesById = new Map((graphData?.nodes || []).map((entry) => [entry.id, entry]));
  const linked = [];

  for (const edge of graphData?.edges || []) {
    const isSource = edge.source === nodeId;
    const isTarget = edge.target === nodeId;
    if (!isSource && !isTarget) {
      continue;
    }

    const relatedNodeId = isSource ? edge.target : edge.source;
    const relatedNode = nodesById.get(relatedNodeId);
    if (!relatedNode) {
      continue;
    }

    linked.push({
      edgeId: edge.id,
      edgeLabel: edge.label,
      derived: edge.derived,
      node: relatedNode
    });
  }

  return linked.sort((a, b) => {
    if (a.node.type !== b.node.type) {
      return a.node.type.localeCompare(b.node.type);
    }
    return a.node.label.localeCompare(b.node.label);
  });
}

function renderLinkedEntities(linkedEntities) {
  if (!linkedEntities.length) {
    return `<div class="inspector-empty">No linked entities.</div>`;
  }

  return `
    <div class="inspector-section-title">Linked Entities (${linkedEntities.length})</div>
    <div class="inspector-evidence-list">
      ${linkedEntities.map((entry) => `
        <div class="inspector-evidence-item">
          <span class="inspector-evidence-dot dot-${escapeHtml(entry.node.type)}"></span>
          <div>
            <div class="inspector-evidence-type">${escapeHtml(entry.node.type.replace(/_/g, " "))} · ${escapeHtml(entry.edgeLabel)}${entry.derived ? " · derived" : ""}</div>
            <div class="inspector-evidence-title">${escapeHtml(entry.node.label)}</div>
            ${entry.node.subtitle ? `<div class="graph-node-sub">${escapeHtml(entry.node.subtitle)}</div>` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
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
  const linkedEntities = getLinkedEntities(nodeId);
  const ownerLabel = node.owner ? formatMemberName(node.owner) : "";

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
        ${ownerLabel ? `<div class="inspector-stat"><span class="stat-value">${escapeHtml(ownerLabel)}</span><span class="stat-label">Owner</span></div>` : ""}
        ${node.subtitle ? `<div class="inspector-stat"><span class="stat-value">${escapeHtml(node.subtitle)}</span><span class="stat-label">Detail</span></div>` : ""}
        <div class="inspector-stat"><span class="stat-value">${linkedEntities.length}</span><span class="stat-label">Linked</span></div>
      </div>
      ${renderLinkedEntities(linkedEntities)}
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
