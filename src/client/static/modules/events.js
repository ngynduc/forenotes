import { refreshAll, selectCase, selectIncident } from "./data.js";
import {
  attachEntityLink,
  deleteEntity,
  attachTag,
  markAllVisibleNotificationsRead,
  markNotificationRead,
  openModal,
  openNotification,
  removeEntityLink,
  removeMember,
  runSearch,
  saveInlineEdit,
  startInlineEdit,
  submitModal
} from "./actions.js";
import { moveTask } from "./render/tasks.js";
import { setFlash, state } from "./state.js";
import { fetchIncidentGraph, fetchMitreMatrix } from "./graphApi.js";
import { initCodeEditors } from "./code-editor.js";

let _graphLoadPromise = null;
const GRAPH_NODE_WIDTH = 170;
const GRAPH_NODE_MIN_HEIGHT = 78;
const GRAPH_CANVAS_MIN_WIDTH = 960;
const GRAPH_CANVAS_MIN_HEIGHT = 560;
const GRAPH_NODE_GAP_X = 28;
const GRAPH_NODE_GAP_Y = 18;
const GRAPH_DRAG_THRESHOLD = 6;
let _suppressNodeClickUntil = 0;

async function triggerGraphLoad() {
  if (!state.selectedIncidentId) return;
  const g = state.ui.graph;
  _graphLoadPromise = Promise.all([
    import("./graphApi.js").then((m) =>
      m.fetchIncidentGraph(state.selectedIncidentId, {
        mode: g.mode, entityTypes: g.entityTypes, linkTypes: g.linkTypes,
        includeDerived: g.includeDerived, includeManual: g.includeManual,
        depth: g.depth, q: g.q || undefined
      })
    ),
    import("./graphApi.js").then((m) =>
      m.fetchMitreMatrix(state.selectedIncidentId, {
        includeSubtechniques: g.matrixIncludeSubtechniques,
        minEvidence: g.matrixMinEvidence || undefined,
        q: g.matrixQ || undefined, tactic: g.matrixTactic || undefined,
        entityType: g.matrixEntityType || undefined
      })
    )
  ]).then(([graphData, matrixData]) => {
    g.data = graphData;
    g.matrix = matrixData;
  }).catch((err) => {
    setFlash("error", err instanceof Error ? err.message : String(err));
  });
  return _graphLoadPromise;
}

