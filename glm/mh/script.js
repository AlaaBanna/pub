
    let cards = [];
    let userPick = null;
    let revealedKing = null;
    let gameState = 'PICK';

    let batchQueue = [];
    let currentBatchIndex = 0;
    let peekMode = false;

    let stats = {
      switchWins: 0,
      switchGames: 0,
      stayWins: 0,
      stayGames: 0
    };

    function createNewBatch(size = 10) {
      batchQueue = [];
      currentBatchIndex = 0;

      for (let i = 0; i < size; i++) {
        const acePos = Math.floor(Math.random() * 3);
        const deck = ['K', 'K', 'K'];
        deck[acePos] = 'A';

        batchQueue.push({
          id: i + 1,
          cards: deck,
          acePos: acePos,
          userPick: null,
          hostRevealed: null,
          action: null,
          won: null,
          completed: false
        });
      }

      resetRound();
    }

    function resetAll() {
      stats = { switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 };
      updateStatsUI();
      createNewBatch();
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

    function renderBatchTable() {
      const tbody = document.getElementById('batchTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      batchQueue.forEach((item, index) => {
        const isCurrent = index === currentBatchIndex && !item.completed;
        const row = document.createElement('tr');
        
        if (isCurrent) {
          row.className = 'bg-sky-950/30 text-sky-200 font-semibold';
        } else if (item.completed) {
          row.className = item.won ? 'bg-emerald-950/20 text-emerald-300' : 'bg-rose-950/20 text-rose-300';
        } else {
          row.className = 'text-slate-400';
        }

        let aceDisplay = '<span class="text-slate-500">Hidden</span>';
        if (peekMode || item.completed) {
          aceDisplay = `Card #${item.acePos + 1} (Ace ♠)`;
        }

        row.innerHTML = `
          <td class="py-2 px-3 font-medium">${item.id}</td>
          <td class="py-2 px-3">${aceDisplay}</td>
          <td class="py-2 px-3">${item.userPick !== null ? `Card #${item.userPick + 1}` : '-'}</td>
          <td class="py-2 px-3">${item.hostRevealed !== null ? `Card #${item.hostRevealed + 1}` : '-'}</td>
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

    function clearCardActions() {
      for (let i = 0; i < 3; i++) {
        const overlay = document.getElementById(`cardOverlay${i}`);
        if (overlay) {
          overlay.innerHTML = `<span id="cardTag${i}" class="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">Select</span>`;
        }
      }
    }

    function resetRound() {
      if (batchQueue.length === 0 || currentBatchIndex >= batchQueue.length) {
        createNewBatch();
        return;
      }

      const currentGame = batchQueue[currentBatchIndex];
      cards = [...currentGame.cards];

      userPick = null;
      revealedKing = null;
      gameState = 'PICK';

      const statusText = document.getElementById('gameStatusText');
      const statusSubtext = document.getElementById('gameStatusSubtext');

      if (statusText) {
        statusText.innerText = `Game #${currentGame.id}: Pick a card`;
        statusText.className = 'text-base sm:text-lg font-semibold text-sky-400';
      }
      if (statusSubtext) {
        statusSubtext.innerText = 'Select any card to locate the Ace.';
      }

      clearCardActions();

      for (let i = 0; i < 3; i++) {
        const container = document.getElementById(`cardContainer${i}`);
        const front = document.getElementById(`cardFront${i}`);
        const back = document.getElementById(`cardBack${i}`);
        if (container) {
          container.classList.remove('is-flipped', 'pointer-events-none');
        }
        if (front) {
          front.classList.remove('glow-selected', 'glow-win', 'glow-lose');
        }
        if (back) {
          back.classList.remove('glow-win', 'glow-lose');
        }
      }

      renderBatchTable();
    }

    function handleCardClick(index) {
      if (gameState !== 'PICK') return;

      userPick = index;
      gameState = 'DECIDE';

      let availableHostPicks = [];
      for (let i = 0; i < 3; i++) {
        if (i !== userPick && cards[i] === 'K') {
          availableHostPicks.push(i);
        }
      }
      
      revealedKing = availableHostPicks[Math.floor(Math.random() * availableHostPicks.length)];

      const currentGame = batchQueue[currentBatchIndex];
      currentGame.userPick = userPick;
      currentGame.hostRevealed = revealedKing;

      const selectedFront = document.getElementById(`cardFront${userPick}`);
      if (selectedFront) {
        selectedFront.classList.add('glow-selected');
      }

      revealCard(revealedKing, 'K');
      const hostTag = document.getElementById(`cardTag${revealedKing}`);
      if (hostTag) {
        hostTag.innerText = 'Host Revealed';
      }
      const hostContainer = document.getElementById(`cardContainer${revealedKing}`);
      if (hostContainer) {
        hostContainer.classList.add('pointer-events-none');
      }

      const statusText = document.getElementById('gameStatusText');
      const statusSubtext = document.getElementById('gameStatusSubtext');
      if (statusText) {
        statusText.innerText = `Card #${revealedKing + 1} revealed as a King`;
        statusText.className = 'text-base sm:text-lg font-bold text-amber-400';
      }
      if (statusSubtext) {
        statusSubtext.innerText = 'Switch to the remaining card or keep your pick?';
      }

      const otherUnrevealedCard = [0, 1, 2].find(i => i !== userPick && i !== revealedKing);
      const cardOverlay = document.getElementById(`cardOverlay${userPick}`);
      if (cardOverlay) {
        cardOverlay.innerHTML = `
          <div class="flex flex-col gap-1.5 w-full px-1.5 z-10" onclick="event.stopPropagation()">
            <button onclick="handleDecision(true)" class="w-full py-1.5 px-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg shadow-md transition active:scale-95 leading-tight">
              Switch to #${otherUnrevealedCard + 1}
            </button>
            <button onclick="handleDecision(false)" class="w-full py-1.5 px-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition active:scale-95 leading-tight">
              Keep Card #${userPick + 1}
            </button>
          </div>
        `;
      }

      renderBatchTable();
    }

    function handleDecision(didSwitch) {
      if (gameState !== 'DECIDE') return;

      gameState = 'RESULT';
      
      let finalPick = userPick;
      if (didSwitch) {
        finalPick = [0, 1, 2].find(i => i !== userPick && i !== revealedKing);
      }

      const won = cards[finalPick] === 'A';

      const currentGame = batchQueue[currentBatchIndex];
      currentGame.action = didSwitch ? 'switch' : 'keep';
      currentGame.won = won;
      currentGame.completed = true;

      if (didSwitch) {
        stats.switchGames++;
        if (won) stats.switchWins++;
      } else {
        stats.stayGames++;
        if (won) stats.stayWins++;
      }

      clearCardActions();

      for (let i = 0; i < 3; i++) {
        let role = '';
        if (i === revealedKing) {
          role = 'Host Revealed';
        } else if (i === finalPick) {
          role = didSwitch ? 'Switched To' : 'Kept (Final)';
        } else if (i === userPick && didSwitch) {
          role = '1st Pick';
        }

        // Place the "Next Game" button on the ORIGINAL pick card so user cursor stays stationary
        const isOriginalPick = (i === userPick);
        revealCard(i, cards[i], role, isOriginalPick);
      }

      const finalBack = document.getElementById(`cardBack${finalPick}`);
      const statusText = document.getElementById('gameStatusText');

      if (won) {
        if (finalBack) finalBack.classList.add('glow-win');
        if (statusText) {
          statusText.innerText = didSwitch ? 'Switched and found the Ace!' : 'Kept and found the Ace!';
          statusText.className = 'text-base sm:text-lg font-bold text-emerald-400';
        }
      } else {
        if (finalBack) finalBack.classList.add('glow-lose');
        if (statusText) {
          statusText.innerText = didSwitch ? 'Switched to a King' : 'Kept a King';
          statusText.className = 'text-base sm:text-lg font-bold text-rose-400';
        }
      }

      const statusSubtext = document.getElementById('gameStatusSubtext');
      if (statusSubtext) {
        const switchText = didSwitch 
          ? `Picked Card #${userPick + 1} → Switched to Card #${finalPick + 1}`
          : `Picked & Kept Card #${userPick + 1}`;
        statusSubtext.innerHTML = `<span class="font-medium text-slate-200">${switchText}</span> | Host showed Card #${revealedKing + 1} | Winner: Card #${cards.indexOf('A') + 1} (Ace ♠)`;
      }

      currentBatchIndex++;

      updateStatsUI();
      renderBatchTable();
    }

    function revealCard(index, type, roleTag = '', isOriginalPick = false) {
      const container = document.getElementById(`cardContainer${index}`);
      const back = document.getElementById(`cardBack${index}`);
      const content = document.getElementById(`cardContent${index}`);

      if (!container || !back || !content) return;

      let badgeHtml = '';
      if (roleTag) {
        let badgeColor = 'bg-slate-800/90 text-slate-300 border-slate-700';
        if (roleTag.includes('Switched') || roleTag.includes('Final') || roleTag.includes('Kept')) {
          badgeColor = 'bg-sky-950/90 text-sky-300 border-sky-600/60';
        } else if (roleTag.includes('Host')) {
          badgeColor = 'bg-amber-950/90 text-amber-300 border-amber-700/60';
        } else if (roleTag.includes('1st')) {
          badgeColor = 'bg-slate-800/90 text-slate-400 border-slate-700';
        }
        badgeHtml = `<div class="mt-1 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor} tracking-wide">${roleTag}</div>`;
      }

      let nextGameBtnHtml = '';
      if (isOriginalPick) {
        nextGameBtnHtml = `
          <button onclick="event.stopPropagation(); resetRound()" class="mt-2.5 w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-md transition active:scale-95 flex items-center justify-center gap-1 pointer-events-auto relative z-20 cursor-pointer">
            <span>Next Game</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        `;
      }

      if (type === 'A') {
        back.className = 'card-back flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl border-2 bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-500 text-emerald-400';
        content.innerHTML = `
          <div class="text-2xl sm:text-4xl font-black mb-0.5">♠</div>
          <div class="text-sm sm:text-lg font-bold">ACE</div>
          <div class="text-[10px] sm:text-xs opacity-70">Winner</div>
          ${badgeHtml}
          ${nextGameBtnHtml}
        `;
      } else {
        back.className = 'card-back flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl border-2 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700 text-slate-400';
        content.innerHTML = `
          <div class="text-2xl sm:text-4xl font-black mb-0.5">♔</div>
          <div class="text-sm sm:text-lg font-bold">KING</div>
          <div class="text-[10px] sm:text-xs opacity-70">Goat</div>
          ${badgeHtml}
          ${nextGameBtnHtml}
        `;
      }

      container.classList.add('is-flipped');
    }

    function updateStatsUI() {
      const switchRate = stats.switchGames > 0 ? ((stats.switchWins / stats.switchGames) * 100).toFixed(1) : 0;
      const stayRate = stats.stayGames > 0 ? ((stats.stayWins / stats.stayGames) * 100).toFixed(1) : 0;

      const switchRateEl = document.getElementById('switchWinRate');
      const switchCountEl = document.getElementById('switchWinCount');
      const switchBarEl = document.getElementById('switchBar');

      const stayRateEl = document.getElementById('stayWinRate');
      const stayCountEl = document.getElementById('stayWinCount');
      const stayBarEl = document.getElementById('stayBar');

      if (switchRateEl) switchRateEl.innerText = `${switchRate}%`;
      if (switchCountEl) switchCountEl.innerText = `${stats.switchWins} wins / ${stats.switchGames} games`;
      if (switchBarEl) switchBarEl.style.width = `${switchRate}%`;

      if (stayRateEl) stayRateEl.innerText = `${stayRate}%`;
      if (stayCountEl) stayCountEl.innerText = `${stats.stayWins} wins / ${stats.stayGames} games`;
      if (stayBarEl) stayBarEl.style.width = `${stayRate}%`;
    }

    // Initialize application on load
    window.onload = function() {
      createNewBatch();
    };