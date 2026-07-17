function drawBezier(id1, id2, color, alpha = 1.0) {
    const a1 = state.animNodes[id1];
    const a2 = state.animNodes[id2];
    if (!a1 || !a2) return;

    const driftAmount = state.isOverview ? CONFIG.alive.overview : CONFIG.alive.focus;
    const ox1 = Math.sin(lastTime * 0.5 + a1.ph) * driftAmount;
    const oy1 = Math.cos(lastTime * 0.65 + a1.ph) * driftAmount * 0.7;
    const ox2 = Math.sin(lastTime * 0.5 + a2.ph) * driftAmount;
    const oy2 = Math.cos(lastTime * 0.65 + a2.ph) * driftAmount * 0.7;

    const x1 = a1.x + ox1, y1 = a1.y + oy1;
    const x2 = a2.x + ox2, y2 = a2.y + oy2;
    const cpOffset = Math.sin(lastTime * 0.8 + id1.charCodeAt(0)) * 0.8;
    
    ctx.save();
    ctx.globalAlpha = a1.ta * alpha; 
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1, y1 + (y2 - y1) * 0.4 + cpOffset, x2, y2 - (y2 - y1) * 0.4 - cpOffset, x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
}

function drawNodes(time) {
    const driftAmount = state.isOverview ? CONFIG.alive.overview : CONFIG.alive.focus;
    const seg = 16; 
    const intensity = CONFIG.alive.intensity;

    for (const id in state.animNodes) {
        const a = state.animNodes[id];
        if (a.ta < 0.01) continue;
        const node = findNode(state.tree, id);
        if (!node) continue;

        const ox = Math.sin(time * 0.5 + a.ph) * driftAmount;
        const oy = Math.cos(time * 0.65 + a.ph) * driftAmount * 0.7;
        const x = a.x + ox;
        const y = a.y + oy;
        const r = a.r;
        const isFoc = id === state.focusedId;
        const isHov = id === state.hoveredId && !isFoc; // Hover state

        ctx.save();
        
        // Boost alpha slightly if hovered (unless it's already focused)
        ctx.globalAlpha = isHov ? Math.min(a.ta + 0.3, 1) : a.ta;

        if (isFoc) {
            ctx.shadowColor = CONFIG.colors.selectedGlow;
            ctx.shadowBlur = 30;
        }

        // Bubbly Shape: Harmonics
        const points = [];
        for (let i = 0; i < seg; i++) {
            const angle = (i / seg) * Math.PI * 2;
            const w1 = Math.sin(time * 0.6 + a.ph + i * 1.2) * 8 * intensity;
            const w2 = Math.cos(time * 1.1 + a.ph + i * 0.8) * 5 * intensity;
            const w3 = Math.sin(time * 1.8 + a.ph + i * 2.5) * 3 * intensity;
            const totalWobble = w1 + w2 + w3;
            
            points.push({
                px: x + Math.cos(angle) * (r + totalWobble),
                py: y + Math.sin(angle) * (r + totalWobble)
            });
        }

        ctx.beginPath();
        let mx = (points[points.length - 1].px + points[0].px) / 2;
        let my = (points[points.length - 1].py + points[0].py) / 2;
        ctx.moveTo(mx, my);

        for (let i = 0; i < points.length; i++) {
            const nextP = points[(i + 1) % points.length];
            mx = (points[i].px + nextP.px) / 2;
            my = (points[i].py + nextP.py) / 2;
            ctx.quadraticCurveTo(points[i].px, points[i].py, mx, my);
        }
        ctx.closePath();

        ctx.fillStyle = CONFIG.colors.nodeFill;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Dynamic border based on state
        let borderColor = CONFIG.colors.border;
        if (isFoc) borderColor = CONFIG.colors.selectedBorder;
        else if (isHov) borderColor = CONFIG.colors.selectedBorder; // Brighten on hover
        else if (a.ta < 0.5) borderColor = CONFIG.colors.siblingBorder;
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isFoc ? 2.5 : (isHov ? 2.0 : 1.5);
        ctx.stroke();

        if (node.note) {
            ctx.beginPath();
            ctx.arc(x + r * 0.6, y - r * 0.6, 4, 0, Math.PI * 2);
            ctx.fillStyle = CONFIG.colors.noteDot;
            ctx.fill();
        }

        ctx.font = `500 ${a.fs}px ${CONFIG.font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.direction = 'auto';
        
        let text = node.text || '...';
        const maxWidth = r * 1.6; 
        let displayText = text;
        
        if (ctx.measureText(displayText).width > maxWidth) {
            while (displayText.length > 1 && ctx.measureText(displayText + '…').width > maxWidth) {
                displayText = displayText.slice(0, -1);
            }
            displayText += '…';
        }
        
        ctx.fillStyle = a.tc;
        ctx.fillText(displayText, x, y + 1);
        ctx.restore();
    }
}

function drawDeleteConfirmation() {
    if (!state.deletePending || !state.animNodes[state.deletePending]) return;
    const a = state.animNodes[state.deletePending];
    const elapsed = (performance.now() - state.deletePendingTime) / 1000;
    
    if (elapsed > 3.5) {
        state.deletePending = null;
        return;
    }
    
    const node = findNode(state.tree, state.deletePending);
    const count = getDescendantCount(node);
    const text = `${count} descendant${count !== 1 ? 's' : ''}. Shift+Del to confirm`;
    
    ctx.font = `500 12px ${CONFIG.font}`;
    const tw = ctx.measureText(text).width + 24;
    const pw = Math.max(tw, 140);
    const ph = 36;
    const px = a.x - pw / 2;
    const py = a.y + a.r + 14;

    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 6);
    ctx.fillStyle = CONFIG.colors.deleteBg;
    ctx.fill();
    ctx.strokeStyle = CONFIG.colors.deleteBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = CONFIG.colors.deleteText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'ltr';
    ctx.fillText(text, a.x, py + ph / 2);
}

function drawHelpOverlay() {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 10, 8, 0.8)';
    ctx.fillRect(0, 0, cw, ch);

    const boxW = 640, boxH = 420;
    const px = (cw - boxW) / 2, py = (ch - boxH) / 2;

    ctx.beginPath();
    ctx.roundRect(px, py, boxW, boxH, 12);
    ctx.fillStyle = CONFIG.colors.helpBg;
    ctx.fill();
    ctx.strokeStyle = CONFIG.colors.helpBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `600 16px ${CONFIG.font}`;
    ctx.fillStyle = CONFIG.colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Keyboard Shortcuts', cw / 2, py + 24);

    const cols = 2, rowH = 32, startY = py + 60, colW = boxW / cols;
    const shortcuts = [
        ['Enter', 'Edit label'], ['Tab', 'Create child'],
        ['↑ / ↓', 'Parent / Child*'], ['← / →', 'Prev / Next Sibling'],
        ['N', 'Open note'], ['V', 'Toggle View/Edit'],
        ['G', 'Flip layout dir.' ], ['D', 'Reset view (zoom)'],
        ['Ctrl+Z / Y', 'Undo / Redo'], ['Ctrl+← / →', 'Reorder sibling'],
        ['Delete', 'Delete leaf node'], ['Shift+Del', 'Delete tree confirm'],
        ['Ctrl+Shift+M', 'Toggle panel'], ['? / Header Btn', 'Toggle this help']
    ];

    ctx.textAlign = 'left';
    shortcuts.forEach((sc, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = px + 30 + (col * colW);
        const cy = startY + (row * rowH);

        ctx.font = `500 13px ${CONFIG.font}`;
        ctx.fillStyle = CONFIG.colors.helpKey;
        ctx.fillText(sc[0], cx, cy);
        
        ctx.font = `400 13px ${CONFIG.font}`;
        ctx.fillStyle = CONFIG.colors.helpText;
        ctx.fillText(sc[1], cx + 160, cy);
    });

    ctx.font = `400 11px ${CONFIG.font}`;
    ctx.fillStyle = CONFIG.colors.textDim;
    ctx.textAlign = 'center';
    ctx.fillText('* ↑/↓ matches visual layout. Mobile: Tap to select, Swipe to navigate, Pinch to zoom.', cw / 2, py + boxH - 25);
    ctx.restore();
}

// ── Fixed Bottom Bar ──
function drawBottomBar() {
    if (state.isHelpOpen || state.isMobile) return; // HIDE ON MOBILE
    
    const barH = 32;
    const y = ch - barH;
    
    ctx.fillStyle = CONFIG.colors.barBg;
    ctx.fillRect(0, y, cw, barH);
    
    ctx.strokeStyle = CONFIG.colors.barBorder;
    ctx.lineWidth = 1;
    ctx.beginPath(); 
    ctx.moveTo(0, y); 
    ctx.lineTo(cw, y); 
    ctx.stroke();
    
    ctx.font = `400 11px ${CONFIG.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = CONFIG.colors.barText;
    
    const text = "↑↓ Navigate  |  ←→ Siblings  |  Enter Edit  |  Tab Add Child  |  N Note  |  V Mode  |  G Flip  |  ? Help  |  Esc Close";
    ctx.fillText(text, cw / 2, y + barH / 2);
}