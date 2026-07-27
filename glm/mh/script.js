// meta.fikra: Monty Hall Card Simulator | Version 1.2.0 | Updated: 2026-07-28 01:12
let currentDeckSize = 3;
    let currentGameIndex = 0;
    let gameState = 'PICK'; // 'PICK', 'DECISION', 'RESULT'
    
    let userPick = null;
    let hostEliminatedIndices = [];
    let switchCandidateIndex = null;
    let finalChoice = null;
    let peekMode = false;
    let isNewDeal = true;
    let previouslyFlippedIndices = new Set();

    // Batches & stats partitioned by deck size
    let batches = { 3: [], 10: [], 100: [] };
    let stats = {
      3: { switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 },
      10: { switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 },
      100: { switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 }
    };

    function saveStateToLocalStorage() {
      try {
        localStorage.setItem('mh_stats', JSON.stringify(stats));
        localStorage.setItem('mh_batches', JSON.stringify(batches));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
    }

    function loadStateFromLocalStorage() {
      try {
        const savedStats = localStorage.getItem('mh_stats');
        const savedBatches = localStorage.getItem('mh_batches');
        if (savedStats) stats = JSON.parse(savedStats);
        if (savedBatches) batches = JSON.parse(savedBatches);
      } catch (e) {
        console.warn('LocalStorage load failed', e);
      }
    }

    function generateBatch(deckSize) {
      const batch = [];
      for (let i = 1; i <= 10; i++) {
        batch.push({
          gameNum: i,
          aceIndex: Math.floor(Math.random() * deckSize),
          userPick: null,
          hostEliminated: [],
          action: null,
          win: null,
          completed: false,
          peeked: false
        });
      }
      return batch;
    }

    function setDeckSize(size, force = false) {
      if (currentDeckSize === size && !force) return;
      currentDeckSize = size;
      
      // Update Tab UI
      [3, 10, 100].forEach(s => {
        const btn = document.getElementById(`modeBtn${s}`);
        if (!btn) return;
        if (s === size) {
          btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-sky-500 text-slate-950 shadow";
        } else {
          btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-200";
        }
      });

      document.getElementById('headerCardCount').textContent = size;
      document.getElementById('statsModeBadge').textContent = `${size} Cards Mode`;
      document.getElementById('footerDeckSizeText').textContent = size;

      const switchExp = (((size - 1) / size) * 100).toFixed(1) + '%';
      const keepExp = ((1 / size) * 100).toFixed(1) + '%';

      document.getElementById('switchExpectedText').textContent = switchExp;
      document.getElementById('stayExpectedText').textContent = keepExp;
      document.getElementById('footerSwitchExp').textContent = switchExp;
      document.getElementById('footerKeepExp').textContent = keepExp;

      if (!batches[size] || batches[size].length === 0) {
        batches[size] = generateBatch(size);
      }
      
      currentGameIndex = batches[size].findIndex(g => !g.completed);
      if (currentGameIndex === -1) {
        batches[size] = generateBatch(size);
        currentGameIndex = 0;
      }

      resetRoundState();
      updateUI();
    }

    function resetRoundState() {
      gameState = 'PICK';
      userPick = null;
      hostEliminatedIndices = [];
      switchCandidateIndex = null;
      finalChoice = null;
      previouslyFlippedIndices.clear();
      isNewDeal = true;
    }

    function resetRound() {
      const currentBatch = batches[currentDeckSize];
      if (currentBatch.every(g => g.completed)) {
        batches[currentDeckSize] = generateBatch(currentDeckSize);
        currentGameIndex = 0;
      } else {
        currentGameIndex = currentBatch.findIndex(g => !g.completed);
      }
      resetRoundState();
      saveStateToLocalStorage();
      updateUI();
    }

    function handlePick(cardIndex) {
      if (gameState !== 'PICK') return;
      
      userPick = cardIndex;
      const game = batches[currentDeckSize][currentGameIndex];
      if (peekMode) game.peeked = true;
      const ace = game.aceIndex;

      let keepCandidates = [];
      if (userPick === ace) {
        const otherIndices = Array.from({ length: currentDeckSize }, (_, i) => i).filter(i => i !== userPick);
        const randomOther = otherIndices[Math.floor(Math.random() * otherIndices.length)];
        keepCandidates = [userPick, randomOther];
      } else {
        keepCandidates = [userPick, ace];
      }

      hostEliminatedIndices = [];
      for (let i = 0; i < currentDeckSize; i++) {
        if (!keepCandidates.includes(i)) {
          hostEliminatedIndices.push(i);
        }
      }

      switchCandidateIndex = keepCandidates.find(i => i !== userPick);
      gameState = 'DECISION';
      updateUI();
    }

    function handleDecision(isSwitch) {
      if (gameState !== 'DECISION') return;

      finalChoice = isSwitch ? switchCandidateIndex : userPick;
      const game = batches[currentDeckSize][currentGameIndex];
      if (peekMode) game.peeked = true;
      const isWin = (finalChoice === game.aceIndex);

      game.userPick = userPick;
      game.hostEliminated = [...hostEliminatedIndices];
      game.action = isSwitch ? 'Switch' : 'Keep';
      game.win = isWin;
      game.completed = true;

      const st = stats[currentDeckSize];
      if (isSwitch) {
        st.switchGames++;
        if (isWin) st.switchWins++;
      } else {
        st.stayGames++;
        if (isWin) st.stayWins++;
      }

      gameState = 'RESULT';
      saveStateToLocalStorage();
      updateUI();
    }

    function togglePeek() {
      peekMode = !peekMode;
      document.getElementById('peekBtn').textContent = peekMode ? "Hide Unplayed Cards" : "Reveal Future Decks";
      updateUI();
    }

    function resetStats() {
      stats[currentDeckSize] = { switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 };
      const statusEl = document.getElementById('autoSimStatus');
      if (statusEl) statusEl.classList.add('hidden');
      saveStateToLocalStorage();
      updateUI();
    }

    function toggleAutoSimPanel() {
      const panel = document.getElementById('autoSimPanel');
      if (!panel) return;
      panel.classList.toggle('hidden');
    }

    function executeAutoSimulation() {
      const strategySelect = document.getElementById('autoSimStrategy');
      const countSelect = document.getElementById('autoSimCount');
      const statusEl = document.getElementById('autoSimStatus');

      const mode = strategySelect ? strategySelect.value : 'both';
      const totalGames = countSelect ? parseInt(countSelect.value, 10) : 100;
      const size = currentDeckSize;

      let switchCount = 0;
      let stayCount = 0;

      if (mode === 'both') {
        switchCount = Math.floor(totalGames / 2);
        stayCount = totalGames - switchCount;
      } else if (mode === 'switch') {
        switchCount = totalGames;
      } else {
        stayCount = totalGames;
      }

      let switchWins = 0;
      let stayWins = 0;

      // Simulate Switch Games: picking a King always wins upon switching!
      for (let i = 0; i < switchCount; i++) {
        const ace = Math.floor(Math.random() * size);
        const pick = Math.floor(Math.random() * size);
        if (pick !== ace) {
          switchWins++;
        }
      }

      // Simulate Keep Games: keeping wins if and only if initial pick is Ace
      for (let i = 0; i < stayCount; i++) {
        const ace = Math.floor(Math.random() * size);
        const pick = Math.floor(Math.random() * size);
        if (pick === ace) {
          stayWins++;
        }
      }

      // Record simulation results into stats
      const st = stats[size];
      st.switchGames += switchCount;
      st.switchWins += switchWins;
      st.stayGames += stayCount;
      st.stayWins += stayWins;

      saveStateToLocalStorage();
      updateUI();

      if (statusEl) {
        statusEl.classList.remove('hidden');
        let details = `Simulated ${totalGames.toLocaleString()} games (${size} Cards): `;
        if (switchCount > 0 && stayCount > 0) {
          details += `Switch Win Rate: ${((switchWins / switchCount) * 100).toFixed(1)}% (${switchWins.toLocaleString()}/${switchCount.toLocaleString()}) | Keep Win Rate: ${((stayWins / stayCount) * 100).toFixed(1)}% (${stayWins.toLocaleString()}/${stayCount.toLocaleString()})`;
        } else if (switchCount > 0) {
          details += `Switch Win Rate: ${((switchWins / switchCount) * 100).toFixed(1)}% (${switchWins.toLocaleString()}/${switchCount.toLocaleString()} wins)`;
        } else {
          details += `Keep Win Rate: ${((stayWins / stayCount) * 100).toFixed(1)}% (${stayWins.toLocaleString()}/${stayCount.toLocaleString()} wins)`;
        }
        statusEl.textContent = `⚡ ${details}`;
      }
    }

    function updateUI() {
      renderStatusText();
      renderCardArena();
      renderActionContainer();
      renderStatsUI();
      renderBatchTable();
    }

    function renderStatusText() {
      const statusText = document.getElementById('gameStatusText');
      const subtext = document.getElementById('gameStatusSubtext');

      if (gameState === 'PICK') {
        statusText.textContent = `Pick 1 of ${currentDeckSize} cards`;
        statusText.className = "text-base sm:text-lg font-bold text-sky-400";
        subtext.textContent = `There is exactly 1 Ace ♠ and ${currentDeckSize - 1} Kings ♔.`;
      } else if (gameState === 'DECISION') {
        const eliminatedCount = hostEliminatedIndices.length;
        statusText.textContent = `Host eliminated ${eliminatedCount} King${eliminatedCount > 1 ? 's' : ''}!`;
        statusText.className = "text-base sm:text-lg font-bold text-amber-400";
        subtext.textContent = `Will you Switch to Card #${switchCandidateIndex + 1} or Keep Card #${userPick + 1}?`;
      } else if (gameState === 'RESULT') {
        const game = batches[currentDeckSize][currentGameIndex];
        if (game.win) {
          statusText.textContent = `🎉 WINNER! You found the Ace ♠!`;
          statusText.className = "text-base sm:text-lg font-bold text-emerald-400";
        } else {
          statusText.textContent = `❌ LOSS! That was a King ♔.`;
          statusText.className = "text-base sm:text-lg font-bold text-rose-400";
        }
        subtext.textContent = `Strategy used: ${game.action} on Card #${finalChoice + 1}.`;
      }
    }

    function renderCardArena() {
      const arena = document.getElementById('cardArena');
      arena.innerHTML = '';

      if (currentDeckSize === 3) {
        arena.className = "w-full max-w-2xl px-1 sm:px-2 min-h-[210px] sm:min-h-[250px] flex items-center justify-center relative z-0 py-2";
      } else if (currentDeckSize === 10) {
        arena.className = "w-full max-w-3xl px-1 sm:px-2 min-h-[110px] sm:min-h-[140px] flex items-center justify-center relative z-0 py-2";
      } else {
        arena.className = "w-full max-w-3xl px-1 sm:px-2 min-h-[70px] sm:min-h-[80px] flex items-center justify-center relative z-0 py-2";
      }

      const game = batches[currentDeckSize][currentGameIndex];
      const ace = game.aceIndex;

      let gridClass = "grid gap-3 sm:gap-4 w-full ";
      if (currentDeckSize === 3) gridClass += "grid-cols-3 max-w-lg mx-auto";
      else if (currentDeckSize === 10) gridClass += "grid-cols-5 sm:grid-cols-10 max-w-3xl";
      else gridClass += "grid-cols-10 gap-1.5 max-w-3xl";

      const container = document.createElement('div');
      container.className = gridClass;

      // Stagger delay calculation for ripple wave effect
      const delayPerCard = Math.max(8, Math.min(80, Math.round(900 / currentDeckSize)));
      const elementsToFlip = [];

      const dealThisTurn = isNewDeal;
      isNewDeal = false;

      for (let i = 0; i < currentDeckSize; i++) {
        const isEliminated = hostEliminatedIndices.includes(i);
        const isUserPick = (i === userPick);
        const isSwitchCandidate = (i === switchCandidateIndex);
        const isAce = (i === ace);

        // Responsive card height classes with proper aspect ratio
        const cardHeightClass = currentDeckSize === 3 
          ? "h-48 sm:h-56 md:h-60 aspect-[2/3]" 
          : currentDeckSize === 10 
            ? "h-24 sm:h-32 aspect-[2/3]" 
            : "h-14 sm:h-16 aspect-[2/3]";

        // Create 3D card wrapper
        const cardWrapper = document.createElement('div');
        const dealClass = dealThisTurn ? "card-deal-anim" : "";
        cardWrapper.className = `card-container ${cardHeightClass} ${dealClass} cursor-pointer group mx-auto w-full max-w-[160px]`;
        if (dealThisTurn) {
          const dealDelay = Math.min(i * delayPerCard * 0.75, 450);
          cardWrapper.style.animationDelay = `${dealDelay}ms`;
        }

        // Card Inner (handles flip transition)
        const cardInner = document.createElement('div');
        const shouldBeFlipped = (gameState === 'RESULT' || isEliminated);

        // Base inner styling
        cardInner.className = `card-inner shadow-xl`;

        if (shouldBeFlipped) {
          if (previouslyFlippedIndices.has(i)) {
            // Card was ALREADY flipped prior to this render — keep it flipped untouched without re-animating
            cardInner.classList.add('is-flipped', 'no-transition');
          } else {
            // Newly flipped card in this step — compute stagger order for smooth transition
            let staggerOrder = i;
            if (gameState === 'DECISION' && isEliminated) {
              staggerOrder = hostEliminatedIndices.indexOf(i);
            }
            const staggerDelayMs = staggerOrder * delayPerCard;
            cardInner.style.transitionDelay = `${staggerDelayMs}ms`;
            elementsToFlip.push({ element: cardInner, index: i });
          }
        }

        // Dynamic State Glow classes
        let frontGlow = "border-slate-800 bg-slate-900";
        let badgeHTML = "";

        if (gameState === 'DECISION') {
          if (isUserPick) {
            frontGlow = "bg-amber-950/40 border-amber-500 glow-amber";
            if (currentDeckSize === 3) {
              badgeHTML = `<span class="text-[9px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold uppercase shadow">1st Pick (Keep)</span>`;
            } else if (currentDeckSize === 10) {
              badgeHTML = `<span class="text-[8px] bg-amber-500 text-slate-950 px-1 py-0.5 rounded font-bold uppercase shadow">1st (Keep)</span>`;
            } else {
              badgeHTML = `<span class="text-[7px] bg-amber-500 text-slate-950 px-0.5 rounded font-bold">Keep</span>`;
            }
            cardWrapper.onclick = () => handleDecision(false);
          } else if (isSwitchCandidate) {
            frontGlow = "bg-sky-950/40 border-sky-400 glow-sky";
            if (currentDeckSize === 3) {
              badgeHTML = `<span class="text-[9px] bg-sky-400 text-slate-950 px-2 py-0.5 rounded-full font-bold uppercase shadow">Switch Target</span>`;
            } else if (currentDeckSize === 10) {
              badgeHTML = `<span class="text-[8px] bg-sky-400 text-slate-950 px-1 py-0.5 rounded font-bold uppercase shadow">Switch</span>`;
            } else {
              badgeHTML = `<span class="text-[7px] bg-sky-400 text-slate-950 px-0.5 rounded font-bold">Sw</span>`;
            }
            cardWrapper.onclick = () => handleDecision(true);
          } else if (isEliminated) {
            frontGlow = "opacity-30 border-slate-800 bg-slate-950";
          }
        } else if (gameState === 'PICK') {
          cardWrapper.onclick = () => handlePick(i);
        }

        // --- CARD FRONT (FACE DOWN) ---
        const cardFront = document.createElement('div');
        const paddingClass = currentDeckSize === 3 ? "p-2.5" : currentDeckSize === 10 ? "p-1.5" : "p-1";
        cardFront.className = `card-front border-2 rounded-xl sm:rounded-2xl ${paddingClass} flex flex-col justify-between overflow-hidden ${frontGlow}`;
        
        cardFront.innerHTML = `
          <!-- Card Back Pattern -->
          <div class="absolute inset-1 sm:inset-2 border border-sky-500/20 rounded-lg sm:rounded-xl overflow-hidden bg-slate-950/80 pointer-events-none">
            <svg class="w-full h-full opacity-20 text-sky-400" width="100%" height="100%" fill="none">
              <pattern id="cardPattern_${i}" width="14" height="14" patternUnits="userSpaceOnUse">
                <path d="M7 0L14 7L7 14L0 7L7 0Z" fill="currentColor" fill-opacity="0.3"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#cardPattern_${i})"/>
            </svg>
          </div>

          ${badgeHTML ? `<div class="relative z-10 flex justify-center">${badgeHTML}</div>` : `<div class="text-[9px] sm:text-[10px] text-slate-500 font-bold text-center">Card #${i + 1}</div>`}

          <div class="relative z-10 my-auto text-center">
            ${currentDeckSize === 3 
              ? `<div class="w-8 h-8 sm:w-10 sm:h-10 mx-auto bg-sky-950/80 rounded-full border border-sky-500/40 flex items-center justify-center font-card text-sky-400 font-bold text-xs sm:text-sm">MH</div>` 
              : currentDeckSize === 10 
                ? `<span class="text-slate-400 text-[10px] font-bold">#${i + 1}</span>` 
                : `<span class="text-slate-500 text-[8px] font-bold">#${i + 1}</span>`}
          </div>

          ${peekMode ? `<div class="relative z-10 text-center"><span class="text-[8px] sm:text-[9px] ${isAce ? 'bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded shadow tracking-wider' : 'text-slate-500 font-semibold'} uppercase">${isAce ? '♠ ACE' : '♔ KING'}</span></div>` : ''}
        `;

        // --- CARD BACK (FACE UP / REVEALED) ---
        const cardBack = document.createElement('div');
        let backStyle = "";
        let revealedBadge = "";

        if (isUserPick && gameState === 'RESULT') {
          // Highlight 1st pick in amber/orange after final reveal
          if (isAce) {
            backStyle = "bg-gradient-to-b from-amber-100 via-amber-50 to-emerald-100 border-2 border-amber-500 text-slate-950 pick-indicator-amber shadow-2xl";
            revealedBadge = `<span class="bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider">1ST PICK ♠ WIN</span>`;
          } else {
            backStyle = "bg-gradient-to-b from-amber-100 via-amber-50 to-white border-2 border-amber-500 text-amber-950 pick-indicator-amber shadow-xl";
            revealedBadge = `<span class="bg-amber-500 text-slate-950 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider">1ST PICK (KING)</span>`;
          }
        } else if (isAce) {
          // Radiant Gold & Emerald light card background for the winning Ace
          backStyle = "bg-gradient-to-b from-amber-100 via-amber-50 to-emerald-100 border-2 border-emerald-500 text-slate-950 glow-emerald shadow-2xl";
          revealedBadge = `<span class="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider">ACE ♠ WINNER</span>`;
        } else {
          // High-contrast playing card face for Kings
          backStyle = isEliminated 
            ? "bg-slate-200 border-2 border-slate-400 text-slate-900 opacity-75 shadow-md" 
            : "bg-gradient-to-b from-rose-100 via-rose-50 to-white border-2 border-rose-600 text-rose-950 glow-rose shadow-xl";
          revealedBadge = isEliminated
            ? `<span class="bg-slate-700 text-slate-100 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-slate-600 shadow">ELIMINATED</span>`
            : `<span class="bg-rose-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider">KING ♔ GOAT</span>`;
        }

        cardBack.className = `card-back border-2 rounded-xl sm:rounded-2xl ${paddingClass} flex flex-col justify-between overflow-hidden ${backStyle}`;

        if (currentDeckSize === 3) {
          cardBack.innerHTML = `
            <div class="flex justify-between items-center">
              <div class="flex flex-col items-center leading-none ${isAce ? 'text-slate-950' : isEliminated ? 'text-slate-800' : 'text-rose-700'}">
                <span class="text-base font-black font-card">${isAce ? 'A' : 'K'}</span>
                <span class="text-xs">${isAce ? '♠' : '♔'}</span>
              </div>
              ${revealedBadge}
            </div>

            <div class="my-auto mx-auto text-center flex flex-col items-center">
              ${isAce ? `
                <div class="p-2 sm:p-2.5 rounded-full bg-amber-200/80 border border-amber-400 shadow-inner">
                  <svg class="w-12 h-12 sm:w-14 sm:h-14 text-slate-950 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C10.5 4.5 5 11 5 14.5C5 17 7 19 9.5 19C10.8 19 11.9 18.5 12 17.8C12.1 18.5 13.2 19 14.5 19C17 19 19 17 19 14.5C19 11 13.5 4.5 12 2Z"/>
                    <path d="M12 16V22H10.5V22H13.5V22H12Z" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
              ` : `
                <div class="p-2 rounded-full ${isEliminated ? 'bg-slate-300 border border-slate-400' : 'bg-rose-200/80 border border-rose-400'}">
                  <svg class="w-10 h-10 sm:w-12 sm:h-12 ${isEliminated ? 'text-slate-800' : 'text-rose-700'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 16l-1-8 4 3 4-5 4 5 4-3-1 8H5z" />
                    <circle cx="12" cy="7" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="9" r="1" fill="currentColor" />
                    <circle cx="20" cy="9" r="1" fill="currentColor" />
                  </svg>
                </div>
              `}
            </div>

            <div class="flex flex-col items-center leading-none rotate-180 self-end ${isAce ? 'text-slate-950' : isEliminated ? 'text-slate-800' : 'text-rose-700'}">
              <span class="text-base font-black font-card">${isAce ? 'A' : 'K'}</span>
              <span class="text-xs">${isAce ? '♠' : '♔'}</span>
            </div>
          `;
        } else if (currentDeckSize === 10) {
          cardBack.innerHTML = `
            <div class="flex justify-between items-center text-[10px]">
              <span class="font-black font-card ${isAce ? 'text-slate-950' : isEliminated ? 'text-slate-800' : 'text-rose-700'}">${isAce ? 'A♠' : 'K♔'}</span>
              <span class="font-bold text-[8px] ${isAce ? 'text-emerald-900 font-extrabold' : isEliminated ? 'text-slate-800' : 'text-rose-800'}">${isAce ? 'ACE' : 'KING'}</span>
            </div>
            <div class="my-auto text-center">
              <span class="text-base sm:text-lg font-black font-card block ${isAce ? 'text-slate-950 scale-125' : isEliminated ? 'text-slate-800' : 'text-rose-700'}">${isAce ? '♠' : '♔'}</span>
            </div>
            <div class="text-[9px] text-center font-bold ${isAce ? 'text-slate-900' : 'text-slate-800'}">#${i + 1}</div>
          `;
        } else {
          cardBack.innerHTML = `
            <div class="my-auto text-center leading-none">
              <span class="text-[10px] sm:text-xs font-black font-card block ${isAce ? 'text-slate-950 font-black' : isEliminated ? 'text-slate-800' : 'text-rose-700'}">${isAce ? 'A♠' : 'K'}</span>
            </div>
          `;
        }

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardWrapper.appendChild(cardInner);
        container.appendChild(cardWrapper);
      }

      arena.appendChild(container);

      // Trigger staggered wave flip animation for newly flipped cards after DOM mount
      if (elementsToFlip.length > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            elementsToFlip.forEach(item => {
              previouslyFlippedIndices.add(item.index);
              item.element.classList.add('is-flipped');
            });
          });
        });
      }
    }

    function renderActionContainer() {
      const pickBar = document.getElementById('pickInfoBar');
      const container = document.getElementById('actionContainer');
      const nextBar = document.getElementById('nextGameBar');

      if (gameState === 'PICK') {
        if (pickBar) pickBar.classList.remove('hidden');
        container.classList.add('hidden');
        nextBar.classList.add('hidden');

        const odds = ((1 / currentDeckSize) * 100).toFixed(1) + '%';
        const countEl = document.getElementById('pickInfoCardCount');
        const oddsEl = document.getElementById('pickInfoOdds');
        if (countEl) countEl.textContent = currentDeckSize - 1;
        if (oddsEl) oddsEl.textContent = odds;
      } else if (gameState === 'DECISION') {
        if (pickBar) pickBar.classList.add('hidden');
        container.classList.remove('hidden');
        nextBar.classList.add('hidden');
        document.getElementById('actionDescription').textContent = `Switch to Card #${switchCandidateIndex + 1} or Keep Card #${userPick + 1}?`;
      } else if (gameState === 'RESULT') {
        if (pickBar) pickBar.classList.add('hidden');
        container.classList.add('hidden');
        nextBar.classList.remove('hidden');
      }
    }

    function renderStatsUI() {
      const st = stats[currentDeckSize];

      const switchRate = st.switchGames > 0 ? ((st.switchWins / st.switchGames) * 100).toFixed(1) : 0;
      const stayRate = st.stayGames > 0 ? ((st.stayWins / st.stayGames) * 100).toFixed(1) : 0;

      document.getElementById('switchWinRate').textContent = `${switchRate}%`;
      document.getElementById('switchBar').style.width = `${switchRate}%`;
      document.getElementById('switchWinCount').textContent = `${st.switchWins} wins / ${st.switchGames} games`;

      document.getElementById('stayWinRate').textContent = `${stayRate}%`;
      document.getElementById('stayBar').style.width = `${stayRate}%`;
      document.getElementById('stayWinCount').textContent = `${st.stayWins} wins / ${st.stayGames} games`;
    }

    function renderBatchTable() {
      const tbody = document.getElementById('batchTableBody');
      tbody.innerHTML = '';

      const currentBatch = batches[currentDeckSize];
      document.getElementById('batchProgressBadge').textContent = `Game ${Math.min(currentGameIndex + 1, 10)} of 10`;

      currentBatch.forEach((g, idx) => {
        const tr = document.createElement('tr');
        const isCurrent = (idx === currentGameIndex && gameState !== 'RESULT');

        if (isCurrent) tr.className = "bg-sky-950/30 text-sky-200 font-semibold";

        let aceDisplay = "???";
        if (g.completed || peekMode) {
          aceDisplay = `Card #${g.aceIndex + 1} ♠`;
        }

        let pickDisplay = g.userPick !== null ? `Card #${g.userPick + 1}` : "-";
        let hostDisplay = g.hostEliminated.length > 0 ? `${g.hostEliminated.length} Cards` : "-";
        let actionDisplay = g.action || "-";
        let resultDisplay = "-";

        if (g.completed) {
          let winText = g.win 
            ? `<span class="text-emerald-400 font-bold">WIN</span>` 
            : `<span class="text-rose-400 font-bold">LOSS</span>`;
          if (g.peeked) {
            winText += ` <span class="text-[9px] bg-slate-800 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono" title="Peek mode used during round">PEEKED</span>`;
          }
          resultDisplay = winText;
        }

        tr.innerHTML = `
          <td class="py-2 px-3 font-mono">${g.gameNum}</td>
          <td class="py-2 px-3">${aceDisplay}</td>
          <td class="py-2 px-3">${pickDisplay}</td>
          <td class="py-2 px-3">${hostDisplay}</td>
          <td class="py-2 px-3">${actionDisplay}</td>
          <td class="py-2 px-3 text-right">${resultDisplay}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Initialize application on DOM ready
    window.addEventListener('DOMContentLoaded', () => {
      loadStateFromLocalStorage();
      setDeckSize(3, true);
    });