export function initEvents(render) {
  const wrappedRender = () => {
    render();
    initCodeEditors(document.querySelector("#app"));
  };
  const root = document.querySelector("#app");
  root.addEventListener("click", (event) => handleClick(event, wrappedRender));
  root.addEventListener("change", (event) => handleChange(event, wrappedRender));
  root.addEventListener("input", (event) => handleInput(event, wrappedRender));
  root.addEventListener("focusout", (event) => handleFocusOut(event, wrappedRender));
  root.addEventListener("submit", (event) => handleSubmit(event, wrappedRender));
  root.addEventListener("dragstart", handleDragStart);
  root.addEventListener("dragover", handleDragOver);
  root.addEventListener("drop", (event) => handleDrop(event, wrappedRender));
  document.addEventListener("keydown", (event) => handleKeydown(event, wrappedRender));

  // Graph pan/zoom/drag — delegation on #app
  let _panStart = null;
  let _dragNode = null;
  let _dragOffset = null;
  let _dragNodeId = null;
  let _didMoveNode = false;
  let _pendingNodeDrag = null;

  root.addEventListener("mousedown", (event) => {
    // Zoom button clicks
    const zoomBtn = event.target.closest("[data-action='graph-zoom-in'],[data-action='graph-zoom-out'],[data-action='graph-zoom-reset']");
    if (zoomBtn) {
      event.preventDefault();
      const g = state.ui.graph;
      const action = zoomBtn.dataset.action;
      if (action === "graph-zoom-in") g.zoom = Math.min(2, g.zoom + 0.15);
      else if (action === "graph-zoom-out") g.zoom = Math.max(0.3, g.zoom - 0.15);
      else if (action === "graph-zoom-reset") { g.zoom = 1; g.panX = 0; g.panY = 0; }
      wrappedRender();
      return;
    }

    // Node drag start
    const nodeEl = event.target.closest(".graph-node");
    if (nodeEl) {
      const wrapEl = document.getElementById("graph-canvas-wrap");
      const rect = wrapEl?.getBoundingClientRect();
      if (!rect) return;
      const g = state.ui.graph;
      const point = toCanvasPoint(event, rect, g);
      _pendingNodeDrag = {
        nodeEl,
        nodeId: nodeEl.dataset.nodeId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        offsetX: point.x - parseFloat(nodeEl.style.left || 0),
        offsetY: point.y - parseFloat(nodeEl.style.top || 0)
      };
      return;
    }

    // Canvas pan start
    const wrapEl = event.target.closest("#graph-canvas-wrap");
    if (!wrapEl || event.target.closest(".graph-zoom-controls")) return;
    _panStart = { x: event.clientX, y: event.clientY, px: state.ui.graph.panX, py: state.ui.graph.panY };
    wrapEl.classList.add("is-panning");
  });

  document.addEventListener("mousemove", (event) => {
    if (_pendingNodeDrag && !_dragNode) {
      const deltaX = event.clientX - _pendingNodeDrag.startClientX;
      const deltaY = event.clientY - _pendingNodeDrag.startClientY;
      if (Math.hypot(deltaX, deltaY) >= GRAPH_DRAG_THRESHOLD) {
        _dragNode = _pendingNodeDrag.nodeEl;
        _dragNodeId = _pendingNodeDrag.nodeId;
        _dragOffset = {
          x: _pendingNodeDrag.offsetX,
          y: _pendingNodeDrag.offsetY
        };
        _didMoveNode = true;
        const wrapEl = document.getElementById("graph-canvas-wrap");
        if (wrapEl) {
          wrapEl.classList.add("is-dragging-node");
        }
      }
    }
    if (_dragNode) {
      const wrapEl = document.getElementById("graph-canvas-wrap");
      const rect = wrapEl?.getBoundingClientRect();
      if (!rect) return;
      const g = state.ui.graph;
      const point = toCanvasPoint(event, rect, g);
      const resolvedPosition = resolveDraggedNodePosition(
        point.x - _dragOffset.x,
        point.y - _dragOffset.y,
        _dragNode
      );
      _dragNode.style.left = `${resolvedPosition.x}px`;
      _dragNode.style.top = `${resolvedPosition.y}px`;
      if (_dragNodeId) {
        state.ui.graph.nodePositions[_dragNodeId] = resolvedPosition;
      }
      _dragNode.classList.add("is-dragging");
      updateGraphCanvasBounds();
      updateGraphEdges();
      return;
    }
    if (_panStart) {
      const g = state.ui.graph;
      g.panX = _panStart.px + event.clientX - _panStart.x;
      g.panY = _panStart.py + event.clientY - _panStart.y;
      const inner = document.getElementById("graph-canvas-inner");
      if (inner) inner.style.transform = `translate(${g.panX}px, ${g.panY}px) scale(${g.zoom})`;
    }
  });

  document.addEventListener("mouseup", () => {
    _pendingNodeDrag = null;
    if (_dragNode) {
      _dragNode.classList.remove("is-dragging");
      const wrapEl = document.getElementById("graph-canvas-wrap");
      if (wrapEl) {
        wrapEl.classList.remove("is-dragging-node");
      }
      if (_didMoveNode) {
        _suppressNodeClickUntil = Date.now() + 200;
      }
      _dragNode = null;
      _dragNodeId = null;
      _didMoveNode = false;
      _dragOffset = null;
      wrappedRender();
    }
    if (_panStart) {
      const wrapEl = document.getElementById("graph-canvas-wrap");
      if (wrapEl) wrapEl.classList.remove("is-panning");
      _panStart = null;
      wrappedRender();
    }
  });
}

