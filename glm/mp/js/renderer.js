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
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1, y1 + (y2 - y1) * 0.4 + cpOffset, x2, y2 - (y2 - y1) * 0.4 - cpOffset, x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
}

function drawNodes(time) {
    const driftAmount = state.isOverview ? CONFIG.alive.overview : CONFIG.alive.focus;
    const seg = 16; const intensity = CONFIG.alive.intensity;
    for (const id in state.animNodes) {
        const a = state.animNodes[id];
        if (a.ta < 0.01) continue;
        const node = findNode(state.tree, id);
        if (!node) continue;
        const ox = Math.sin(time * 0.5 + a.ph) * driftAmount;
        const oy = Math.cos(time * 0.65 + a.ph) * driftAmount * 0.7;
        const x = a.x + ox, y = a.y + oy, r = a.r;
        const isFoc = id === state.focusedId;
        const isHov = id === state.hoveredId && !isFoc;
        ctx.save();
        ctx.globalAlpha = isHov ? Math.min(a.ta + 0.3, 1) : a.ta;
        if (isFoc) { ctx.shadowColor = CONFIG.colors.selectedGlow; ctx.shadowBlur = 30; }
        const points = [];
        for (let i = 0; i < seg; i++) {
            const angle = (i / seg) * Math.PI * 2;
            const w1 = Math.sin(time * 0.6 + a.ph + i * 1.2) * 8 * intensity;
            const w2 = Math.cos(time * 1.1 + a.ph + i * 0.8) * 5 * intensity;
            const w3 = Math.sin(time * 1.8 + a.ph + i * 2.5) * 3 * intensity;
            const totalWobble = w1 + w2 + w3;
            points.push({ px: x + Math.cos(angle) * (r + totalWobble), py: y + Math.sin(angle) * (r + totalWobble) });
        }
        ctx.beginPath();
        let mx = (points[points.length - 1].px + points[0].px) / 2;
        let my = (points[points.length - 1].py + points[0].py) / 2;
        ctx.moveTo(mx, my);
        for (let i = 0; i < points.length; i++) {
            const nextP = points[(i + 1) % points.length];
            mx = (points[i].px + nextP.px) / 2; my = (points[i].py + nextP.py) / 2;
            ctx.quadraticCurveTo(points[i].px, points[i].py, mx, my);
        }
        ctx.closePath();
        ctx.fillStyle = CONFIG.colors.nodeFill; ctx.fill();
        ctx.shadowBlur = 0;
        let borderColor = CONFIG.colors.border;
        if (isFoc) borderColor = CONFIG.colors.selectedBorder;
        else if (isHov) borderColor = CONFIG.colors.selectedBorder;
        else if (a.ta < 0.5) borderColor = CONFIG.colors.siblingBorder;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isFoc ? 2.5 : (isHov ? 2.0 : 1.5);
        ctx.stroke();
        if (node.note) {
            ctx.beginPath(); ctx.arc(x + r * 0.6, y - r * 0.6, 4, 0, Math.PI * 2);
            ctx.fillStyle = CONFIG.colors.noteDot; ctx.fill();
        }
        ctx.font = `500 ${a.fs}px ${CONFIG.font}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let text = node.text || '...';
        const isRTL = /[\u0600-\u06FF]/.test(text);
        if ('direction' in ctx) ctx.direction = isRTL ? 'rtl' : 'ltr';
        ctx.font = `500 ${a.fs}px ${CONFIG.font}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const maxWidth = r * 1.6;
        let displayText = text;
        if (ctx.measureText(displayText).width > maxWidth) {
            while (displayText.length > 1 && ctx.measureText(displayText + '…').width > maxWidth) displayText = displayText.slice(0, -1);
            displayText += '…';
        }
        ctx.fillStyle = a.tc; ctx.fillText(displayText, x, y + 1);
        if ('direction' in ctx) ctx.direction = 'ltr';
        ctx.restore();
    }
}

