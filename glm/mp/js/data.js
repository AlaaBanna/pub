// ── UTILITIES ──
const uid = () => Math.random().toString(36).slice(2, 11);
const clone = o => JSON.parse(JSON.stringify(o));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ── DATA LAYER ──
function createNode(text = '', order = 0) {
    return { id: uid(), text, note: '', order, children: [] };
}

function findNode(tree, id) {
    if (!tree) return null;
    if (tree.id === id) return tree;
    for (const child of tree.children) {
        const found = findNode(child, id);
        if (found) return found;
    }
    return null;
}

function findParent(tree, id, parent = null) {
    if (!tree) return null;
    if (tree.id === id) return parent;
    for (const child of tree.children) {
        const found = findParent(child, id, tree);
        if (found) return found;
    }
    return null;
}

function getSortedChildren(node) {
    if (!node) return [];
    return [...node.children].sort((a, b) => a.order - b.order);
}

function getDescendantCount(node) {
    if (!node) return 0;
    let count = 0;
    for (const child of node.children) count += 1 + getDescendantCount(child);
    return count;
}

// ── SERIALIZATION ──
function serializeNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    let lines = [`${indent}${node.order ? node.order + '. ' : ''}${node.text}`];
    if (node.note) {
        for (const line of node.note.split('\n')) lines.push(`${indent}: ${line}`);
    }
    for (const child of getSortedChildren(node)) lines.push(...serializeNode(child, depth + 1));
    return lines;
}

function serialize(tree) {
    return serializeNode(tree, 0).join('\n');
}

function parseMarkup(str) {
    const lines = str.split('\n');
    const dummyRoot = createNode('');
    let currentNoteNode = null;
    const stack = [{ node: dummyRoot, indent: -1 }];

    for (const line of lines) {
        if (!line.trim()) continue;
        const indent = line.search(/\S/);
        if (indent < 0) continue;
        
        let text = line.trim();
        if (text.startsWith(': ')) {
            if (currentNoteNode) currentNoteNode.note += (currentNoteNode.note ? '\n' : '') + text.slice(2);
            continue;
        }

        let order = 0;
        const orderMatch = text.match(/^(\d+)\.\s*/);
        if (orderMatch) {
            order = parseInt(orderMatch[1], 10);
            text = text.slice(orderMatch[0].length);
        }

        const newNode = createNode(text, order);
        currentNoteNode = newNode;

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
        stack[stack.length - 1].node.children.push(newNode);
        stack.push({ node: newNode, indent });
    }

    if (dummyRoot.children.length === 1) return dummyRoot.children[0];
    if (dummyRoot.children.length > 0) {
        const wrapper = createNode('Root');
        wrapper.children = dummyRoot.children;
        return wrapper;
    }
    return createNode('New Map');
}

// ── LOCAL STORAGE ──
function saveToStorage() {
    try { localStorage.setItem('metafikra_tree', serialize(state.tree)); } catch(e) {}
}

function loadFromStorage() {
    try {
        const data = localStorage.getItem('metafikra_tree');
        if (data) return parseMarkup(data);
    } catch(e) {}
    return null;
}