async function handleClick(event, render) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }
  if (event.target.matches("select, option, input, textarea")) {
    return;
  }
  const action = target.dataset.action;
  const id = target.dataset.id || "";
  const entityType = target.dataset.entity || "";

  if (action === "set-section") {
    state.ui.activeSection = target.dataset.section;
    if (target.dataset.section === "graph") {
      if (state.selectedIncidentId) {
        import("./graphApi.js").then((m) => {
          const g = state.ui.graph;
          Promise.all([
            m.fetchIncidentGraph(state.selectedIncidentId, {
              mode: g.mode, includeDerived: g.includeDerived,
              includeManual: g.includeManual, depth: g.depth,
              q: g.q || undefined, entityTypes: g.entityTypes, linkTypes: g.linkTypes
            }),
            m.fetchMitreMatrix(state.selectedIncidentId, {
              includeSubtechniques: g.matrixIncludeSubtechniques,
              minEvidence: g.matrixMinEvidence || undefined,
              q: g.matrixQ || undefined, tactic: g.matrixTactic || undefined,
              entityType: g.matrixEntityType || undefined
            })
          ]).then(([graphData, matrixData]) => {
            g.data = graphData;
            g.matrix = matrixData;
            render();
          }).catch((err) => {
            setFlash("error", err instanceof Error ? err.message : String(err));
            render();
          });
        });
      }
    }
  } else if (action === "toggle-task-view") {
    state.ui.taskView = target.dataset.view;
  } else if (action === "set-entity-tab") {
    state.ui.entityTab = target.dataset.entityTab;
  } else if (action === "toggle-sidebar") {
    state.ui.sidebarExpanded = !state.ui.sidebarExpanded;
  } else if (action === "set-graph-view") {
    state.ui.graphView = target.dataset.view;
    state.ui.graph.selectedNodeId = null;
    state.ui.graph.selectedTechniqueId = null;
    triggerGraphLoad();
  } else if (action === "select-graph-node") {
    if (Date.now() < _suppressNodeClickUntil) {
      return;
    }
    state.ui.graph.selectedNodeId = target.dataset.nodeId;
    state.ui.graph.selectedTechniqueId = null;
  } else if (action === "select-technique") {
    state.ui.graph.selectedTechniqueId = target.dataset.techniqueId;
    state.ui.graph.selectedNodeId = null;
  } else if (action === "refresh") {
    await refreshAll();
  } else if (action === "select-case") {
    await selectCase(id);
  } else if (action === "open-modal") {
    openModal(entityType, id);
  } else if (action === "close-modal") {
    state.ui.modal = null;
  } else if (action === "edit-cell") {
    startInlineEdit(entityType, id, target.dataset.field);
  } else if (action === "save-inline") {
    await saveInlineEdit();
  } else if (action === "cancel-inline") {
    state.ui.inlineEdit = null;
  } else if (action === "submit-modal") {
    const form = target.closest("form");
    if (form instanceof HTMLFormElement) {
      await submitModal(form);
    }
  } else if (action === "attach-entity-link") {
    const container = target.closest("[data-entity-link-attach]");
    const select = container?.querySelector("select[name='targetId']");
    await attachEntityLink(entityType, id, target.dataset.targetType || "", select?.value || "", target.dataset.linkType || "assigned_to");
  } else if (action === "delete-entity-link") {
    await removeEntityLink(target.dataset.linkId || "", entityType);
  } else {
    await handleTableActions(action, target, id, entityType);
  }
  render();
}

function toCanvasPoint(event, rect, graph) {
  return {
    x: (event.clientX - rect.left - graph.panX) / graph.zoom,
    y: (event.clientY - rect.top - graph.panY) / graph.zoom
  };
}

