// Version: v3.1.0 | Updated: 2026-07-31 13:34 | Features: Increased organic bacterial morphing wave distortion multipliers (w1: 0.070, w2: 0.042, w3: 0.025)
function drawOrbits() {
    const focusedAnim = state.animNodes[state.focusedId];
    if (!focusedAnim) return;

    const focusedNode = findNode(state.tree, state.focusedId);
    const depth = focusedNode ? (focusedNode.depth || 0) : 0;

    // Depth Focus Rule: Root (depth 0) is sharpest, deeper levels fade softly
    const alphaFactor = Math.pow(0.55, depth);
    const isLight = document.body.classList.contains('light-mode');

    // Light Mode: Warm Ochre Bronze (194, 141, 0), Dark Mode: Gold (226, 183, 20)
    const baseRgb = isLight ? '194, 141, 0' : '226, 183, 20';

    ctx.save();
    ctx.setLineDash([6, 4]);
    const orbits = [
        { r: 160, bgAlpha: 0.045 * alphaFactor, borderAlpha: 0.22 * alphaFactor },
        { r: 320, bgAlpha: 0.030 * alphaFactor, borderAlpha: 0.15 * alphaFactor },
        { r: 490, bgAlpha: 0.018 * alphaFactor, borderAlpha: 0.09 * alphaFactor }
    ];
    orbits.forEach(o => {
        ctx.beginPath();
        ctx.arc(focusedAnim.x, focusedAnim.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseRgb}, ${o.bgAlpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${baseRgb}, ${o.borderAlpha})`;
        ctx.lineWidth = depth === 0 ? 1.5 : 1.0;
        ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();
}

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

    const isSearchEdge = state.searchPathEdges && (state.searchPathEdges.has(`${id1}-${id2}`) || state.searchPathEdges.has(`${id2}-${id1}`));

    ctx.save();
    ctx.globalAlpha = isSearchEdge ? 1.0 : (a1.ta * alpha);
    ctx.setLineDash(isSearchEdge ? [8, 3] : [6, 3]);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1, y1 + (y2 - y1) * 0.4 + cpOffset, x2, y2 - (y2 - y1) * 0.4 - cpOffset, x2, y2);
    ctx.strokeStyle = isSearchEdge ? '#e2b714' : color;
    ctx.lineWidth = isSearchEdge ? 4.5 : 2.0;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

function wrapNodeText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    if (words.length <= 1) return [text];
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
        if (ctx.measureText(testLine).width <= maxWidth || !currentLine) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 3);
}

function getCachedNodeTextLines(ctx, node, a, maxWidth) {
    if (a._cachedText === node.text && a._cachedMaxWidth === maxWidth && a._cachedLines) {
        return a._cachedLines;
    }
    a._cachedText = node.text;
    a._cachedMaxWidth = maxWidth;
    a._cachedLines = wrapNodeText(ctx, node.text || '...', maxWidth);
    return a._cachedLines;
}

function drawNodes(time) {
    const driftAmount = state.isOverview ? CONFIG.alive.overview : CONFIG.alive.focus;
    const seg = 16; const intensity = CONFIG.alive.intensity;
    for (const id in state.animNodes) {
        const a = state.animNodes[id];
        if (a.ta < 0.01) continue;
        const node = findNode(state.tree, id);
        if (!node) continue;
        const ox = Math.sin(time * 0.35 + a.ph) * driftAmount;
        const oy = Math.cos(time * 0.45 + a.ph) * driftAmount * 0.7;
        const breathScale = 1.0 + Math.sin(time * 0.0012 + a.ph * 2) * 0.02;
        const x = a.x + ox, y = a.y + oy, r = a.r * breathScale;
        const isFoc = id === state.focusedId;
        const isHov = id === state.hoveredId && !isFoc;
        const isTitleMatch = state.searchTitleMatchIds && state.searchTitleMatchIds.has(id);
        const isNoteMatch = state.searchNoteMatchIds && state.searchNoteMatchIds.has(id);
        const isSearchMatch = isTitleMatch || isNoteMatch;

        ctx.save();
        ctx.globalAlpha = isHov ? Math.min(a.ta + 0.3, 1) : a.ta;
        if (isFoc || isTitleMatch) {
            ctx.shadowColor = CONFIG.colors.selectedGlow;
            ctx.shadowBlur = isTitleMatch ? 40 : 30;
        } else if (isNoteMatch) {
            ctx.shadowColor = 'rgba(226, 183, 20, 0.4)';
            ctx.shadowBlur = 18;
        }
        const points = [];
        const tMorph = (time * 0.40 + a.ph);
        for (let i = 0; i < seg; i++) {
            const angle = (i / seg) * Math.PI * 2;
            const w1 = Math.sin(angle * 2 + tMorph) * 0.070;
            const w2 = Math.cos(angle * 3 - tMorph * 0.7) * 0.042;
            const w3 = Math.sin(angle * 4 + tMorph * 1.2) * 0.025;
            const radiusMod = r * (1.0 + (w1 + w2 + w3) * intensity);
            points.push({ px: x + Math.cos(angle) * radiusMod, py: y + Math.sin(angle) * radiusMod });
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
        const readStatus = (node.article && node.article.content && node.article.content.trim()) ? isArticleRead(node.id) : false;
        ctx.fillStyle = readStatus ? 'rgba(64, 68, 86, 0.94)' : CONFIG.colors.nodeFill;
        ctx.fill();
        ctx.shadowBlur = 0;
        const directChildCount = node.children ? node.children.length : 0;
        const totalSubtreeCount = getDescendantCount(node);

        ctx.strokeStyle = isTitleMatch ? '#e2b714' : (isNoteMatch ? '#e2b714' : (isFoc ? CONFIG.colors.selectedBorder : (isHov ? CONFIG.colors.hoverBorder : 'rgba(226, 183, 20, 0.45)')));
        ctx.lineWidth = isTitleMatch ? 3.5 : (isNoteMatch ? 2.2 : (isFoc ? 2.5 : (isHov ? 2.0 : 1.8)));
        ctx.stroke();

        if (node.completed) {
            ctx.beginPath(); ctx.arc(x - r * 0.6, y - r * 0.6, 7.5, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = `700 9px ${CONFIG.font}`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('✓', x - r * 0.6, y - r * 0.6);
        }

        // Subtree Children Count Badge (Top-Center of node)
        if (totalSubtreeCount > 0 && !isFoc) {
            const countText = `+${totalSubtreeCount}`;
            ctx.font = `600 ${Math.max(10, Math.floor(a.fs - 3))}px ${CONFIG.font}`;
            const countW = ctx.measureText(countText).width + 10;
            const countH = 16;
            const countX = x - countW / 2;
            const countY = y - r * 0.72 - countH / 2;

            ctx.beginPath();
            ctx.roundRect(countX, countY, countW, countH, 8);
            ctx.fillStyle = 'rgba(38, 42, 56, 0.94)';
            ctx.fill();
            ctx.strokeStyle = CONFIG.colors.selectedBorder;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = CONFIG.colors.selectedBorder;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(countText, x, countY + countH / 2);
        }

        if (node.article && node.article.content && node.article.content.trim()) {
            const bx = x, by = y + r * 0.72;
            const br = 14;

            // Outer Circle Badge (Clean Silver Outline)
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(26, 28, 38, 0.95)';
            ctx.fill();
            ctx.lineWidth = 1.3;
            ctx.strokeStyle = readStatus ? '#e2b714' : 'rgba(220, 225, 235, 0.75)';
            ctx.stroke();

            // Wide Open Vector Eye Shape (Almond outline + Inner Iris Ring + Pupil)
            const eyeColor = '#e2b714';
            ctx.beginPath();
            ctx.moveTo(bx - 8.0, by);
            ctx.quadraticCurveTo(bx, by - 6.2, bx + 8.0, by);
            ctx.quadraticCurveTo(bx, by + 6.2, bx - 8.0, by);
            ctx.strokeStyle = eyeColor;
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Inner Iris Ring & Pupil
            ctx.beginPath();
            ctx.arc(bx, by, 3.8, 0, Math.PI * 2);
            ctx.strokeStyle = eyeColor;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = eyeColor;
            ctx.fill();
        }

        ctx.font = `500 ${a.fs}px ${CONFIG.font}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let text = node.text || '...';
        const isRTL = /[\u0600-\u06FF]/.test(text);
        try { if ('direction' in ctx) ctx.direction = isRTL ? 'rtl' : 'ltr'; } catch (e) { }

        const maxWidth = r * 1.65;
        const lines = getCachedNodeTextLines(ctx, node, a, maxWidth);
        const lineHeight = a.fs * 1.25;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;
        ctx.fillStyle = isTitleMatch ? '#e2b714' : a.tc;

        lines.forEach((lineText, idx) => {
            let line = lineText;
            if (ctx.measureText(line).width > maxWidth) {
                while (line.length > 0 && ctx.measureText(line + '…').width > maxWidth) {
                    line = line.slice(0, -1);
                }
                line = line ? line + '…' : '…';
            }
            ctx.fillText(line, x, startY + idx * lineHeight);
        });

        try { if ('direction' in ctx) ctx.direction = 'ltr'; } catch (e) { }
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
    const boxW = Math.min(cw - 24, 660), boxH = Math.min(ch - 24, 315);
    const px = (cw - boxW) / 2, py = (ch - boxH) / 2;
    ctx.beginPath(); ctx.roundRect(px, py, boxW, boxH, 12);
    ctx.fillStyle = CONFIG.colors.helpBg; ctx.fill();
    ctx.strokeStyle = CONFIG.colors.helpBorder; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = `600 16px ${CONFIG.font}`;
    ctx.fillStyle = CONFIG.colors.text; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const isEn = window.currentLang === 'en';
    ctx.fillText(isEn ? 'Keyboard Shortcuts' : 'اختصارات لوحة المفاتيح', cw / 2, py + 16);
    ctx.beginPath(); ctx.moveTo(px + 30, py + 38);
    ctx.lineTo(px + boxW - 30, py + 38);
    ctx.strokeStyle = CONFIG.colors.helpBorder; ctx.lineWidth = 1; ctx.stroke();
    const cols = 2, rowH = 26, startY = py + 48, colW = boxW / cols;
    const shortcutsAr = [
        ['Tab', 'إضافة عقدة فرعية'],
        ['Shift+Tab', 'إضافة عقدة شقيقة'],
        ['Enter / F2', 'تعديل نص العقدة'],
        ['Esc', 'إلغاء التعديل / إغلاق'],
        ['↑ / ↓', 'الأب / الابن*'],
        ['← / →', 'الشقيق السابق / التالي'],
        ['N', 'تبديل الملاحظة (post-it)'],
        ['Ctrl+E', 'تصدير صورة PNG'],
        ['Ctrl+S', 'حفظ ملف .mt'],
        ['Ctrl+O', 'فتح ملف .mt'],
        ['Ctrl+F / /', 'بحث في الخريطة'],
        ['Del / Shift+Del', 'حذف العقدة / تأكيد'],
        ['Ctrl+Z / Y', 'تراجع / إعادة'],
        ['Alt+N', 'خريطة جديدة'],
        ['G / R', 'قلب الاتجاه / إعادة ضبط']
    ];
    const shortcutsEn = [
        ['Tab', 'Add Child Node'],
        ['Shift+Tab', 'Add Sibling Node'],
        ['Enter / F2', 'Edit Node Label'],
        ['Esc', 'Cancel Edit / Close'],
        ['↑ / ↓', 'Parent / Child*'],
        ['← / →', 'Prev / Next Sibling'],
        ['N', 'Toggle Note (post-it)'],
        ['Ctrl+E', 'Export PNG Image'],
        ['Ctrl+S', 'Save .mt File'],
        ['Ctrl+O', 'Open .mt File'],
        ['Ctrl+F / /', 'Search Map'],
        ['Del / Shift+Del', 'Delete Node / Confirm'],
        ['Ctrl+Z / Y', 'Undo / Redo'],
        ['Alt+N', 'New Mind Map'],
        ['G / R', 'Flip Direction / Reset']
    ];
    const shortcuts = isEn ? shortcutsEn : shortcutsAr;
    if (isEn) {
        ctx.textAlign = 'left';
        shortcuts.forEach((sc, i) => {
            const col = i % cols; const row = Math.floor(i / cols);
            const cx = px + 30 + (col * colW); const cy = startY + (row * rowH);
            ctx.font = `500 13px ${CONFIG.font}`;
            ctx.fillStyle = CONFIG.colors.helpKey; ctx.fillText(sc[0], cx, cy);
            ctx.font = `400 13px ${CONFIG.font}`;
            ctx.fillStyle = CONFIG.colors.helpText; ctx.fillText(sc[1], cx + 150, cy);
        });
    } else {
        ctx.textAlign = 'right';
        shortcuts.forEach((sc, i) => {
            const col = i % cols; const row = Math.floor(i / cols);
            const cx = px + boxW - 30 - (col * colW); const cy = startY + (row * rowH);
            ctx.font = `400 13px ${CONFIG.font}`;
            ctx.fillStyle = CONFIG.colors.helpText; ctx.fillText(sc[1], cx, cy);
            ctx.font = `500 13px ${CONFIG.font}`;
            ctx.fillStyle = CONFIG.colors.helpKey; ctx.fillText(sc[0], cx - 180, cy);
        });
    }
    ctx.font = `400 11px ${CONFIG.font}`;
    ctx.fillStyle = CONFIG.colors.textDim; ctx.textAlign = 'center';
    ctx.fillText(isEn ? '* ↑/↓ matches visual layout. Mobile: Tap to select, Swipe to navigate, Pinch to zoom.' : '* ↑/↓ يطابق التنسيق البصري. الجوال: انقر للتحديد، اسحب للتنقل، قرص للتقريب.', cw / 2, py + boxH - 14);
    const closeR = 12, closeX = isEn ? (px + boxW - 24) : (px + 24), closeY = py + 20;
    ctx.beginPath(); ctx.arc(closeX, closeY, closeR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80, 120, 100, 0.2)'; ctx.fill();
    ctx.strokeStyle = CONFIG.colors.helpBorder; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = `500 14px ${CONFIG.font}`; ctx.fillStyle = CONFIG.colors.helpText;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✕', closeX, closeY + 1);
    state.helpCloseBtn = { x: closeX, y: closeY, r: closeR };
    ctx.restore();
}