function drawDeleteConfirmation() {
    if (!state.deletePending || !state.animNodes[state.deletePending]) return;
    const a = state.animNodes[state.deletePending];
    const elapsed = (performance.now() - state.deletePendingTime) / 1000;
    if (elapsed > 3.5) { state.deletePending = null; return; }
    const node = findNode(state.tree, state.deletePending);
    const count = getDescendantCount(node);
    const text = `${count} descendant${count !== 1 ? 's' : ''}. Shift+Del to confirm`;
    ctx.font = `500 12px ${CONFIG.font}`;
    const tw = ctx.measureText(text).width + 24;
    const pw = Math.max(tw, 140), ph = 36;
    const px = a.x - pw / 2, py = a.y + a.r + 14;
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 6);
    ctx.fillStyle = CONFIG.colors.deleteBg; ctx.fill();
    ctx.strokeStyle = CONFIG.colors.deleteBorder; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = CONFIG.colors.deleteText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, a.x, py + ph / 2);
}

function drawHelpOverlay() {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 10, 8, 0.8)'; ctx.fillRect(0, 0, cw, ch);
    const boxW = 660, boxH = 340;
    const px = (cw - boxW) / 2, py = (ch - boxH) / 2;
    ctx.beginPath(); ctx.roundRect(px, py, boxW, boxH, 12);
    ctx.fillStyle = CONFIG.colors.helpBg; ctx.fill();
    ctx.strokeStyle = CONFIG.colors.helpBorder; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = `600 16px ${CONFIG.font}`;
    ctx.fillStyle = CONFIG.colors.text; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Keyboard Shortcuts', cw / 2, py + 18);
    ctx.beginPath(); ctx.moveTo(px + 40, py + 40);
    ctx.lineTo(px + boxW - 40, py + 40);
    ctx.strokeStyle = CONFIG.colors.helpBorder; ctx.lineWidth = 1; ctx.stroke();
    const cols = 2, rowH = 28, startY = py + 52, colW = boxW / cols;
    const shortcuts = [
        ['Tab', 'Add Child Node'],
        ['Shift+Tab', 'Add Sibling Node'],
        ['Enter', 'Edit Node Label'],
        ['↑ / ↓', 'Parent / Child*'],
        ['← / →', 'Prev / Next Sibling'],
        ['N', 'Toggle Note (post-it)'],
        ['Ctrl+M', 'Open / Focus Markup'],
        ['Ctrl+E', 'Export PNG Image'],
        ['Ctrl+C', 'Copy Markup Text'],
        ['V', 'Toggle View / Edit'],
        ['Delete / Shift+Del', 'Delete Node / Confirm'],
        ['Ctrl+Z / Y', 'Undo / Redo'],
        ['Ctrl+Shift+N', 'New Mind Map'],
        ['G / R', 'Flip Direction / Reset'],
        ['? / Esc', 'Toggle Help / Close']
    ];
    ctx.textAlign = 'left';
    shortcuts.forEach((sc, i) => {
        const col = i % cols; const row = Math.floor(i / cols);
        const cx = px + 30 + (col * colW); const cy = startY + (row * rowH);
        ctx.font = `500 13px ${CONFIG.font}`;
        ctx.fillStyle = CONFIG.colors.helpKey; ctx.fillText(sc[0], cx, cy);
        ctx.font = `400 13px ${CONFIG.font}`;
        ctx.fillStyle = CONFIG.colors.helpText; ctx.fillText(sc[1], cx + 155, cy);
    });
    ctx.font = `400 11px ${CONFIG.font}`;
    ctx.fillStyle = CONFIG.colors.textDim; ctx.textAlign = 'center';
    ctx.fillText('* ↑/↓ matches visual layout. Mobile: Tap to select, Swipe to navigate, Pinch to zoom.', cw / 2, py + boxH - 18);
    const closeR = 12, closeX = px + boxW - 24, closeY = py + 20;
    ctx.beginPath(); ctx.arc(closeX, closeY, closeR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80, 120, 100, 0.2)'; ctx.fill();
    ctx.strokeStyle = CONFIG.colors.helpBorder; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = `500 14px ${CONFIG.font}`; ctx.fillStyle = CONFIG.colors.helpText;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✕', closeX, closeY + 1);
    state.helpCloseBtn = { x: closeX, y: closeY, r: closeR };
    ctx.restore();
}