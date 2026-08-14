const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let vertices = [];
let edges = [];
let startVertex = null;
let endVertex = null;
let lastPath = [];
let lastExplored = [];
let hoveredEdge = null;

const VERTEX_RADIUS = 8;
const MIN_VERTEX_DISTANCE = 30;

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    redraw();
}

function generateVertices(n) {
    if (n < 2) {
        alert('Please enter at least 2 vertices');
        return;
    }
    if (n > 100) {
        alert('Maximum 100 vertices allowed');
        return;
    }

    vertices = [];
    let attempts = 0;
    const maxAttempts = n * 100;

    while (vertices.length < n && attempts < maxAttempts) {
        const x = Math.random() * (canvas.width - 100) + 50;
        const y = Math.random() * (canvas.height - 100) + 50;

        let tooClose = false;
        for (const vertex of vertices) {
            const dist = Math.hypot(x - vertex[0], y - vertex[1]);
            if (dist < MIN_VERTEX_DISTANCE) {
                tooClose = true;
                break;
            }
        }

        if (!tooClose) {
            vertices.push([x, y]);
        }
        attempts++;
    }

    startVertex = null;
    endVertex = null;
    lastPath = [];
    lastExplored = [];
    hoveredEdge = null;

    redraw();
}

function generateEdges(maxEdges, minDistance) {
    edges = [];
    const edgeSet = new Set();

    function distance(v1, v2) {
        return Math.hypot(v1[0] - v2[0], v1[1] - v2[1]);
    }

    // Ensure graph connectivity using MST-like approach
    if (vertices.length >= 2) {
        const connected = new Set([0]);
        const candidates = [];

        while (connected.size < vertices.length) {
            for (const v1 of connected) {
                for (let v2 = 0; v2 < vertices.length; v2++) {
                    if (!connected.has(v2)) {
                        const d = distance(vertices[v1], vertices[v2]);
                        if (d >= minDistance) {
                            candidates.push({ v1, v2, d });
                        }
                    }
                }
            }

            if (candidates.length === 0) break;
            candidates.sort((a, b) => a.d - b.d);
            const { v1, v2, d } = candidates.shift();
            candidates.length = 0;

            if (!connected.has(v2)) {
                connected.add(v2);
                const key = [Math.min(v1, v2), Math.max(v1, v2)].join(',');
                if (!edgeSet.has(key)) {
                    edgeSet.add(key);
                    edges.push([v1, v2, parseFloat(d.toFixed(2))]);
                }
            }
        }
    }

    // Add random edges
    if (maxEdges === -1) {
        maxEdges = vertices.length * (vertices.length - 1) / 2;
    }

    const remainingEdges = maxEdges - edges.length;

    for (let i = 0; i < remainingEdges && edges.length < maxEdges; i++) {
        const v1 = Math.floor(Math.random() * vertices.length);
        let v2 = Math.floor(Math.random() * vertices.length);

        while (v2 === v1) {
            v2 = Math.floor(Math.random() * vertices.length);
        }

        const key = [Math.min(v1, v2), Math.max(v1, v2)].join(',');
        if (!edgeSet.has(key)) {
            const d = distance(vertices[v1], vertices[v2]);
            if (d >= minDistance) {
                edgeSet.add(key);
                edges.push([v1, v2, parseFloat(d.toFixed(2))]);
            }
        }
    }

    startVertex = null;
    endVertex = null;
    lastPath = [];
    lastExplored = [];
    hoveredEdge = null;

    redraw();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach((edge, idx) => {
        const [v1, v2, dist] = edge;
        const x1 = vertices[v1][0];
        const y1 = vertices[v1][1];
        const x2 = vertices[v2][0];
        const y2 = vertices[v2][1];

        if (lastPath.some((v, i) => i < lastPath.length - 1 &&
            ((lastPath[i] === v1 && lastPath[i + 1] === v2) ||
                (lastPath[i] === v2 && lastPath[i + 1] === v1)))) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
        } else if (lastExplored.includes(v1) && lastExplored.includes(v2)) {
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = hoveredEdge === idx ? '#FF6B6B' : '#999';
            ctx.lineWidth = hoveredEdge === idx ? 3 : 1;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    });

    // Draw vertices
    vertices.forEach((vertex, idx) => {
        const x = vertex[0];
        const y = vertex[1];

        if (idx === startVertex) {
            ctx.fillStyle = '#4CAF50';
        } else if (idx === endVertex) {
            ctx.fillStyle = '#f44336';
        } else if (lastExplored.includes(idx)) {
            ctx.fillStyle = '#2196F3';
        } else {
            ctx.fillStyle = '#808080';
        }

        ctx.beginPath();
        ctx.arc(x, y, VERTEX_RADIUS, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function getVertexAt(x, y) {
    for (let i = 0; i < vertices.length; i++) {
        const dist = Math.hypot(x - vertices[i][0], y - vertices[i][1]);
        if (dist <= VERTEX_RADIUS + 5) {
            return i;
        }
    }
    return null;
}

function getEdgeAt(x, y) {
    const threshold = 10;
    for (let i = 0; i < edges.length; i++) {
        const [v1, v2] = edges[i];
        const x1 = vertices[v1][0];
        const y1 = vertices[v1][1];
        const x2 = vertices[v2][0];
        const y2 = vertices[v2][1];

        const dist = pointToSegmentDistance(x, y, x1, y1, x2, y2);
        if (dist < threshold) {
            return i;
        }
    }
    return null;
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    return Math.hypot(px - xx, py - yy);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edgeIdx = getEdgeAt(x, y);
    if (edgeIdx !== null && hoveredEdge !== edgeIdx) {
        hoveredEdge = edgeIdx;
        redraw();
    } else if (edgeIdx === null && hoveredEdge !== null) {
        hoveredEdge = null;
        redraw();
    }

    if (hoveredEdge !== null) {
        const [v1, v2, dist] = edges[hoveredEdge];
        canvas.title = `Distance: ${dist}`;
    } else {
        canvas.title = '';
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (lastPath.length > 0) return; // Disable selection during display

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const vertex = getVertexAt(x, y);
    if (vertex !== null) {
        if (e.button === 0) { // LMB
            startVertex = vertex;
        } else if (e.button === 2) { // RMB
            endVertex = vertex;
        }
        redraw();
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// UI Controls
document.getElementById('numVertices').addEventListener('change', (e) => {
    document.getElementById('vertexCount').textContent = e.target.value;
});

document.getElementById('maxEdges').addEventListener('change', (e) => {
    document.getElementById('edgeCount').textContent = e.target.value === '-1' ? 'All' : e.target.value;
});

document.getElementById('generateBtn').addEventListener('click', () => {
    const n = parseInt(document.getElementById('numVertices').value);
    generateVertices(n);

    const maxEdges = parseInt(document.getElementById('maxEdges').value);
    const minDistance = parseInt(document.getElementById('minDistance').value);
    generateEdges(maxEdges, minDistance);
});

document.getElementById('runBtn').addEventListener('click', () => {
    if (startVertex === null || endVertex === null) {
        alert('Please select start (LMB) and end (RMB) vertices');
        return;
    }

    if (startVertex === endVertex) {
        alert('Start and end vertices cannot be the same');
        return;
    }

    const algorithm = document.getElementById('algorithm').value;
    let result;

    if (algorithm === 'astar') {
        result = aStar(edges, vertices, startVertex, endVertex);
    } else {
        result = dijkstra(edges, vertices, startVertex, endVertex);
    }

    lastPath = result.path;
    lastExplored = result.explored;

    const resultBox = document.getElementById('resultBox');
    if (result.path.length > 0) {
        resultBox.innerHTML = `
            <strong>Path found!</strong><br>
            Distance: ${result.distance}<br>
            Vertices in path: ${result.path.length}
        `;
    } else {
        resultBox.innerHTML = '<strong>No path found</strong>';
    }
    resultBox.classList.add('show');

    redraw();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    lastPath = [];
    lastExplored = [];
    startVertex = null;
    endVertex = null;
    document.getElementById('resultBox').classList.remove('show');
    redraw();
});