function updateGraphEdges() {
  const edgeGroups = document.querySelectorAll(".graph-edge");
  for (const edgeGroup of edgeGroups) {
    const sourceId = edgeGroup.getAttribute("data-source-node");
    const targetId = edgeGroup.getAttribute("data-target-node");
    if (!sourceId || !targetId) {
      continue;
    }

    const sourceNode = document.querySelector(`.graph-node[data-node-id="${CSS.escape(sourceId)}"]`);
    const targetNode = document.querySelector(`.graph-node[data-node-id="${CSS.escape(targetId)}"]`);
    const path = edgeGroup.querySelector(".graph-edge-line");
    const label = edgeGroup.querySelector(".graph-edge-label");
    if (!(sourceNode instanceof HTMLElement) || !(targetNode instanceof HTMLElement) || !(path instanceof SVGPathElement) || !(label instanceof SVGTextElement)) {
      continue;
    }

    const geometry = getEdgeGeometryFromElements(sourceNode, targetNode);
    path.setAttribute("d", geometry.path);
    label.setAttribute("x", String(geometry.labelX));
    label.setAttribute("y", String(geometry.labelY));
  }
}

function updateGraphCanvasBounds() {
  const canvas = document.querySelector(".graph-canvas");
  const svg = document.querySelector(".graph-svg-layer");
  const nodes = [...document.querySelectorAll(".graph-node")];
  if (!(canvas instanceof HTMLElement) || !(svg instanceof SVGSVGElement) || nodes.length === 0) {
    return;
  }

  const maxX = Math.max(...nodes.map((node) => parseFloat(node.style.left || "0") + (node.offsetWidth || GRAPH_NODE_WIDTH) + 80));
  const maxY = Math.max(...nodes.map((node) => parseFloat(node.style.top || "0") + (node.offsetHeight || GRAPH_NODE_MIN_HEIGHT) + 80));
  const width = Math.max(GRAPH_CANVAS_MIN_WIDTH, Math.ceil(maxX));
  const height = Math.max(GRAPH_CANVAS_MIN_HEIGHT, Math.ceil(maxY));

  canvas.style.minWidth = `${width}px`;
  canvas.style.minHeight = `${height}px`;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
}

function getEdgeGeometryFromElements(sourceNode, targetNode) {
  const source = getAnchorPoint(sourceNode, targetNode);
  const target = getAnchorPoint(targetNode, sourceNode);
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const curveOffset = Math.max(36, Math.min(120, Math.max(Math.abs(dx), Math.abs(dy)) * 0.35));
  const control1X = source.x + (Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx || 1) * curveOffset : 0);
  const control1Y = source.y + (Math.abs(dx) >= Math.abs(dy) ? 0 : Math.sign(dy || 1) * curveOffset);
  const control2X = target.x - (Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx || 1) * curveOffset : 0);
  const control2Y = target.y - (Math.abs(dx) >= Math.abs(dy) ? 0 : Math.sign(dy || 1) * curveOffset);

  return {
    path: `M ${source.x} ${source.y} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${target.x} ${target.y}`,
    labelX: (source.x + target.x) / 2,
    labelY: (source.y + target.y) / 2 - 8
  };
}

function getAnchorPoint(nodeEl, otherNodeEl) {
  const nodeX = parseFloat(nodeEl.style.left || "0");
  const nodeY = parseFloat(nodeEl.style.top || "0");
  const nodeWidth = nodeEl.offsetWidth || GRAPH_NODE_WIDTH;
  const nodeHeight = nodeEl.offsetHeight || GRAPH_NODE_MIN_HEIGHT;
  const otherX = parseFloat(otherNodeEl.style.left || "0");
  const otherY = parseFloat(otherNodeEl.style.top || "0");
  const otherWidth = otherNodeEl.offsetWidth || GRAPH_NODE_WIDTH;
  const otherHeight = otherNodeEl.offsetHeight || GRAPH_NODE_MIN_HEIGHT;
  const nodeCenterX = nodeX + nodeWidth / 2;
  const nodeCenterY = nodeY + nodeHeight / 2;
  const otherCenterX = otherX + otherWidth / 2;
  const otherCenterY = otherY + otherHeight / 2;
  const dx = otherCenterX - nodeCenterX;
  const dy = otherCenterY - nodeCenterY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: nodeX + (dx >= 0 ? nodeWidth : 0),
      y: nodeCenterY
    };
  }

  return {
    x: nodeCenterX,
    y: nodeY + (dy >= 0 ? nodeHeight : 0)
  };
}

