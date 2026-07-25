  let deckSize = 3; // Options: 3, 10, 100
    let cards = [];
    let userPick = null;
    let otherCandidate = null;
    let revealedKings = [];
    let gameState = 'PICK'; // 'PICK', 'DECIDE', 'RESULT'

    let batchQueue = [];
    let currentBatchIndex = 0;
    let peekMode = false;

    // Separate statistical tracking for each deck size mode
    let modeStats = {
      3: { switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 },
      10: { switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 },
      100: { switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 }
    };

    function setDeckSize(size, force = false) {
      if (deckSize === size && !force) return;
      deckSize = size;

      // Update Tab UI active states
      [3, 10, 100].forEach(s => {
        const btn = document.getElementById(`modeBtn${s}`);
        if (btn) {
          if (s === size) {
            btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-sky-500 text-slate-950 shadow';
          } else {
            btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-200';
          }
        }
      });

      document.getElementById('headerCardCount').innerText = deckSize;
      document.getElementById('footerDeckSizeText').innerText = deckSize;
      document.getElementById('statsModeBadge').innerText = `${deckSize} Cards Mode`;

      // Update theoretical expectation display
      const keepExpPct = ((1 / deckSize) * 100).toFixed(1);
      const switchExpPct = (((deckSize - 1) / deckSize) * 100).toFixed(1);

      document.getElementById('switchExpectedText').innerText = `${switchExpPct}%`;
      document.getElementById('stayExpectedText').innerText = `${keepExpPct}%`;
      document.getElementById('footerSwitchExp').innerText = `${switchExpPct}%`;
      document.getElementById('footerKeepExp').innerText = `${keepExpPct}%`;

      createNewBatch();
    }

    function createNewBatch(batchSize = 10) {
      batchQueue = [];
      currentBatchIndex = 0;

      for (let i = 0; i < batchSize; i++) {
        const acePos = Math.floor(Math.random() * deckSize);
        const deck = new Array(deckSize).fill('K');
        deck[acePos] = 'A';

        batchQueue.push({
          id: i + 1,
          cards: deck,
          acePos: acePos,
          userPick: null,
          revealedKings: [],
          otherCandidate: null,
          action: null,
          won: null,
          completed: false
        });
      }

      resetRound();
    }

    function resetStats() {
      modeStats[deckSize] = { switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 };
      updateStatsUI();
    }

    function togglePeek() {
      peekMode = !peekMode;
      const btn = document.getElementById('peekBtn');
      if (btn) {
        if (peekMode) {
          btn.innerText = 'Hide Future Decks';
          btn.className = 'text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-600 transition';
        } else {
          btn.innerText = 'Reveal Future Decks';
          btn.className = 'text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium px-3 py-1.5 rounded-lg border border-slate-700/60 transition';
        }
      }
      renderBatchTable();
    }

    function renderCardsArena() {
      const arena = document.getElementById('cardArena');
      if (!arena) return;

      arena.innerHTML = '';

      let gridClass = 'grid-cols-3 gap-3 sm:gap-6';
      let cardHeight = 'h-52 sm:h-64';
      let fontSizes = { num: 'text-xs sm:text-sm', icon: 'text-3xl sm:text-5xl', tag: 'text-[10px] sm:text-xs' };

      if (deckSize === 10) {
        gridClass = 'grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2';
        cardHeight = 'h-28 sm:h-36';
        fontSizes = { num: 'text-[10px]', icon: 'text-lg sm:text-2xl', tag: 'text-[8px]' };
      } else if (deckSize === 100) {
        gridClass = 'grid-cols-10 gap-1 sm:gap-1.5 max-h-[380px] overflow-y-auto p-1';
        cardHeight = 'h-11 sm:h-14';
        fontSizes = { num: 'text-[8px]', icon: 'text-xs sm:text-base', tag: 'hidden' };
      }

      const gridWrapper = document.createElement('div');
      gridWrapper.className = `grid ${gridClass} w-full`;

      for (let i = 0; i < deckSize; i++) {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'flex flex-col items-center';

        cardWrapper.innerHTML = `
          <div id="cardContainer${i}" onclick="handleCardClick(${i})" class="card-container ${cardHeight} w-full cursor-pointer select-none">
            <div id="cardInner${i}" class="card-inner">
              <div id="cardFront${i}" class="card-front flex flex-col items-center justify-between p-1.5 sm:p-2.5 hover:border-sky-500/70 transition-colors">
                <span class="${fontSizes.num} font-semibold text-slate-400">#${i + 1}</span>
                <div class="${fontSizes.icon} opacity-40">🂠</div>
                <div id="cardOverlay${i}" class="w-full flex justify-center min-h-[18px] items-center">
                  <span id="cardTag${i}" class="${fontSizes.tag} font-medium px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">Select</span>
                </div>
              </div>
              <div id="cardBack${i}" class="card-back flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl border-2">
                <div id="cardContent${i}" class="text-center w-full"></div>
              </div>
            </div>
          </div>
        `;
        gridWrapper.appendChild(cardWrapper);
      }

      arena.appendChild(gridWrapper);
    }

    function resetRound() {
      if (batchQueue.length === 0 || currentBatchIndex >= batchQueue.length) {
        createNewBatch();
        return;
      }

      const currentGame = batchQueue[currentBatchIndex];
      cards = [...currentGame.cards];

      userPick = null;
      otherCandidate = null;
      revealedKings = [];
      gameState = 'PICK';

      document.getElementById('actionContainer').classList.add('hidden');
      document.getElementById('nextGameBar').classList.add('hidden');

      const statusText = document.getElementById('gameStatusText');
      const statusSubtext = document.getElementById('gameStatusSubtext');

      if (statusText) {
        statusText.innerText = `Game #${currentGame.id}: Pick a card out of ${deckSize}`;
        statusText.className = 'text-base sm:text-lg font-bold text-sky-400';
      }
      if (statusSubtext) {
        statusSubtext.innerText = `Select any card to locate the Ace (1 in ${deckSize} chance).`;
      }

      renderCardsArena();
      renderBatchTable();
      updateStatsUI();
    }

    function handleCardClick(index) {
      if (gameState !== 'PICK') return;

      userPick = index;
      gameState = 'DECIDE';

      // Host elimination logic for N cards:
      // Host must reveal N - 2 losing cards (Kings).
      // Host NEVER reveals the user's pick.
      // Host NEVER reveals the Ace.

      let allKingIndices = [];
      for (let i = 0; i < deckSize; i++) {
        if (i !== userPick && cards[i] === 'K') {
          allKingIndices.push(i);
        }
      }

      // If user picked King, the Ace is among the other cards.
      // Host must keep the Ace unrevealed, and reveal all other N-2 Kings!
      // If user picked Ace, Host leaves 1 random King unrevealed and reveals the other N-2 Kings.

      if (cards[userPick] === 'K') {
        // Ace position
        const aceIndex = cards.indexOf('A');
        otherCandidate = aceIndex;
        // Host reveals all kings except userPick and otherCandidate
        revealedKings = allKingIndices.filter(k => k !== otherCandidate);
      } else {
        // User picked Ace! Randomly pick 1 king to keep unrevealed as the alternative
        const randomKingToKeepIdx = Math.floor(Math.random() * allKingIndices.length);
        otherCandidate = allKingIndices[randomKingToKeepIdx];
        revealedKings = allKingIndices.filter(k => k !== otherCandidate);
      }

      const currentGame = batchQueue[currentBatchIndex];
      currentGame.userPick = userPick;
      currentGame.revealedKings = revealedKings;
      currentGame.otherCandidate = otherCandidate;

      // Highlight User's Pick
      const selectedFront = document.getElementById(`cardFront${userPick}`);
      if (selectedFront) selectedFront.classList.add('glow-selected');

      // Highlight Alternative Candidate
      const candidateFront = document.getElementById(`cardFront${otherCandidate}`);
      if (candidateFront) candidateFront.classList.add('glow-candidate');

      // Flip all revealed Kings
      revealedKings.forEach(kIdx => {
        revealCard(kIdx, 'K');
        const kContainer = document.getElementById(`cardContainer${kIdx}`);
        if (kContainer) kContainer.classList.add('pointer-events-none', 'opacity-60');
      });

      const statusText = document.getElementById('gameStatusText');
      const statusSubtext = document.getElementById('gameStatusSubtext');
      if (statusText) {
        statusText.innerText = `Host eliminated ${revealedKings.length} King${revealedKings.length > 1 ? 's' : ''}!`;
        statusText.className = 'text-base sm:text-lg font-extrabold text-amber-400';
      }
      if (statusSubtext) {
        statusSubtext.innerText = `Card #${userPick + 1} (Your pick) vs Card #${otherCandidate + 1} (Host's remaining card). Will you switch?`;
      }

      // Show Action Bar
      document.getElementById('actionDescription').innerText = `Switch to Card #${otherCandidate + 1} or Keep Card #${userPick + 1}?`;
      document.getElementById('switchBtn').innerText = `Switch to #${otherCandidate + 1}`;
      document.getElementById('keepBtn').innerText = `Keep #${userPick + 1}`;
      document.getElementById('actionContainer').classList.remove('hidden');

      renderBatchTable();
    }

    function handleDecision(didSwitch) {
      if (gameState !== 'DECIDE') return;

      gameState = 'RESULT';
      document.getElementById('actionContainer').classList.add('hidden');
      document.getElementById('nextGameBar').classList.remove('hidden');

      const finalPick = didSwitch ? otherCandidate : userPick;
      const won = cards[finalPick] === 'A';

      const currentGame = batchQueue[currentBatchIndex];
      currentGame.action = didSwitch ? 'switch' : 'keep';
      currentGame.won = won;
      currentGame.completed = true;

      const currentStats = modeStats[deckSize];
      if (didSwitch) {
        currentStats.switchGames++;
        if (won) currentStats.switchWins++;
      } else {
        currentStats.stayGames++;
        if (won) currentStats.stayWins++;
      }

      // Flip remaining unrevealed cards (User Pick and Alternative Candidate)
      for (let i = 0; i < deckSize; i++) {
        if (!revealedKings.includes(i)) {
          let role = '';
          if (i === finalPick) {
            role = didSwitch ? 'Switched To' : 'Kept (1st Pick)';
          } else if (i === userPick && didSwitch) {
            role = '1st Pick';
          } else if (i === otherCandidate) {
            role = 'Alternative';
          }
          revealCard(i, cards[i], role);
        }
      }

      // Distinctly highlight the initially selected card if user switched
      if (didSwitch) {
        const initialBack = document.getElementById(`cardBack${userPick}`);
        if (initialBack) initialBack.classList.add('glow-initial');
      }

      const finalBack = document.getElementById(`cardBack${finalPick}`);
      const statusText = document.getElementById('gameStatusText');

      if (won) {
        if (finalBack) finalBack.classList.add('glow-win');
        if (statusText) {
          statusText.innerText = didSwitch ? `Switched to #${finalPick + 1} and WON the Ace!` : `Kept #${finalPick + 1} and WON the Ace!`;
          statusText.className = 'text-base sm:text-lg font-black text-emerald-400';
        }
      } else {
        if (finalBack) finalBack.classList.add('glow-lose');
        if (statusText) {
          statusText.innerText = didSwitch ? `Switched to #${finalPick + 1} (King)` : `Kept #${finalPick + 1} (King)`;
          statusText.className = 'text-base sm:text-lg font-black text-rose-400';
        }
      }

      const statusSubtext = document.getElementById('gameStatusSubtext');
      if (statusSubtext) {
        const aceNum = cards.indexOf('A') + 1;
        statusSubtext.innerHTML = `<span class="font-bold text-slate-200">Winner: Card #${aceNum} (Ace ♠)</span> | Your initial pick: Card #${userPick + 1}`;
      }

      currentBatchIndex++;
      updateStatsUI();
      renderBatchTable();
    }

    function revealCard(index, type, roleTag = '') {
      const container = document.getElementById(`cardContainer${index}`);
      const back = document.getElementById(`cardBack${index}`);
      const content = document.getElementById(`cardContent${index}`);

      if (!container || !back || !content) return;

      const isCompact = deckSize === 100;

      let badgeHtml = '';
      if (roleTag) {
        let badgeColor = 'bg-slate-800/90 text-slate-300 border-slate-700';
        if (roleTag.includes('Switched') || roleTag.includes('Final') || roleTag.includes('Kept')) {
          badgeColor = 'bg-sky-950/90 text-sky-300 border-sky-600/60';
        } else if (roleTag.includes('1st')) {
          badgeColor = 'bg-amber-950/90 text-amber-300 border-amber-600/60';
        }
        const badgeSize = isCompact ? 'text-[7px] px-1 py-0' : 'text-[8px] sm:text-[9px] px-1.5 py-0.2 mt-0.5';
        badgeHtml = `<div class="${badgeSize} font-semibold rounded-full border ${badgeColor} tracking-tight">${roleTag}</div>`;
      }

      if (type === 'A') {
        back.className = 'card-back flex flex-col items-center justify-center p-1 rounded-xl border-2 bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-500 text-emerald-400';
        content.innerHTML = `
          <div class="${isCompact ? 'text-xs font-black' : 'text-xl sm:text-3xl font-black'}">♠</div>
          <div class="${isCompact ? 'text-[8px] font-bold' : 'text-xs sm:text-sm font-bold'}">ACE</div>
          ${badgeHtml}
        `;
      } else {
        back.className = 'card-back flex flex-col items-center justify-center p-1 rounded-xl border-2 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700 text-slate-400';
        content.innerHTML = `
          <div class="${isCompact ? 'text-xs font-black' : 'text-xl sm:text-3xl font-black'}">♔</div>
          <div class="${isCompact ? 'text-[8px] font-bold' : 'text-xs sm:text-sm font-bold'}">KING</div>
          ${badgeHtml}
        `;
      }

      container.classList.add('is-flipped');
    }

    function updateStatsUI() {
      const stats = modeStats[deckSize];

      const switchRate = stats.switchGames > 0 ? ((stats.switchWins / stats.switchGames) * 100).toFixed(1) : '0.0';
      const stayRate = stats.stayGames > 0 ? ((stats.stayWins / stats.stayGames) * 100).toFixed(1) : '0.0';

      document.getElementById('switchWinRate').innerText = `${switchRate}%`;
      document.getElementById('switchWinCount').innerText = `${stats.switchWins} wins / ${stats.switchGames} games`;
      document.getElementById('switchBar').style.width = `${switchRate}%`;

      document.getElementById('stayWinRate').innerText = `${stayRate}%`;
      document.getElementById('stayWinCount').innerText = `${stats.stayWins} wins / ${stats.stayGames} games`;
      document.getElementById('stayBar').style.width = `${stayRate}%`;
    }

    function renderBatchTable() {
      const tbody = document.getElementById('batchTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      batchQueue.forEach((item, index) => {
        const isCurrent = index === currentBatchIndex && !item.completed;
        const row = document.createElement('tr');

        if (isCurrent) {
          row.className = 'bg-sky-950/40 text-sky-200 font-semibold';
        } else if (item.completed) {
          row.className = item.won ? 'bg-emerald-950/20 text-emerald-300' : 'bg-rose-950/20 text-rose-300';
        } else {
          row.className = 'text-slate-400';
        }

        let aceDisplay = '<span class="text-slate-500">Hidden</span>';
        if (peekMode || item.completed) {
          aceDisplay = `Card #${item.acePos + 1} (Ace ♠)`;
        }

        let hostElimSummary = '-';
        if (item.revealedKings.length > 0) {
          hostElimSummary = `${item.revealedKings.length} Kings`;
        }

        row.innerHTML = `
          <td class="py-2 px-3 font-medium">${item.id}</td>
          <td class="py-2 px-3">${aceDisplay}</td>
          <td class="py-2 px-3">${item.userPick !== null ? `Card #${item.userPick + 1}` : '-'}</td>
          <td class="py-2 px-3">${hostElimSummary}</td>
          <td class="py-2 px-3 uppercase text-[10px] font-bold">${item.action || '-'}</td>
          <td class="py-2 px-3 text-right font-semibold">
            ${item.completed ? (item.won ? '<span class="text-emerald-400">WIN</span>' : '<span class="text-rose-400">LOSE</span>') : (isCurrent ? '<span class="text-sky-400">Active</span>' : '<span class="text-slate-500">Pending</span>')}
          </td>
        `;
        tbody.appendChild(row);
      });

      const activeNum = Math.min(currentBatchIndex + 1, batchQueue.length);
      const badge = document.getElementById('batchProgressBadge');
      if (badge) {
        badge.innerText = `Game ${activeNum} of ${batchQueue.length}`;
      }
    }

    window.onload = function() {
      setDeckSize(3, true);
    };