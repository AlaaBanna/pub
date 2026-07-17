function recalculateLayout() {
    state.animNodes = {};
    const focusedNode = findNode(state.tree, state.focusedId);
    if (!focusedNode) return;

    if (state.isOverview) {
        buildOverviewLayout(focusedNode);
    } else {
        buildFocusLayout(focusedNode);
    }
}

function buildFocusLayout(focusedNode) {
    const cx = cw / 2;
    const cy = ch * 0.5; 
    const isBottomUp = state.layoutDir === 'bottom-up';
    
    const parentNode = findParent(state.tree, focusedNode.id, null);
    
    if (parentNode) {
        // Parent Node
        state.animNodes[parentNode.id] = {
            tx: cx, 
            ty: isBottomUp ? cy + CONFIG.layout.focusVGap : cy - CONFIG.layout.focusVGap, 
            r: CONFIG.nodeRadius.parent,
            ta: 0.55, fs: CONFIG.fontSize.parent, tc: CONFIG.colors.textDim, ph: Math.random() * Math.PI * 2
        };

        // Siblings (including focused)
        const siblings = getSortedChildren(parentNode);
        const focIdx = siblings.findIndex(c => c.id === focusedNode.id);
        
        for (let i = 0; i < siblings.length; i++) {
            const sib = siblings[i];
            const isFoc = sib.id === focusedNode.id;
            state.animNodes[sib.id] = {
                tx: cx + (i - focIdx) * CONFIG.layout.focusHGap,
                ty: cy,
                r: isFoc ? CONFIG.nodeRadius.focused : CONFIG.nodeRadius.child * 0.85,
                ta: isFoc ? 1 : 0.35,
                fs: isFoc ? CONFIG.fontSize.focused : CONFIG.fontSize.child,
                tc: isFoc ? CONFIG.colors.text : CONFIG.colors.textDim,
                ph: Math.random() * Math.PI * 2
            };
        }
    } else {
        // Root node (no parent/siblings)
        state.animNodes[focusedNode.id] = {
            tx: cx, ty: cy, r: CONFIG.nodeRadius.focused,
            ta: 1, fs: CONFIG.fontSize.focused, tc: CONFIG.colors.text, ph: Math.random() * Math.PI * 2
        };
    }

    // Children Nodes
    const sortedChildren = getSortedChildren(focusedNode);
    const visibleCount = Math.min(sortedChildren.length, CONFIG.maxVisibleChildren);
    
    if (visibleCount > 0) {
        const actualHGap = visibleCount > 1 ? Math.min(CONFIG.layout.focusHGap, (cw - 200) / (visibleCount - 1)) : 0;
        const startX = cx - (actualHGap * (visibleCount - 1)) / 2;

        for (let i = 0; i < visibleCount; i++) {
            const child = sortedChildren[i];
            if (!child) break;
            state.animNodes[child.id] = {
                tx: startX + i * actualHGap, 
                ty: isBottomUp ? cy - CONFIG.layout.focusVGap : cy + CONFIG.layout.focusVGap, 
                r: CONFIG.nodeRadius.child,
                ta: 0.85, fs: CONFIG.fontSize.child, tc: CONFIG.colors.text, ph: Math.random() * Math.PI * 2
            };
        }
    }
}

function buildOverviewLayout(focusedNode) {
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
        const hGap = count > 1 ? Math.min(CONFIG.layout.ovHGap, (cw - 100) / (count - 1)) : 0;
        const startX = cw / 2 - (hGap * (count - 1)) / 2;

        for (let i = 0; i < count; i++) {
            const node = ids[i];
            const isRoot = l === 0;
            const isLayer1 = l === 1;
            const ty = isBottomUp ? (ch - topOffset) - l * CONFIG.layout.ovVGap : topOffset + l * CONFIG.layout.ovVGap;

            state.animNodes[node.id] = {
                tx: startX + i * hGap, ty: ty,
                r: isRoot ? CONFIG.nodeRadius.focused * 0.9 : isLayer1 ? CONFIG.nodeRadius.child * 0.8 : CONFIG.nodeRadius.child * 0.65,
                ta: isRoot ? 1 : isLayer1 ? 0.7 : l === 2 ? 0.45 : 0.25,
                fs: isRoot ? CONFIG.fontSize.ovFocused : isLayer1 ? CONFIG.fontSize.ovChild : CONFIG.fontSize.ovGrandchild,
                tc: l < 2 ? CONFIG.colors.text : CONFIG.colors.textDim,
                ph: Math.random() * Math.PI * 2
            };
        }
    }
}