function resolveDraggedNodePosition(nextX, nextY, activeNode) {
  const candidate = {
    x: Math.max(24, Math.round(nextX)),
    y: Math.max(24, Math.round(nextY))
  };
  const otherNodes = [...document.querySelectorAll(".graph-node")]
    .filter((node) => node !== activeNode)
    .map((node) => ({
      x: parseFloat(node.style.left || "0"),
      y: parseFloat(node.style.top || "0"),
      width: node.offsetWidth || GRAPH_NODE_WIDTH,
      height: node.offsetHeight || GRAPH_NODE_MIN_HEIGHT
    }))
    .sort((left, right) => left.y - right.y || left.x - right.x);

  let attempts = 0;
  while (attempts <= otherNodes.length * 4) {
    const overlap = otherNodes.find((node) => draggedNodeOverlaps(candidate, node));
    if (!overlap) {
      return candidate;
    }

    candidate.y = Math.round(overlap.y + overlap.height + GRAPH_NODE_GAP_Y);
    attempts += 1;
  }

  return candidate;
}

function draggedNodeOverlaps(candidate, otherNode) {
  return !(
    candidate.x + GRAPH_NODE_WIDTH + GRAPH_NODE_GAP_X <= otherNode.x ||
    otherNode.x + otherNode.width + GRAPH_NODE_GAP_X <= candidate.x ||
    candidate.y + GRAPH_NODE_MIN_HEIGHT + GRAPH_NODE_GAP_Y <= otherNode.y ||
    otherNode.y + otherNode.height + GRAPH_NODE_GAP_Y <= candidate.y
  );
}

async function handleTableActions(action, target, id, entityType) {
  if (action === "sort-table") {
    const tableState = state.ui.table[target.dataset.table];
    const field = target.dataset.field;
    tableState.sortDir = tableState.sortField === field && tableState.sortDir === "asc" ? "desc" : "asc";
    tableState.sortField = field;
  } else if (action === "page-prev" || action === "page-next") {
    const tableState = state.ui.table[target.dataset.table];
    tableState.page = Math.max(1, tableState.page + (action === "page-prev" ? -1 : 1));
  } else if (action === "mark-read") {
    await markNotificationRead(id);
  } else if (action === "mark-all-read") {
    await markAllVisibleNotificationsRead();
  } else if (action === "open-notification") {
    await openNotification(id);
  } else if (action === "delete-entity") {
    await deleteEntity(entityType, id);
  } else if (action === "remove-member") {
    await removeMember(target.dataset.scope, id);
  } else if (action === "attach-tag") {
    const container = target.closest("[data-tag-attach]");
    const select = container?.querySelector("select[name='tagId']");
    await attachTag(entityType, id, target.dataset.tagType, select?.value || "");
  }
}

