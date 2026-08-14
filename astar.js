class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        const queueElement = { element, priority };
        let added = false;

        for (let i = 0; i < this.elements.length; i++) {
            if (queueElement.priority < this.elements[i].priority) {
                this.elements.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }

        if (!added) {
            this.elements.push(queueElement);
        }
    }

    dequeue() {
        return this.elements.shift()?.element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

function heuristic(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function aStarSteps(graph, vertices, start, end) {
    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const visited = new Set();
    const steps = [];

    const startStr = start.toString();
    const endStr = end.toString();

    gScore.set(startStr, 0);
    fScore.set(startStr, heuristic(vertices[start], vertices[end]));
    openSet.enqueue(start, fScore.get(startStr));

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();
        const currentStr = current.toString();

        if (visited.has(currentStr)) continue;
        visited.add(currentStr);

        steps.push({ explored: Array.from(visited), current });

        if (current === end) {
            const path = [];
            let cur = end;
            while (cameFrom.has(cur.toString())) {
                path.unshift(cur);
                cur = cameFrom.get(cur.toString());
            }
            path.unshift(start);

            let distance = 0;
            for (let i = 0; i < path.length - 1; i++) {
                const edge = graph.find(e =>
                    (e[0] === path[i] && e[1] === path[i + 1]) ||
                    (e[1] === path[i] && e[0] === path[i + 1])
                );
                if (edge) distance += edge[2];
            }

            return { path, steps, distance: distance.toFixed(2) };
        }

        const neighbors = graph
            .filter(e => e[0] === current || e[1] === current)
            .map(e => e[0] === current ? [e[1], e[2]] : [e[0], e[2]]);

        for (const [neighbor, weight] of neighbors) {
            if (visited.has(neighbor.toString())) continue;

            const tentativeGScore = gScore.get(currentStr) + weight;
            const neighborStr = neighbor.toString();

            if (!gScore.has(neighborStr) || tentativeGScore < gScore.get(neighborStr)) {
                cameFrom.set(neighborStr, current);
                gScore.set(neighborStr, tentativeGScore);
                const h = heuristic(vertices[neighbor], vertices[end]);
                fScore.set(neighborStr, tentativeGScore + h);
                openSet.enqueue(neighbor, fScore.get(neighborStr));
            }
        }
    }

    return { path: [], steps, distance: 'No path found' };
}

function aStar(graph, vertices, start, end) {
    const result = aStarSteps(graph, vertices, start, end);
    return { path: result.path, explored: result.steps[result.steps.length - 1]?.explored || [], distance: result.distance };
}
