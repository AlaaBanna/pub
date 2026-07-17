const CONFIG = {
    maxVisibleChildren: 8,
    zoomThreshold: 0.8,
    
    // Focused node is large, others are scaled down
    nodeRadius: { focused: 150, parent: 75, child: 95 },
    
    alive: { 
        focus: 2.0, 
        overview: 0.3, 
        intensity: 1.0 
    },
    
    lerpSpeed: 10,
    
    layout: { 
        focusVGap: 340,  
        focusHGap: 330,  
        ovVGap: 180,     
        ovHGap: 160      
    },
    
    undoMaxStates: 200,
    
    colors: {
        bg: '#0a0f0d',
        bgGlow: 'rgba(18, 40, 30, 0.25)',
        nodeFill: 'rgba(18, 38, 32, 0.85)',
        border: 'rgba(80, 120, 100, 0.38)',
        selectedBorder: 'rgba(100, 200, 150, 0.65)',
        selectedGlow: 'rgba(100, 200, 150, 0.2)',
        parentBorder: 'rgba(80, 120, 100, 0.16)',
        siblingBorder: 'rgba(80, 120, 100, 0.15)',
        connection: 'rgba(80, 120, 100, 0.28)',
        connectionParent: 'rgba(80, 120, 100, 0.12)',
        connectionSibling: 'rgba(80, 120, 100, 0.06)',
        text: '#e0e8e4',
        textDim: 'rgba(160, 190, 175, 0.45)',
        noteDot: 'rgba(100, 200, 150, 0.5)',
        deleteBg: 'rgba(50, 16, 16, 0.95)',
        deleteBorder: 'rgba(200, 70, 70, 0.45)',
        deleteText: '#e0a0a0',
        helpBg: 'rgba(8, 16, 12, 0.92)',
        helpBorder: 'rgba(80, 120, 100, 0.25)',
        helpText: '#b0c8ba',
        helpKey: 'rgba(100, 200, 150, 0.7)',
        barBg: 'rgba(8, 14, 11, 0.85)',
        barBorder: 'rgba(80, 120, 100, 0.15)',
        barText: 'rgba(140, 170, 155, 0.5)'
    },
    
    font: "'DM Sans', 'Noto Sans Arabic', sans-serif",
    fontSize: { 
        focused: 15, 
        child: 13, // Adjusted down slightly for smaller nodes
        parent: 12, 
        ovFocused: 14, 
        ovChild: 11, 
        ovGrandchild: 10 
    }
};