async function handleChange(event, render) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const action = target.dataset.action;

  if (action === "change-active-user" && target instanceof HTMLSelectElement) {
    state.activeUserId = target.value;
    localStorage.setItem("forenotes.activeUserId", state.activeUserId);
    state.selectedCaseId = "";
    state.selectedIncidentId = "";
    state.ui.activeSection = "cases";
    await refreshAll();
    render();
    return;
  }
  if (action === "select-incident-context" && target instanceof HTMLSelectElement) {
    await selectIncident(target.value);
    render();
    return;
  }
  if (action === "page-size" && target instanceof HTMLSelectElement) {
    const tableState = state.ui.table[target.dataset.table];
    tableState.pageSize = Number(target.value);
    tableState.page = 1;
    render();
    return;
  }
  if (target.matches("[data-inline-input]")) {
    state.ui.inlineEdit.draft = target.value;
  }

  // Graph filter changes
  if (action === "graph-filter-mode" && target instanceof HTMLSelectElement) {
    state.ui.graph.mode = target.value;
    triggerGraphLoad().then(render);
    return;
  }
  if (action === "matrix-filter-tactic" && target instanceof HTMLSelectElement) {
    state.ui.graph.matrixTactic = target.value;
    triggerGraphLoad().then(render);
    return;
  }
  if (action === "matrix-filter-entity" && target instanceof HTMLSelectElement) {
    state.ui.graph.matrixEntityType = target.value;
    triggerGraphLoad().then(render);
    return;
  }
  if (action === "graph-filter-derived" && target instanceof HTMLInputElement) {
    state.ui.graph.includeDerived = target.checked;
    triggerGraphLoad().then(render);
    return;
  }
  if (action === "graph-filter-manual" && target instanceof HTMLInputElement) {
    state.ui.graph.includeManual = target.checked;
    triggerGraphLoad().then(render);
    return;
  }
  if (action === "matrix-filter-subtech" && target instanceof HTMLInputElement) {
    state.ui.graph.matrixIncludeSubtechniques = target.checked;
    triggerGraphLoad().then(render);
    return;
  }
}

function handleInput(event, render) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (target.matches("[data-inline-input]")) {
    state.ui.inlineEdit.draft = target.value;
    return;
  }
  if (target.matches("[data-action='table-search']")) {
    const tableState = state.ui.table[target.dataset.table];
    tableState.search = target.value;
    tableState.page = 1;
  }
  if (target.matches("[data-action='graph-search']")) {
    state.ui.graph.q = target.value;
  }
  if (target.matches("[data-action='matrix-search']")) {
    state.ui.graph.matrixQ = target.value;
  }
}

function handleFocusOut(event, render) {
  if (event.target.matches("[data-action='table-search']")) {
    render();
  }
  if (event.target.matches("[data-action='graph-search']")) {
    triggerGraphLoad().then(render);
  }
  if (event.target.matches("[data-action='matrix-search']")) {
    triggerGraphLoad().then(render);
  }
}

async function handleSubmit(event, render) {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  if (form.dataset.form === "modal") {
    await submitModal(form);
  } else if (form.dataset.form === "global-search") {
    await runSearch(form);
  }
  render();
}

function handleDragStart(event) {
  const card = event.target.closest("[data-drag-task]");
  if (card) {
    event.dataTransfer.setData("text/plain", card.dataset.dragTask);
  }
}

function handleDragOver(event) {
  if (event.target.closest("[data-drop-status]")) {
    event.preventDefault();
  }
}

async function handleDrop(event, render) {
  const column = event.target.closest("[data-drop-status]");
  if (!column) {
    return;
  }
  event.preventDefault();
  const taskId = event.dataTransfer.getData("text/plain");
  if (!taskId) {
    return;
  }
  try {
    await moveTask(taskId, column.dataset.dropStatus);
    setFlash("success", "Task status updated.");
  } catch (error) {
    setFlash("error", error instanceof Error ? error.message : String(error));
  }
  render();
}

async function handleKeydown(event, render) {
  if (event.key === "Escape") {
    if (state.ui.inlineEdit) {
      state.ui.inlineEdit = null;
      render();
      return;
    }
    if (state.ui.modal) {
      state.ui.modal = null;
      render();
    }
  }
  if (event.key === "Enter" && state.ui.inlineEdit && event.target.matches("[data-inline-input]")) {
    event.preventDefault();
    await saveInlineEdit();
    render();
    return;
  }
  if (event.key === "Enter" && event.target.matches("[data-action='table-search']")) {
    event.preventDefault();
    render();
  }
  if (event.key === "Enter" && (event.target.matches("[data-action='graph-search']") || event.target.matches("[data-action='matrix-search']"))) {
    event.preventDefault();
    triggerGraphLoad().then(render);
  }
}
