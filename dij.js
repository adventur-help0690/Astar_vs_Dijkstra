function dijkstraSteps(graph, vertices, start, end) {
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();
    const steps = [];
    const explored = [];

    for (let i = 0; i < vertices.length; i++) {
        distances.set(i, Infinity);
        unvisited.add(i);
    }
    distances.set(start, 0);

    while (unvisited.size > 0) {
        let minDistance = Infinity;
        let current = null;

        for (const node of unvisited) {
            if (distances.get(node) < minDistance) {
                minDistance = distances.get(node);
                current = node;
            }
        }

        if (current === null || minDistance === Infinity) {
            break;
        }

        unvisited.delete(current);
        explored.push(current);
        steps.push({ explored: [...explored], current });

        if (current === end) {
            const path = [];
            let cur = end;
            while (previous.has(cur)) {
                path.unshift(cur);
                cur = previous.get(cur);
            }
            path.unshift(start);

            return { path, steps, distance: distances.get(end).toFixed(2) };
        }

        const neighbors = graph
            .filter(e => e[0] === current || e[1] === current)
            .map(e => e[0] === current ? [e[1], e[2]] : [e[0], e[2]]);

        for (const [neighbor, weight] of neighbors) {
            if (!unvisited.has(neighbor)) continue;

            const alt = distances.get(current) + weight;
            if (alt < distances.get(neighbor)) {
                distances.set(neighbor, alt);
                previous.set(neighbor, current);
            }
        }
    }

    return { path: [], steps, distance: 'No path found' };
}

function dijkstra(graph, vertices, start, end) {
    const result = dijkstraSteps(graph, vertices, start, end);
    return { path: result.path, explored: result.steps[result.steps.length - 1]?.explored || [], distance: result.distance };
}
