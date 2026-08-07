// Version: v1.0.0 | Updated: 2026-08-07 | Features: Radial Tree Layout Calculation Engine
function recalculateLayout() {
    const oldAnimNodes = state.animNodes || {};
    state.animNodes = {};
    const focusedNode = findNode(state.tree, state.focusedId);
    if (!focusedNode) return;

    if (state.isOverview) {
        buildOverviewLayout(focusedNode, oldAnimNodes);
    } else {
        buildFocusLayout(focusedNode, oldAnimNodes);
    }
}

function getNodeTarget(id, props, oldAnimNodes) {
    const old = oldAnimNodes[id];
    return {
        ...props,
        x: old && old.x !== undefined ? old.x : props.tx,
        y: old && old.y !== undefined ? old.y : props.ty,
        ph: old && old.ph !== undefined ? old.ph : Math.random() * Math.PI * 2
    };
}

function buildFocusLayout(focusedNode, oldAnimNodes) {
    const cx = cw / 2;
    const topInset = 56;
    const cy = topInset + (ch - topInset) * 0.52;
    const isBottomUp = state.layoutDir === 'bottom-up';
    const vGap = Math.max(CONFIG.layout.focusVGap + 20, (ch - topInset) * 0.38);
    const maxSpreadWidth = Math.min(cw * 0.78, cw - 260);
    
    const parentNode = findParent(state.tree, focusedNode.id, null);
    
    if (parentNode) {
        // Parent Node
        state.animNodes[parentNode.id] = getNodeTarget(parentNode.id, {
            tx: cx, 
            ty: isBottomUp ? cy - vGap : cy + vGap, 
            r: CONFIG.nodeRadius.parent,
            ta: 0.7, fs: CONFIG.fontSize.parent, tc: CONFIG.colors.textDim
        }, oldAnimNodes);

        // Siblings (including focused)
        const siblings = getSortedChildren(parentNode);
        const focIdx = siblings.findIndex(c => c.id === focusedNode.id);
        const sibCount = siblings.length;
        const sibHGap = sibCount > 1 ? Math.max(160, Math.min(240, maxSpreadWidth / Math.max(1, sibCount - 1))) : 0;
        
        for (let i = 0; i < siblings.length; i++) {
            const sib = siblings[i];
            const isFoc = sib.id === focusedNode.id;
            state.animNodes[sib.id] = getNodeTarget(sib.id, {
                tx: cx + (i - focIdx) * sibHGap,
                ty: cy,
                r: isFoc ? CONFIG.nodeRadius.focused : CONFIG.nodeRadius.child * 0.85,
                ta: isFoc ? 1 : 0.5,
                fs: isFoc ? CONFIG.fontSize.focused : CONFIG.fontSize.child,
                tc: isFoc ? CONFIG.colors.text : CONFIG.colors.textDim
            }, oldAnimNodes);
        }
    } else {
        // Root node
        state.animNodes[focusedNode.id] = getNodeTarget(focusedNode.id, {
            tx: cx, ty: cy, r: CONFIG.nodeRadius.focused,
            ta: 1, fs: CONFIG.fontSize.focused, tc: CONFIG.colors.text
        }, oldAnimNodes);
    }

    // Children Nodes
    const sortedChildren = getSortedChildren(focusedNode);
    const visibleCount = Math.min(sortedChildren.length, CONFIG.maxVisibleChildren);
    
    if (visibleCount > 0) {
        const actualHGap = visibleCount > 1 ? Math.max(170, Math.min(240, maxSpreadWidth / Math.max(1, visibleCount - 1))) : 0;
        const startX = cx - (actualHGap * (visibleCount - 1)) / 2;

        for (let i = 0; i < visibleCount; i++) {
            const child = sortedChildren[i];
            if (!child) break;
            const arcY = Math.sin((i / (visibleCount - 1 || 1)) * Math.PI) * (isBottomUp ? -20 : 20);
            state.animNodes[child.id] = getNodeTarget(child.id, {
                tx: startX + i * actualHGap, 
                ty: (isBottomUp ? cy + vGap : cy - vGap) + arcY, 
                r: CONFIG.nodeRadius.child,
                ta: 0.95, fs: CONFIG.fontSize.child, tc: CONFIG.colors.text
            }, oldAnimNodes);
        }
    }
}

function buildOverviewLayout(focusedNode, oldAnimNodes) {
    const isBottomUp = state.layoutDir === 'bottom-up';
    const layers = [];
    let currentLayer = [focusedNode];
    const visited = new Set([focusedNode.id]);

    for (let d = 0; d < 5 && currentLayer.length > 0; d++) {
        layers.push(currentLayer);
        const nextLayer = [];
        for (const node of currentLayer) {
            for (const child of getSortedChildren(node)) {
                if (!visited.has(child.id)) {
                    visited.add(child.id);
                    nextLayer.push(child);
                }
            }
        }
        currentLayer = nextLayer;
    }

    const topOffset = 80;
    for (let l = 0; l < layers.length; l++) {
        const ids = layers[l];
        const count = ids.length;
        const isRoot = l === 0;
        const isLayer1 = l === 1;

        const baseR = isRoot ? CONFIG.nodeRadius.focused * 0.75 : isLayer1 ? CONFIG.nodeRadius.child * 0.65 : CONFIG.nodeRadius.child * 0.5;
        const rScale = count > 5 ? Math.max(0.6, 5 / count) : 1.0;
        const nodeR = Math.max(18, baseR * rScale);
        const minSpacing = nodeR * 2.3;

        const hGap = count > 1 ? Math.max(minSpacing, Math.min(CONFIG.layout.ovHGap, (cw - 120) / (count - 1))) : 0;
        const startX = cw / 2 - (hGap * (count - 1)) / 2;

        for (let i = 0; i < count; i++) {
            const node = ids[i];
            const ty = isBottomUp ? (ch - topOffset) - l * CONFIG.layout.ovVGap : topOffset + l * CONFIG.layout.ovVGap;

            state.animNodes[node.id] = getNodeTarget(node.id, {
                tx: startX + i * hGap, ty: ty,
                r: nodeR,
                ta: isRoot ? 1 : isLayer1 ? 0.75 : l === 2 ? 0.5 : 0.3,
                fs: isRoot ? CONFIG.fontSize.ovFocused : isLayer1 ? CONFIG.fontSize.ovChild : CONFIG.fontSize.ovGrandchild,
                tc: l < 2 ? CONFIG.colors.text : CONFIG.colors.textDim
            }, oldAnimNodes);
        }
    }
}