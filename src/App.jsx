import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getBalance, processTransaction } from './api';
import { ASSETS, LUCKY_BAR_PASSIVE, LUCKY_BAR_ACTIVE } from './constants/assets';
import {
  SYMBOLS, MULTIPLIERS, GRID_COLS, GRID_ROWS, TOTAL_CELLS,
  MIN_BET, MAX_BET, BET_STEP, MIN_WIN_COUNT, WIN_RATE,
  getRandomSymbol
} from './constants/symbols';
import { LUCKY_BAR_POSITIONS_PASSIVE, LUCKY_BAR_POSITIONS_ACTIVE } from './constants/luckyBarLayout';

// Sound effects
import spinSoundFile from './assets/sounds/wheel-spin-click-slow-down-101152.mp3';
import coinDropSound from './assets/sounds/coin-drop-on-concrete-103555.mp3';
import winSoundFile from './assets/sounds/win sound.mp3';
import collectSoundFile from './assets/sounds/collect.mp3';
import youWinSfx from './assets/sounds/you-win-sfx-442128.mp3';
import bgMusicFile from './assets/sounds/backsound.mp3';
import bonusBgMusicFile from './assets/bonus-mode/bonus mode.mp3';

const CASCADE_MULTIPLIERS = [1, 2, 4, 6, 8, 9, 10];

export default function App() {
  // ==================== STATE ====================
  const [scale, setScale] = useState(1);
  const [isLandscape, setIsLandscape] = useState(false);
  const [grid, setGrid] = useState(() => Array.from({ length: TOTAL_CELLS }, () => getRandomSymbol()));
  const [isSpinning, setIsSpinning] = useState(false);
  const [stoppedCols, setStoppedCols] = useState(GRID_COLS);
  const [landedCols, setLandedCols] = useState(new Set());
  const [winAmount, setWinAmount] = useState(0);
  const [accumulatedWin, setAccumulatedWin] = useState(0);
  const [coins, setCoins] = useState(0);
  const [poin, setPoin] = useState(50);
  const [displayPoin, setDisplayPoin] = useState(50);
  const [bet, setBet] = useState(10);
  const [powerBar, setPowerBar] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const lockedPower = useRef(0);
  const autoSpinPowerRef = useRef(0);
  const freeSpinStarted = useRef(false);
  const [revealedRows, setRevealedRows] = useState(5);
  const [revealedColCount, setRevealedColCount] = useState(0);
  const [finalGridResult, setFinalGridResult] = useState(null);
  const [username, setUsername] = useState(null);
  const [debugMsg, setDebugMsg] = useState("Initializing...");

  const [winningCells, setWinningCells] = useState([]);
  const [cascadeStep, setCascadeStep] = useState(0);
  const [winStage, setWinStage] = useState('idle');
  const [lightningKey, setLightningKey] = useState(0);
  const [showLightning, setShowLightning] = useState(false);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayWin, setDisplayWin] = useState(0);
  const [displayMultiplier, setDisplayMultiplier] = useState(0);
  const [showWinValues, setShowWinValues] = useState(false);
  const [flyingCoins, setFlyingCoins] = useState([]);
  const [gridCoins, setGridCoins] = useState([]);
  const [showCoinBurst, setShowCoinBurst] = useState(false);
  const [multiplierPopUp, setMultiplierPopUp] = useState(false);
  const [multiplierFlyingDown, setMultiplierFlyingDown] = useState(false);
  const [multiplierFadingIn, setMultiplierFadingIn] = useState(false);
  const [isMultiplying, setIsMultiplying] = useState(false);
  const [baseWin, setBaseWin] = useState(0);
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [autoSpinActive, setAutoSpinActive] = useState(false);
  const [winAnimationPlaying, setWinAnimationPlaying] = useState(false);
  const [isBonusMode, setIsBonusMode] = useState(false);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
  const [flyingGridMultipliers, setFlyingGridMultipliers] = useState([]);
  const [multiplierReceiving, setMultiplierReceiving] = useState(false);
  const [collectedMultiplierCells, setCollectedMultiplierCells] = useState([]);

  // Tutorial
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);

  // Transition
  const [showTransition, setShowTransition] = useState(false);
  const [transitionStage, setTransitionStage] = useState('idle');
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef();
  const startTimeRef = useRef(0);
  const symbolImagesRef = useRef([]);

  // ==================== AUDIO ====================
  const spinSound = useRef(null);
  const reelStopSound = useRef(null);
  const winSound = useRef(null);
  const coinCollectSound = useRef(null);
  const multiplierSound = useRef(null);
  const cashInSound = useRef(null);
  const symbolFlipSounds = useRef([]);
  const youWinSound = useRef(null);
  const bgMusic = useRef(null);
  const bonusBgMusic = useRef(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const hasUnlockedSounds = useRef(false);
  const chargeInterval = useRef(null);
  const drainInterval = useRef(null);
  const landedCleanupTimers = useRef([]);

  // ==================== INIT ====================
  const fetchUserBalance = (user) => {
    setDebugMsg(`Fetching balance for ${user}...`);
    getBalance(user).then(data => {
      if (data) {
        setPoin(data.points);
        setDisplayPoin(data.points);
        if (data.tickets !== undefined) {
             setCoins(data.tickets);
             setDisplayCoins(data.tickets);
        } else {
             setCoins(10000);
             setDisplayCoins(10000);
        }
        setDebugMsg(`Balance loaded: ${data.points}`);
      } else {
        setDebugMsg(`Failed to load balance for ${user}`);
      }
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('username');
    if (user) {
      setUsername(user);
      fetchUserBalance(user);
    } else {
      setDebugMsg("No username in URL. Use ?username=yourname");
      setPoin(1000); 
      setDisplayPoin(1000);
      setCoins(10000); 
      setDisplayCoins(10000);
    }
  }, []);

  // Initialize audio
  useEffect(() => {
    spinSound.current = new Audio(spinSoundFile);
    reelStopSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    winSound.current = new Audio(winSoundFile);
    coinCollectSound.current = new Audio(coinDropSound);
    multiplierSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    cashInSound.current = new Audio(coinDropSound);
    symbolFlipSounds.current = Array.from({ length: 3 }, () => {
      const audio = new Audio(collectSoundFile);
      audio.volume = 0.3;
      return audio;
    });
    youWinSound.current = new Audio(youWinSfx);
    youWinSound.current.volume = 0.6;
    
    if (bgMusic.current) { bgMusic.current.pause(); bgMusic.current = null; }
    
    bgMusic.current = new Audio(bgMusicFile);
    bgMusic.current.volume = 0.3;
    bgMusic.current.loop = true;
    bonusBgMusic.current = new Audio(bonusBgMusicFile);
    bonusBgMusic.current.volume = 0.3;
    bonusBgMusic.current.loop = true;

    spinSound.current.volume = 0.4;
    reelStopSound.current.volume = 0.3;
    winSound.current.volume = 0.5;
    coinCollectSound.current.volume = 0.7;
    multiplierSound.current.volume = 0.5;
    cashInSound.current.volume = 0.4;

    [spinSound, reelStopSound, winSound, coinCollectSound, multiplierSound, cashInSound, youWinSound, bgMusic, bonusBgMusic].forEach(s => {
      if (s.current) s.current.load();
    });
    symbolFlipSounds.current.forEach(a => a.load());
    
    return () => {
        [spinSound, reelStopSound, winSound, coinCollectSound, multiplierSound, cashInSound, youWinSound, bgMusic, bonusBgMusic].forEach(s => {
          if (s.current) { s.current.pause(); s.current = null; }
        });
    };
  }, []);

  // ==================== AUDIO HELPERS ====================
  const playSound = (audioRef) => {
    if (audioRef?.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const playWinSoundWithDucking = (audioRef) => {
    if (!audioRef?.current) return;
    const activeBg = bonusBgMusic.current && !bonusBgMusic.current.paused ? bonusBgMusic.current : bgMusic.current;
    const origVol = activeBg?.volume || 0.3;
    if (activeBg && activeBg.volume > 0.06) activeBg.volume = 0.06;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});

    const startFadeIn = () => {
      const dur = audioRef.current.duration * 1000;
      const fadeStart = Math.max(0, dur - 2000);
      setTimeout(() => {
        if (!activeBg) return;
        let step = 0;
        const interval = setInterval(() => {
          step++;
          activeBg.volume = Math.min(0.06 + ((origVol - 0.06) / 20) * step, origVol);
          if (step >= 20) { clearInterval(interval); activeBg.volume = origVol; }
        }, 100);
      }, fadeStart);
    };

    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) startFadeIn();
    else audioRef.current.onloadedmetadata = startFadeIn;
    audioRef.current.onended = null;
  };

  const playSymbolFlipSound = (index) => {
    const audio = symbolFlipSounds.current[index % symbolFlipSounds.current.length];
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  };

  const toggleMusic = () => {
    const target = isBonusMode ? bonusBgMusic.current : bgMusic.current;
    const other = isBonusMode ? bgMusic.current : bonusBgMusic.current;
    if (!target) return;
    if (isMusicPlaying) {
      target.pause();
      if (other) other.pause();
      setIsMusicPlaying(false);
    } else {
      if (other) other.pause();
      target.play().catch(() => {});
      setIsMusicPlaying(true);
    }
  };

  const startMusicOnInteraction = () => {
    const target = isBonusMode ? bonusBgMusic.current : bgMusic.current;
    if (target && !isMusicPlaying) {
      target.play().catch(() => {});
      setIsMusicPlaying(true);
    }
  };

  const unlockAllSounds = () => {
    [reelStopSound, winSound, coinCollectSound, multiplierSound, cashInSound].forEach(s => {
      if (s.current) {
        const vol = s.current.volume;
        s.current.volume = 0;
        s.current.play().then(() => { s.current.pause(); s.current.currentTime = 0; s.current.volume = vol; }).catch(() => { s.current.volume = vol; });
      }
    });
  };

  // ==================== TRANSITION (flying symbols) ====================
  useEffect(() => {
    const imgs = SYMBOLS.map(sym => {
      const img = new Image();
      img.src = sym.src;
      return img;
    });
    symbolImagesRef.current = imgs;
  }, []);

  const generateParticles = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const symCount = SYMBOLS.length;
    const cols = 6;
    const rows = 5;
    const count = cols * rows;
    const cellW = w / cols;
    const cellH = h / rows;
    const size = Math.max(cellW, cellH) * 1.3;
    const particles = [];
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const targetX = col * cellW + cellW / 2 - size / 2 + (Math.random() * 20 - 10);
      const targetY = row * cellH + cellH / 2 - size / 2 + (Math.random() * 20 - 10);
      const isLeft = Math.random() > 0.5;
      const startX = isLeft ? -size - Math.random() * w * 0.5 : w + Math.random() * w * 0.5;
      const startY = targetY + (Math.random() * h * 0.3 - h * 0.15);
      particles.push({
        targetX, targetY, startX, startY, size,
        rotation: Math.random() * 30 - 15,
        delay: Math.random() * 500,
        duration: 1500,
        symbolIndex: Math.floor(Math.random() * symCount),
      });
    }
    particlesRef.current = particles;
  };

  useEffect(() => {
    if (!showTransition || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    handleResize();
    window.addEventListener('resize', handleResize);
    startTimeRef.current = performance.now();

    const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
    const easeInQuad = x => x * x;
    const imgs = symbolImagesRef.current;

    const animate = (timestamp) => {
      const elapsed = timestamp - startTimeRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const stage = transitionStage;

      for (const p of particlesRef.current) {
        let x, y, sc, rotation, opacity;
        if (stage === 'enter') {
          const pElapsed = elapsed - p.delay;
          if (pElapsed < 0) continue;
          let progress = Math.min(pElapsed / p.duration, 1);
          progress = easeOutCubic(progress);
          x = p.startX + (p.targetX - p.startX) * progress;
          y = p.startY + (p.targetY - p.startY) * progress;
          sc = 0.5 + 0.5 * progress;
          rotation = p.rotation * progress;
          opacity = 1;
        } else if (stage === 'drop') {
          let progress = Math.min(elapsed / 1200, 1);
          progress = easeInQuad(progress);
          x = p.targetX;
          y = p.targetY + window.innerHeight * 1.5 * progress;
          sc = 1;
          rotation = p.rotation + 60 * progress;
          opacity = 1 - progress;
        } else continue;

        const img = imgs[p.symbolIndex];
        if (!img || !img.complete) continue;

        ctx.save();
        ctx.translate(x + p.size / 2, y + p.size / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.scale(sc, sc);
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      if (showTransition) animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [showTransition, transitionStage]);

  // ==================== BONUS MODE ====================
  const toggleBonusMode = () => {
    if (showTransition) return;
    generateParticles();
    setShowTransition(true);
    setTransitionStage('enter');

    setTimeout(() => {
      const newMode = !isBonusMode;
      setIsBonusMode(newMode);
      if (newMode) { setFreeSpinsRemaining(15); freeSpinStarted.current = false; }
      else setFreeSpinsRemaining(0);

      bgMusic.current?.pause();
      bonusBgMusic.current?.pause();

      if (isMusicPlaying) {
        if (newMode) {
          if (bonusBgMusic.current) { 
            bonusBgMusic.current.currentTime = 0; 
            bonusBgMusic.current.play().catch(() => {}); 
          }
        } else {
          bgMusic.current?.play().catch(() => {});
        }
      }

      setTransitionStage('drop');
      startTimeRef.current = performance.now();

      setTimeout(() => {
        setShowTransition(false);
        setTransitionStage('idle');
      }, 1200);
    }, 2000);
  };

  // ==================== CASCADE ====================
  const handleCascade = (currentGrid, winningIndices, currentStep = 0, currentAccumulatedWin = 0) => {
    const remainingCounts = {};
    currentGrid.forEach((sym, idx) => {
      if (!winningIndices.includes(idx) && !sym.isMultiplier) {
        remainingCounts[sym.id] = (remainingCounts[sym.id] || 0) + 1;
      }
    });

    let bestSymId = null;
    let maxCount = 0;
    Object.entries(remainingCounts).forEach(([id, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestSymId = id;
      }
    });

    const isLucky = Math.random() < 0.3;
    
    let targetSymbolDef = null;
    if (isLucky && bestSymId) {
        targetSymbolDef = SYMBOLS.find(s => s.id === bestSymId);
    } else if (isLucky && maxCount === 0) {
         targetSymbolDef = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    }

    let newGrid = [...currentGrid];
    for (let col = 0; col < GRID_COLS; col++) {
      let keptCells = [];
      let winCount = 0;
      for (let row = 0; row < GRID_ROWS; row++) {
        const idx = row * GRID_COLS + col;
        if (!winningIndices.includes(idx)) {
          keptCells.push({ ...newGrid[idx], originalRow: row });
        } else winCount++;
      }
      
      const newSymbols = [];
      for (let i = 0; i < winCount; i++) {
          let sym;
          if (targetSymbolDef && Math.random() < 0.8) {
              sym = { ...targetSymbolDef, instanceId: Math.random(), isMultiplier: false };
          } else {
              sym = getRandomSymbol();
          }
          newSymbols.push({ ...sym, isNew: true });
      }
      
      const finalCol = [...newSymbols, ...keptCells];
      for (let row = 0; row < GRID_ROWS; row++) {
        const sym = finalCol[row];
        const dropRows = sym.isNew ? winCount : row - sym.originalRow;
        const { originalRow, isNew, ...clean } = sym;
        newGrid[row * GRID_COLS + col] = { ...clean, dropRows };
      }
    }

    setGrid(newGrid);
    setWinningCells([]);
    setCollectedMultiplierCells([]);
    setWinStage('idle');
    
    setTimeout(() => finishSpin(newGrid, true, currentStep, currentAccumulatedWin), isBonusMode ? 400 : 800);
  };

  // ==================== ANIMATED COUNTERS ====================
  useEffect(() => {
    if (displayCoins !== coins) {
      const diff = coins - displayCoins;
      const step = diff > 0 ? Math.max(1, Math.ceil(diff / 10)) : Math.min(-1, Math.floor(diff / 10));
      if (Math.abs(diff) < 5) setDisplayCoins(coins);
      else { const t = setTimeout(() => setDisplayCoins(p => p + step), 16); return () => clearTimeout(t); }
    }
  }, [coins, displayCoins]);

  useEffect(() => {
    if (displayPoin !== poin) {
      const diff = poin - displayPoin;
      const step = diff > 0 ? Math.max(1, Math.ceil(diff / 10)) : Math.min(-1, Math.floor(diff / 10));
      if (Math.abs(diff) < 5) setDisplayPoin(poin);
      else { const t = setTimeout(() => setDisplayPoin(p => p + step), 16); return () => clearTimeout(t); }
    }
  }, [poin, displayPoin]);

  useEffect(() => {
    if (displayWin !== winAmount) {
      const diff = winAmount - displayWin;
      const step = diff > 0 ? Math.max(1, Math.ceil(diff / 10)) : Math.min(-1, Math.floor(diff / 10));
      if (Math.abs(diff) < 5) setDisplayWin(winAmount);
      else { const t = setTimeout(() => setDisplayWin(p => p + step), 16); return () => clearTimeout(t); }
    }
  }, [winAmount, displayWin]);

  // ==================== RESPONSIVE ====================
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const landscape = w > h;
      setIsLandscape(landscape);
      if (landscape) {
        setScale(Math.min(w / 1024, h / 576));
      } else {
        setScale(Math.min(w / 751, 1));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ==================== AUTO SPIN ====================
  const autoSpinRef = useRef(null);
  const freeSpinAutoRef = useRef(null);

  // Auto spin (paid spins)
  useEffect(() => {
    const hasSpins = autoSpinActive && autoSpinCount > 0;
    if (hasSpins && !isSpinning && !winAnimationPlaying) {
      autoSpinRef.current = setTimeout(() => executeSpin(autoSpinPowerRef.current), 500);
    }
    // Drain only when everything is done: auto spin finished + no free spins left
    if (!isSpinning && !winAnimationPlaying) {
      if (autoSpinActive && autoSpinCount === 0 && freeSpinsRemaining === 0) {
        setAutoSpinActive(false);
        drainPowerBar();
        autoSpinPowerRef.current = 0;
      }
      // Manual free spins (no auto spin) - drain when last free spin finishes
      if (!autoSpinActive && freeSpinsRemaining === 0 && autoSpinPowerRef.current > 0 && autoSpinCount <= 0) {
        drainPowerBar();
        autoSpinPowerRef.current = 0;
      }
    }
    return () => { if (autoSpinRef.current) clearTimeout(autoSpinRef.current); };
  }, [autoSpinCount, autoSpinActive, isSpinning, winAnimationPlaying, freeSpinsRemaining]);

  // Free spin auto-trigger (bonus mode) - only after first manual spin
  useEffect(() => {
    if (freeSpinStarted.current && freeSpinsRemaining > 0 && !isSpinning && !winAnimationPlaying && !autoSpinActive) {
      freeSpinAutoRef.current = setTimeout(() => executeSpin(autoSpinPowerRef.current), 300);
    }
    return () => { if (freeSpinAutoRef.current) clearTimeout(freeSpinAutoRef.current); };
  }, [freeSpinsRemaining, isSpinning, winAnimationPlaying, autoSpinActive]);

  // ==================== SPIN LOGIC ====================
  const startCharging = (e) => {
    if (e.cancelable && e.type === 'touchstart') e.preventDefault();
    if (isSpinning || autoSpinActive) return;
    if (freeSpinsRemaining === 0 && coins < (Math.floor(bet / 10) * 10)) return;

    if (!hasUnlockedSounds.current) { unlockAllSounds(); hasUnlockedSounds.current = true; }
    
    if (chargeInterval.current) clearInterval(chargeInterval.current);
    if (drainInterval.current) clearInterval(drainInterval.current);
    
    setIsCharging(true);
    setPowerBar(1);
    
    chargeInterval.current = setInterval(() => {
      setPowerBar(prev => (prev >= 15 ? 15 : prev + 1));
    }, 100);
  };

  const stopCharging = (e) => {
    if (!isCharging) return;
    setIsCharging(false);
    if (chargeInterval.current) clearInterval(chargeInterval.current);
    
    setPowerBar(current => {
      lockedPower.current = current;
      return current;
    });
    setTimeout(() => handleSpin(lockedPower.current), 0);
  };

  const drainPowerBar = () => {
    if (drainInterval.current) clearInterval(drainInterval.current);
    drainInterval.current = setInterval(() => {
      setPowerBar(prev => {
        if (prev <= 0) {
          clearInterval(drainInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 80);
  };

  const handleSpin = (powerLevel = 0) => {
    if (!hasUnlockedSounds.current) { unlockAllSounds(); hasUnlockedSounds.current = true; }
    if (isSpinning || autoSpinActive) return;
    startMusicOnInteraction();

    if (freeSpinsRemaining > 0) {
      if (autoSpinPowerRef.current === 0) autoSpinPowerRef.current = powerLevel;
      freeSpinStarted.current = true;
      executeSpin(autoSpinPowerRef.current || powerLevel);
      return;
    }

    const spins = Math.floor(bet / 10);
    const cost = spins * 10;
    if (coins < cost) return;
    setCoins(p => p - cost);

    if (username) {
      processTransaction(username, 'bet', cost, `bet-${Date.now()}`).then(res => {
        if (res?.success) window.parent.postMessage({ type: 'BALANCE_UPDATE' }, '*');
      });
    }

    autoSpinPowerRef.current = powerLevel;
    setAutoSpinCount(spins);
    setAutoSpinActive(true);
    executeSpin(powerLevel);
  };

  const executeSpin = (powerLevel = 0) => {
    if (isSpinning) return;
    if (freeSpinsRemaining > 0) setFreeSpinsRemaining(p => p - 1);
    else setAutoSpinCount(p => p - 1);

    playSound(spinSound);
    setIsSpinning(true);
    setWinAmount(0); setDisplayWin(0); setWinningCells([]); setWinStage('idle');
    setShowWinValues(false); setGridCoins([]); setShowCoinBurst(false);
    setMultiplierPopUp(false); setMultiplierFlyingDown(false); setMultiplierFadingIn(false);
    setCascadeStep(0);
    setIsMultiplying(false); setBaseWin(0); setDisplayMultiplier(0);
    setWinAnimationPlaying(false); setCollectedMultiplierCells([]);
    setRevealedRows(0); setRevealedColCount(0);

    const usedLuck = powerLevel > 0 ? powerLevel : Math.floor(Math.random() * 12) + 3;
    if (powerLevel === 0) setPowerBar(usedLuck);

    let finalGrid = Array.from({ length: TOTAL_CELLS }, () => getRandomSymbol());
    if (Math.random() < WIN_RATE) {
      const winSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const winCount = Math.floor(Math.random() * 5) + 8;
      const indices = new Set();
      while (indices.size < winCount) indices.add(Math.floor(Math.random() * TOTAL_CELLS));
      indices.forEach(idx => { finalGrid[idx] = { ...winSym, instanceId: Math.random() }; });
    }

    setFinalGridResult(finalGrid);
    setStoppedCols(0);
    setLandedCols(new Set());

    landedCleanupTimers.current.forEach(tid => clearTimeout(tid));
    landedCleanupTimers.current = [];

    const fast = isBonusMode;
    const spinDuration = fast ? 300 : 600;
    const colDelays = fast ? [75, 90, 110, 135, 165, 200] : [150, 180, 220, 270, 330, 400];

    for (let i = 0; i < GRID_COLS; i++) {
      const delay = spinDuration + colDelays.slice(0, i + 1).reduce((a, b) => a + b, 0);
      setTimeout(() => {
        setStoppedCols(p => p + 1);
        setLandedCols(prev => new Set([...prev, i]));
        playSound(reelStopSound);
        setGrid(prev => {
          const g = [...prev];
          for (let row = 0; row < GRID_ROWS; row++) g[row * GRID_COLS + i] = finalGrid[row * GRID_COLS + i];
          return g;
        });
        const tid = setTimeout(() => setLandedCols(prev => {
          const next = new Set(prev);
          next.delete(i);
          return next;
        }), 500);
        landedCleanupTimers.current.push(tid);
      }, delay);
    }

    const totalTime = spinDuration + colDelays.reduce((a, b) => a + b, 0) + (fast ? 400 : 800);
    setTimeout(() => finishSpin(finalGrid, false, 0, 0), totalTime);
  };

  const finishSpin = (finalGrid, isCascade = false, inputStep = 0, currentAccumulatedWin = 0) => {
    setGrid(finalGrid);
    if (!isCascade) {
      setIsSpinning(false);
      setRevealedRows(5);
      setRevealedColCount(GRID_COLS);
      setCascadeStep(0);
    }

    const counts = {};
    const indices = {};

    finalGrid.forEach((sym, idx) => {
      if (!sym.isMultiplier) {
        counts[sym.id] = (counts[sym.id] || 0) + 1;
        if (!indices[sym.id]) indices[sym.id] = [];
        indices[sym.id].push(idx);
      }
    });

    let spinWin = 0;
    let newWinCells = [];

    Object.entries(counts).forEach(([id, count]) => {
      if (count >= MIN_WIN_COUNT) {
        const def = SYMBOLS.find(s => s.id === id);
        spinWin += count * (def?.value || 0);
        newWinCells = [...newWinCells, ...indices[id]];
      }
    });

    if (spinWin > 0) {
      const currentStep = isCascade ? Math.min(inputStep + 1, CASCADE_MULTIPLIERS.length - 1) : 0;
      setCascadeStep(currentStep);
      
      const activeMult = CASCADE_MULTIPLIERS[currentStep];
      const baseAmount = spinWin;
      const finalAmount = spinWin * activeMult;
      
      const newTotal = currentAccumulatedWin + finalAmount;

      const fast = isBonusMode;

      playWinSoundWithDucking(youWinSound); 
      setWinAnimationPlaying(true);
      setBaseWin(baseAmount);
      setWinningCells(newWinCells);

      setWinStage('highlight');

      setShowLightning(true);
      setLightningKey(k => k + 1);
      setTimeout(() => setLightningKey(k => k + 1), 200);
      setTimeout(() => setLightningKey(k => k + 1), 400);
      setTimeout(() => setShowLightning(false), 600);

      const highlightDur = fast ? 750 : 1500;

      setTimeout(() => {
          setWinStage('reveal');
          for (let i = 0; i < Math.min(newWinCells.length, 3); i++)
          setTimeout(() => playSymbolFlipSound(i), i * (fast ? 75 : 150));
      }, highlightDur);

      const coinsDelay = highlightDur + (fast ? 400 : 1000); 

      if (activeMult > 1) {
          setTimeout(() => {
              playSound(multiplierSound);
              setMultiplierPopUp(true);
              setDisplayMultiplier(activeMult);
          }, fast ? 500 : 1000); 
      }

      setTimeout(() => {
          setWinStage('collect');
          playSound(coinCollectSound);
          setTimeout(() => playSound(cashInSound), fast ? 100 : 200);

          const coinSpawns = newWinCells.map((ci, i) => {
          const col = ci % GRID_COLS, row = Math.floor(ci / GRID_COLS);
          const cx = col * 102 + 95 / 2;
          const cy = row * 97 + 90 / 2;
          return { id: Date.now() + ci, cellIndex: ci, col, row, targetX: 280 - cx, targetY: -(cy + 87 + 50), delay: i * (fast ? 15 : 30) };
          });
          setGridCoins(coinSpawns);

          setTimeout(() => { 
              setShowCoinBurst(true); 
              setWinAmount(newTotal);
          }, fast ? 300 : 600);

          setTimeout(() => {
          setGridCoins([]); setShowCoinBurst(false);
          
          setWinStage('completed'); 
          handleCascade(finalGrid, newWinCells, currentStep, newTotal); 
          }, fast ? 400 : 800);
      }, coinsDelay);

    } else {
      if (currentAccumulatedWin > 0) {
        
        const finalMultStep = isCascade ? inputStep : 0; 
        const finalMult = CASCADE_MULTIPLIERS[finalMultStep];
        const finalTotalWin = currentAccumulatedWin * finalMult;
        const fast = isBonusMode;
        
        const finishSequence = () => {
            playSound(cashInSound);
            const bal = [];
            for (let i = 0; i < 8; i++) bal.push({ id: Date.now() + 200 + i, stage: 'toBalance', delay: i * (fast ? 30 : 60) });
            setFlyingCoins(bal);
            
            if (username) processTransaction(username, 'win', finalTotalWin, `win-${Date.now()}`).then(r => { if (r?.success) window.parent.postMessage({ type: 'BALANCE_UPDATE' }, '*'); });
    
            const total = finalTotalWin;
            const dec = Math.ceil(total / 8);
            for (let i = 0; i < 8; i++) setTimeout(() => setWinAmount(p => Math.max(0, p - dec)), i * (fast ? 30 : 60));
            const inc = Math.ceil(total / 8);
            for (let i = 0; i < 8; i++) setTimeout(() => { setPoin(p => p + inc); }, i * (fast ? 30 : 60) + (fast ? 200 : 400));
    
            setTimeout(() => { 
                setFlyingCoins([]); 
                setWinAmount(0); 
                setAccumulatedWin(0); 
                setWinAnimationPlaying(false); 
                setMultiplierPopUp(false);
                setMultiplierFadingIn(false);
            }, fast ? 700 : 1500);
            setDisplayMultiplier(0);
            setCascadeStep(0);
        };

        if (finalMult > 1) {
            setMultiplierPopUp(true);
            setDisplayMultiplier(finalMult);
            setIsMultiplying(true);
            
            setTimeout(() => {
                setMultiplierFlyingDown(true);
                setMultiplierPopUp(false);
                
                setTimeout(() => {
                     setMultiplierFlyingDown(false);
                     setIsMultiplying(false);
                     setDisplayMultiplier(0);
                     
                     setWinAmount(finalTotalWin);
                     playWinSoundWithDucking(winSound);
                     
                     setTimeout(() => {
                         finishSequence();
                     }, fast ? 400 : 800);
                }, fast ? 350 : 700);
            }, fast ? 250 : 500);
        } else {
             playWinSoundWithDucking(winSound);
             finishSequence();
        }

      } else {
         setWinAnimationPlaying(false);
         setDisplayMultiplier(0);
         setCascadeStep(0);
      }
    }
  };

  // ==================== LUCKY BAR COMPONENT ====================
  const renderLuckyBar = () => {
    const activeCount = powerBar;
    
    return (
      <div className="relative" style={{ width: '219px', height: '65px' }}>
        <img src={ASSETS.luckyBarBg} alt="" className="absolute inset-0 w-full h-full object-contain" />
        
        {/* Passive Segments */}
        {LUCKY_BAR_PASSIVE.map((src, i) => (
          <div
            key={`passive-${i}`}
            className="absolute"
            style={{
              top: LUCKY_BAR_POSITIONS_PASSIVE[i].top,
              right: LUCKY_BAR_POSITIONS_PASSIVE[i].right,
              bottom: LUCKY_BAR_POSITIONS_PASSIVE[i].bottom,
              left: LUCKY_BAR_POSITIONS_PASSIVE[i].left,
            }}
          >
            <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ))}

        {/* Active Segments */}
        {LUCKY_BAR_ACTIVE.map((src, i) => {
            if (i >= activeCount) return null;
            return (
              <div
                key={`active-${i}`}
                className="absolute"
                style={{
                  top: LUCKY_BAR_POSITIONS_ACTIVE[i].top,
                  right: LUCKY_BAR_POSITIONS_ACTIVE[i].right,
                  bottom: LUCKY_BAR_POSITIONS_ACTIVE[i].bottom,
                  left: LUCKY_BAR_POSITIONS_ACTIVE[i].left,
                }}
              >
                <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            );
        })}
      </div>
    );
  };

  // ==================== RENDER ====================
  const spinsCount = Math.floor(bet / 10);
  const totalCost = spinsCount * 10;
  const progressPercent = ((bet - MIN_BET) / (MAX_BET - MIN_BET)) * 100;
  const canSpin = coins >= totalCost;

  // ==================== LANDSCAPE VIEW ====================
  if (isLandscape) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden landscape-mode bg-black flex items-center justify-center" onContextMenu={e => e.preventDefault()}>
        {showTransition && (
          <canvas ref={canvasRef} className="fixed inset-0 z-[9999] pointer-events-none w-full h-full" style={{ touchAction: 'none' }} />
        )}

        {/* Lightning flash overlay */}
        {showLightning && <div key={lightningKey} className="lightning-overlay flash" />}

        {/* Game Frame */}
        <div className="relative overflow-hidden" style={{ width: 'min(100vw, calc(100vh * 1336 / 753))', height: 'min(100vh, calc(100vw * 753 / 1336))' }}>
          {/* Background */}
          <img src={ASSETS.backgroundLandscape} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

          {/* ===== TOP BAR ===== */}
          <div className="absolute top-[1%] left-[1%] right-[1%] flex items-center justify-between z-20">
            {/* Balance */}
            <div className="flex items-center gap-[1vw]">
              <div className="relative" style={{ width: 'clamp(100px, 14vw, 200px)', height: 'clamp(30px, 5vh, 55px)' }}>
                <img src={ASSETS.displaySaldo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <p className="absolute inset-0 flex items-center justify-center font-inter font-black text-[#fff200]" style={{ fontSize: 'clamp(12px, 2vw, 24px)', paddingLeft: '25%' }}>
                  {displayPoin.toLocaleString()}
                </p>
              </div>
              <div className="relative" style={{ width: 'clamp(100px, 14vw, 200px)', height: 'clamp(30px, 5vh, 55px)' }}>
                <img src={ASSETS.displayTiket} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <p className="absolute inset-0 flex items-center justify-center font-inter font-black text-[#fff200]" style={{ fontSize: 'clamp(12px, 2vw, 24px)', paddingLeft: '25%' }}>
                  {displayCoins.toLocaleString()}
                </p>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex items-center gap-[1vw]">
              <div className="relative cursor-pointer icon-btn-touch" style={{ width: 'clamp(28px, 4vw, 50px)', height: 'clamp(28px, 4vw, 50px)' }} onClick={() => setShowTutorial(true)}>
                <img src={ASSETS.buttonInfo} alt="info" className="w-full h-full object-contain" />
              </div>
              <div className="relative cursor-pointer icon-btn-touch" style={{ width: 'clamp(28px, 4vw, 50px)', height: 'clamp(28px, 4vw, 50px)' }} onClick={() => setShowDropdown(prev => !prev)}>
                <img src={ASSETS.buttonMenu} alt="menu" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Dropdown Menu (landscape) */}
          {showDropdown && (
            <div className="absolute z-50" style={{ top: 'clamp(40px, 7vh, 65px)', right: '1%', width: 'clamp(60px, 8vw, 110px)', height: 'clamp(130px, 20vh, 230px)' }}>
              <img src={ASSETS.dropdownBg} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
              <div className="absolute cursor-pointer" style={{ top: '8%', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '18%' }} onClick={() => setShowDropdown(false)}>
                <img src={ASSETS.buttonClose} alt="close" className="w-full h-full object-contain" />
              </div>
              <div className="absolute cursor-pointer" style={{ top: '35%', left: '50%', transform: 'translateX(-50%)', width: '50%', height: '18%' }} onClick={toggleMusic}>
                <img src={isMusicPlaying ? ASSETS.volumeOn : ASSETS.volumeOff} alt="volume" className="w-full h-full object-contain" />
              </div>
              <div className="absolute cursor-pointer" style={{ top: '62%', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '16%' }} onClick={() => { setShowDropdown(false); handleSpin(); }}>
                <img src={ASSETS.buttonAutoSpin} alt="auto spin" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* ===== LEFT PANEL: Multiplier + Bonus ===== */}
          <div className="absolute left-[0.5%] top-[12%] flex flex-col items-center justify-between z-10" style={{ width: '13%', height: '76%', paddingTop: '2vh', paddingBottom: '2vh' }}>
            {/* Total Multiplier */}
            <div className={`text-center ${multiplierReceiving ? 'animate-multiplier-receive' : ''}`}>
              <div className="text-[#fff200] font-inter font-black leading-tight" style={{ fontSize: 'clamp(8px, 1.5vw, 14px)', textShadow: '0 2px 2px rgba(0,0,0,0.5)' }}>
                <p>TOTAL</p>
                <p>MULTIPLIER</p>
              </div>
              <p className={`font-inter font-black text-[#fff200] mt-[1vh] ${multiplierFlyingDown ? 'animate-multiplier-fly-to-win-landscape' : (multiplierFadingIn ? 'animate-multiplier-fade-in' : (multiplierPopUp ? 'animate-multiplier-pop-up' : (displayMultiplier > 0 ? 'animate-multiplier-shimmer' : '')))}`}
                style={{ fontSize: 'clamp(20px, 4vw, 40px)', textShadow: '0 4px 4px rgba(0,0,0,0.5)', '--target-x': '35vw', '--target-y': '-10vh' }}>
                {displayMultiplier > 0 ? `${displayMultiplier}x` : '0x'}
              </p>
            </div>

            {/* Bonus Mode Button */}
            <div className="relative cursor-pointer bonus-btn-touch w-full" onClick={toggleBonusMode}>
              <div className="relative w-full" style={{ aspectRatio: '2.5/1' }}>
                <img src={ASSETS.bonusMode} alt="Bonus" className="absolute inset-0 w-full h-full object-contain" />
                <div className="absolute inset-0 flex flex-col items-center justify-center pb-[2%]">
                  <p className="font-inter font-black text-white text-center leading-tight" style={{ fontSize: 'clamp(8px, 1.2vw, 12px)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{isBonusMode ? 'BERHENTI' : 'MAINKAN'}</p>
                  <p className="font-inter font-black text-white text-center leading-tight" style={{ fontSize: 'clamp(8px, 1.2vw, 12px)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>MODE BONUS</p>
                  <p className="font-inter font-black text-[#fff200] text-center" style={{ fontSize: 'clamp(12px, 2vw, 20px)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    {isBonusMode ? freeSpinsRemaining : '1.000'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== CENTER: Slot Grid ===== */}
          {(() => {
            const centerScale = Math.min(
              (window.innerHeight * 0.88) / 660,
              (window.innerWidth * 0.58) / 622
            );
            return (
              <div className="absolute z-10 flex items-center justify-center" style={{ left: '13%', top: '0', width: '58%', height: '100%' }}>
                <div style={{ width: 622 * centerScale, height: 660 * centerScale, position: 'relative', overflow: 'visible' }}>
                  <div className="origin-top-left" style={{ width: '622px', transform: `scale(${centerScale})` }}>
                    {/* Win Amount Display */}
                    <div className="relative z-10 mb-2 flex items-center justify-center" style={{ width: '622px', height: '100px' }}>
                      <div className={`relative flex items-center justify-center ${isMultiplying ? 'animate-multiply-effect' : ''}`} style={{ width: '318px', height: '100px' }}>
                        <img src={ASSETS.displayWin} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
                        <p className={`relative font-inter font-black text-[#fff200] text-[36px] text-center ${showCoinBurst ? 'animate-coin-absorb' : ''} ${displayWin > 0 ? 'animate-pop' : ''}`} style={{ textShadow: '0 4px 8px rgba(0,0,0,0.5)', marginTop: '14px' }}>
                          {displayWin > 0 ? displayWin.toLocaleString() : '0'}
                        </p>
                      </div>
                      {flyingCoins.filter(c => c.stage === 'toBalance').map(coin => (
                        <div key={coin.id} className="flying-coin animate-coin-win-to-balance-landscape" style={{ animationDelay: `${coin.delay}ms`, left: '50%', top: '50%' }}>
                          <div className="w-full h-full rounded-full bg-yellow-400 border-2 border-yellow-600 shadow-lg" />
                        </div>
                      ))}
                    </div>

                    {/* Slot Reels */}
                    <div className={`relative ${winStage === 'highlight' ? 'animate-shake' : ''}`} style={{ width: '622px' }}>
                      <div className="flex gap-[12px]" style={{ height: '500px', padding: '10px' }}>
                        {Array.from({ length: GRID_COLS }).map((_, colIndex) => {
                          const isColSpinning = isSpinning && colIndex >= stoppedCols;
                          const columnSymbols = Array.from({ length: GRID_ROWS }).map((_, rowIndex) => {
                            const gridIndex = rowIndex * GRID_COLS + colIndex;
                            return { symbol: grid[gridIndex], index: gridIndex };
                          });
                          const spinStrip = Array.from({ length: 20 }, (_, i) =>
                            SYMBOLS[(i * 3 + colIndex * 7) % SYMBOLS.length]
                          );

                          return (
                            <div key={`col-${colIndex}`} className={`col-${colIndex} reel-col`}>
                              <div className="reel-strip is-spinning" style={{ '--spin-start': '-75%', display: isColSpinning ? '' : 'none' }}>
                                {spinStrip.map((sym, i) => (
                                  <div key={`spin-${colIndex}-${i}`} className="reel-sym" style={{ height: '88px' }}>
                                    <img src={sym.src} alt={sym.id} />
                                  </div>
                                ))}
                              </div>
                              <div className="reel-strip" style={{ position: 'relative', top: '0', display: isColSpinning ? 'none' : '' }}>
                                {columnSymbols.map(({ symbol, index }, rowIndex) => {
                                  const isWinning = winningCells.includes(index);
                                  const isMultiplierCell = symbol.isMultiplier;
                                  const isAnimating = isWinning || (isMultiplierCell && winStage !== 'idle');
                                  const winIndex = isWinning ? winningCells.indexOf(index) : (isMultiplierCell ? winningCells.length : -1);
                                  const staggerDelay = winIndex >= 0 ? `${winIndex * 0.1}s` : '0s';
                                  const isMultiplierFlying = flyingGridMultipliers.some(m => m.cellIndex === index);
                                  const isMultiplierCollected = collectedMultiplierCells.includes(index);

                                  return (
                                    <div
                                      key={index}
                                      className={`reel-sym ${landedCols.has(colIndex) ? 'reel-sym-land' : ''} ${isAnimating ? 'z-20' : 'z-0'} ${(isMultiplierFlying || isMultiplierCollected) ? 'opacity-0' : ''}`}
                                      style={{
                                        height: '88px',
                                        marginBottom: rowIndex < GRID_ROWS - 1 ? '15px' : '0',
                                        animationDelay: landedCols.has(colIndex) ? `${rowIndex * 0.07}s` : '0s',
                                      }}
                                    >
                                      {isAnimating ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                          <div
                                            className={`absolute inset-0 flex items-center justify-center ${winStage === 'highlight' ? 'animate-win-pulse' : ''} ${(winStage === 'reveal' || winStage === 'collect' || winStage === 'completed') ? 'animate-symbol-out' : ''}`}
                                            style={{ animationDelay: (winStage === 'reveal' || winStage === 'collect') ? staggerDelay : '0s' }}
                                          >
                                            <img src={symbol.src} alt={symbol.id} className="w-full h-full object-contain" />
                                          </div>
                                          {winStage === 'highlight' && <div className="symbol-lightning" />}
                                          {(winStage === 'reveal' || winStage === 'collect' || winStage === 'completed') && (
                                            <div
                                              className={`absolute inset-0 flex items-center justify-center z-10 ${winStage === 'reveal' ? 'animate-coin-in' : ''} ${winStage === 'collect' && !isMultiplierCell ? 'animate-fly-up' : ''}`}
                                              style={{ animationDelay: staggerDelay }}
                                            >
                                              <span className="symbol-value" style={{ fontSize: '24px' }}>
                                                {symbol.isMultiplier ? `${symbol.multiplier}x` : `+${symbol.value}`}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <img
                                          src={symbol.src}
                                          alt={symbol.id}
                                          className={`${symbol.dropRows > 0 ? 'animate-cascade-drop' : ''}`}
                                          style={symbol.dropRows > 0 ? { '--drop-rows': symbol.dropRows } : {}}
                                        />
                                      )}

                                      {symbol.isMultiplier && !isMultiplierCollected && !isMultiplierFlying && (
                                        <div className="absolute -top-1 -right-1 bg-red-700 text-yellow-300 text-xs font-black px-1 rounded shadow-lg border border-red-400">
                                          {symbol.multiplier}x
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Flying multipliers from grid */}
                      {flyingGridMultipliers.map(fm => {
                        const col = fm.cellIndex % GRID_COLS;
                        const row = Math.floor(fm.cellIndex / GRID_COLS);
                        const colWidth = 100 / GRID_COLS;
                        const startXPercent = col * colWidth + colWidth / 2;
                        const startYPercent = (row / GRID_ROWS) * 100 + (100 / GRID_ROWS / 2);
                        const targetX = -(22.5 + startXPercent * 0.55 - 8);
                        const targetY = -20 - row * 8;
                        return (
                          <div key={fm.id} className="flying-multiplier-grid animate-multiplier-fly-from-grid absolute" style={{ animationDelay: `${fm.delay}ms`, left: `${startXPercent}%`, top: `${startYPercent}%`, transform: 'translate(-50%, -50%)', '--target-x': `${targetX}vw`, '--target-y': `${targetY}vh`, zIndex: 1000 }}>
                            <div className="w-[50px] h-[50px] rounded-full bg-red-700 border-2 border-red-400 flex items-center justify-center shadow-lg">
                              <span className="text-yellow-300 font-black text-lg">{fm.multiplier}x</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Free Spin Display - with CSS mask clip path */}
                    <div className="relative mt-4" style={{ width: '434px', height: '66px', margin: '16px auto 0' }}>
                      <img src={ASSETS.displayFreeSpin} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      {/* Masked freespin progress bar - clipPath approach */}
                      <div
                        className="absolute overflow-hidden"
                        style={{
                          left: '6%', top: '19%', width: '88%', height: '49%',
                          WebkitMaskImage: `url(${ASSETS.freespinMask})`,
                          maskImage: `url(${ASSETS.freespinMask})`,
                          WebkitMaskSize: '100% 100%',
                          maskSize: '100% 100%',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                        }}
                      >
                        <img
                          src={ASSETS.progressBarFreeSpin}
                          alt=""
                          className="absolute top-0 left-0 w-full h-full object-cover transition-all duration-500 ease-out"
                          style={{ clipPath: `inset(0 ${100 - (freeSpinsRemaining > 0 ? (freeSpinsRemaining / 15) * 100 : (spinsCount > 0 ? 100 : 0))}% 0 0)` }}
                        />
                      </div>
                      <p className="absolute font-inter font-black text-[24px] text-center text-white" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        {freeSpinsRemaining > 0 ? (
                          <><span className="text-[#fff200]">{freeSpinsRemaining}</span> Spin gratis tersisa</>
                        ) : (
                          <>FREE SPIN</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ===== RIGHT PANEL: Spin + Bet (matches portrait Figma container_spin 429x404) ===== */}
          {(() => {
            const rightScale = Math.min(
              (window.innerWidth * 0.26) / 429,
              (window.innerHeight * 0.82) / 404
            );
            return (
              <div className="absolute z-10 flex items-center justify-center" style={{ right: '0.5%', top: '12%', width: '28%', height: '88%' }}>
                <div style={{ width: 429 * rightScale, height: 404 * rightScale, position: 'relative' }}>
                  <div className="origin-top-left" style={{ width: '429px', height: '404px', transform: `scale(${rightScale})` }}>
                    {/* Power Bar - Figma y:0, x:84, 261x84 */}
                    <div className="absolute" style={{ left: '84px', top: '0', width: '261px', height: '84px' }}>
                      <img src={ASSETS.luckyBarBg} alt="" className="absolute object-contain" style={{ left: '0', top: '13.5%', width: '100%', height: '86.7%' }} />
                      <div
                        className="absolute overflow-hidden"
                        style={{
                          left: '0.8%', top: '0', width: '97%', height: '94%',
                          WebkitMaskImage: `url(${ASSETS.powerBarMask})`,
                          maskImage: `url(${ASSETS.powerBarMask})`,
                          WebkitMaskSize: '100% 100%',
                          maskSize: '100% 100%',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                        }}
                      >
                        <img
                          src={ASSETS.powerBarActive}
                          alt=""
                          className="absolute top-0 left-0 w-full h-full object-cover transition-all duration-100 ease-out"
                          style={{ clipPath: `inset(0 ${100 - (powerBar / 15) * 100}% 0 0)` }}
                        />
                      </div>
                    </div>

                    {/* Spin Button - Figma y:105, x:123.5, 182x182 */}
                    <div
                      className={`absolute cursor-pointer spin-btn-touch ${(!canSpin && freeSpinsRemaining === 0) ? 'opacity-50' : ''}`}
                      onMouseDown={startCharging}
                      onMouseUp={stopCharging}
                      onMouseLeave={stopCharging}
                      onTouchStart={startCharging}
                      onTouchEnd={stopCharging}
                      onDragStart={e => e.preventDefault()}
                      onSelectCapture={e => e.preventDefault()}
                      style={{ left: '123.5px', top: '105px', width: '182px', height: '182px' }}
                    >
                      <img src={ASSETS.spinButton} alt="SPIN" draggable="false" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" />
                    </div>

                    {/* Progress bar area - Figma y:309, 429x95 */}
                    <div className="absolute" style={{ left: '0', top: '309px', width: '429px', height: '95px' }}>
                      {/* Bet Info text */}
                      <p className="absolute font-inter font-black text-[26px] text-center text-white" style={{ left: '48px', top: '0', width: '333px', lineHeight: '31px' }}>
                        {autoSpinActive ? (
                          <><span className="text-[#fff200] animate-pulse">AUTO SPIN</span> - <span className="text-[#fff200]">{autoSpinCount}</span> spin tersisa</>
                        ) : (
                          <><span className="text-[#fff200]">{totalCost} Poin</span> terpakai (<span className="text-[#fff200]">{spinsCount} spin</span>)</>
                        )}
                      </p>
                      {/* Background bar */}
                      <img src={ASSETS.progressBarBg} alt="" className="absolute pointer-events-none" style={{ left: '0', top: '50px', width: '429px', height: '45px' }} />
                      {/* Masked fill */}
                      <div
                        className="absolute overflow-hidden"
                        style={{
                          left: '26px', top: '60px', width: '381px', height: '18px',
                          WebkitMaskImage: `url(${ASSETS.progressBarMask})`,
                          maskImage: `url(${ASSETS.progressBarMask})`,
                          WebkitMaskSize: '381px 18px',
                          maskSize: '381px 18px',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: '0 0',
                          maskPosition: '0 0',
                        }}
                      >
                        <img src={ASSETS.progressBar} alt="" className="absolute top-0 left-0 h-full object-cover pointer-events-none" style={{ width: '381px', clipPath: `inset(0 ${100 - progressPercent}% 0 0)` }} />
                      </div>
                      {/* Slider thumb */}
                      <div className="absolute pointer-events-none z-20" style={{ left: `${26 + (progressPercent / 100) * 329}px`, top: '44px', width: '52px', height: '51px', transform: 'translateX(-50%)' }}>
                        <img src={ASSETS.slider} alt="" className="w-full h-full object-contain" />
                      </div>
                      {/* Max label */}
                      <p className="absolute font-inter font-black text-[#fff200] text-[20px] text-center pointer-events-none" style={{ left: '354px', top: '57px', width: '43px', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Max</p>
                      {/* Hidden range input */}
                      <input type="range" min={MIN_BET} max={MAX_BET} step={BET_STEP} value={bet} onChange={e => setBet(Number(e.target.value))} className="absolute opacity-0 cursor-pointer z-10" disabled={isSpinning || autoSpinActive} style={{ left: '0', top: '44px', width: '429px', height: '51px', touchAction: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Tutorial */}
        {showTutorial && renderTutorial()}
      </div>
    );
  }

  // ==================== PORTRAIT VIEW ====================
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden portrait-mode bg-black flex justify-center" onContextMenu={e => e.preventDefault()}>
      {/* Transition Overlay */}
      {showTransition && (
        <canvas ref={canvasRef} className="fixed inset-0 z-[9999] pointer-events-none w-full h-full" style={{ touchAction: 'none' }} />
      )}

      {/* Lightning flash overlay */}
      {showLightning && <div key={lightningKey} className="lightning-overlay flash" />}

      <div
        style={{
          width: 751 * scale,
          height: Math.min(1335 * scale, window.innerHeight),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="relative origin-top-left"
          style={{
            width: '751px',
            height: '1335px',
            transform: `scale(${scale})`,
          }}
        >
        {/* Background */}
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <img src={ASSETS.background} alt="" className="w-full h-full object-cover" />
        </picture>

        {/* ===== HEADER ===== */}
        <div className="absolute flex items-center gap-4" style={{ top: '9px', left: '17px', right: '17px' }}>
          {/* Balance */}
          <div className="relative" style={{ width: '197px', height: '61px' }}>
            <img src={ASSETS.displaySaldo} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <p className="absolute font-inter font-black text-[#fff200] text-[30px] text-right" style={{ right: '15px', top: '12px' }}>
              {displayPoin.toLocaleString()}
            </p>
          </div>

          {/* Tiket/Koin */}
          <div className="relative" style={{ width: '198px', height: '61px' }}>
            <img src={ASSETS.displayTiket} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <p className="absolute font-inter font-black text-[#fff200] text-[30px] text-center" style={{ left: '60px', top: '12px' }}>
              {displayCoins.toLocaleString()}
            </p>
          </div>

          <div className="flex-1" />

          {/* Info Button */}
          <div className="relative cursor-pointer icon-btn-touch" style={{ width: '50px', height: '60px' }} onClick={() => setShowTutorial(true)}>
            <img src={ASSETS.buttonInfo} alt="info" className="w-full h-full object-contain" />
          </div>

          {/* Menu Button */}
          <div className="relative cursor-pointer icon-btn-touch" style={{ width: '50px', height: '60px' }} onClick={() => setShowDropdown(prev => !prev)}>
            <img src={ASSETS.buttonMenu} alt="menu" className="w-full h-full object-contain" />
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute z-50" style={{ top: '65px', right: '17px', width: '110px', height: '230px' }}>
              <img src={ASSETS.dropdownBg} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
              <div className="absolute cursor-pointer" style={{ top: '8%', left: '50%', transform: 'translateX(-50%)', width: '48px', height: '48px' }} onClick={() => setShowDropdown(false)}>
                <img src={ASSETS.buttonClose} alt="close" className="w-full h-full object-contain" />
              </div>
              <div className="absolute cursor-pointer" style={{ top: '35%', left: '50%', transform: 'translateX(-50%)', width: '58px', height: '48px' }} onClick={toggleMusic}>
                <img src={isMusicPlaying ? ASSETS.volumeOn : ASSETS.volumeOff} alt="volume" className="w-full h-full object-contain" />
              </div>
              <div className="absolute cursor-pointer" style={{ top: '62%', left: '50%', transform: 'translateX(-50%)', width: '48px', height: '40px' }} onClick={() => { setShowDropdown(false); handleSpin(); }}>
                <img src={ASSETS.buttonAutoSpin} alt="auto spin" className="w-full h-full object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* ===== SIDEBAR: MULTIPLIER + BONUS ===== */}
        <div className="absolute flex flex-col justify-between" style={{ left: '20px', top: '94px', width: '192px', height: '900px' }}>
          {/* Total Multiplier */}
          <div className={`font-inter font-black text-center ${multiplierReceiving ? 'animate-multiplier-receive' : ''}`}>
            <div className="text-white text-[20px] leading-tight" style={{ textShadow: '0 2px 2px rgba(0,0,0,0.25)' }}>
              <p className="mb-0">TOTAL</p>
              <p>MULTIPLIER</p>
            </div>
            <p className="text-[#fff200] text-[46px]" style={{ textShadow: '0 4px 4px rgba(0,0,0,0.25)' }}>
              {displayMultiplier > 0 ? `${displayMultiplier}x` : '0x'}
            </p>
            {multiplierFlyingDown && (
              <div className="flying-multiplier-text animate-multiplier-fly-to-win" style={{ left: '50%', top: '80px' }}>
                {displayMultiplier}x
              </div>
            )}
            {multiplierFadingIn && (
              <p className="text-[#fff200] text-[46px] animate-multiplier-fade-in absolute left-1/2" style={{ top: '78px', textShadow: '0 4px 4px rgba(0,0,0,0.25)' }}>
                0x
              </p>
            )}
          </div>

          {/* Promotion Bubble */}
          <div className="absolute" style={{ right: '-270px', top: '-10px', width: '231px', height: '126px' }}>
            <img src={ASSETS.bubbleText} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute font-inter font-semibold text-[24px] text-black text-center" style={{ left: '50%', top: '25px', transform: 'translateX(-50%)', width: '152px', textShadow: '0 2px 2px rgba(0,0,0,0.25)' }}>
              <p className="mb-0">Main dan</p>
              <p>Menangkan!</p>
            </div>
          </div>

          {/* Bonus Mode Button */}
          <div className="relative bonus-btn-touch cursor-pointer" onClick={toggleBonusMode} style={{ width: '192px', height: '149px' }}>
            <img src={ASSETS.bonusMode} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute font-inter font-black text-center" style={{ left: '50%', top: '41px', transform: 'translateX(-50%)' }}>
              <div className="text-white text-[20px] whitespace-nowrap leading-tight">
                <p className="mb-0">{isBonusMode ? 'BERHENTI' : 'MAINKAN'}</p>
                <p>MODE BONUS</p>
              </div>
              <p className="text-[#fff200] text-[36px] mt-1">
                {isBonusMode ? freeSpinsRemaining : '1.000'}
              </p>
            </div>
          </div>
        </div>

        {/* ===== SLOT MACHINE CONTAINER ===== */}
        <div className="absolute flex flex-col items-center" style={{ left: '69px', top: '236px', width: '622px' }}>
          {/* Win Amount Display */}
          <div className="relative z-10 mb-2 flex items-center justify-center" style={{ width: '622px', height: '100px' }}>
            <div className={`relative flex items-center justify-center ${isMultiplying ? 'animate-multiply-effect' : ''}`} style={{ width: '318px', height: '100px' }}>
              <img src={ASSETS.displayWin} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
              <p className="relative font-inter font-black text-[#fff200] text-[36px] text-center" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.5)', marginTop: '14px' }}>
                {displayWin.toLocaleString()}
              </p>
            </div>
          </div>

          {/* ===== SLOT REELS (6 columns x 5 rows) ===== */}
          <div className={`relative ${winStage === 'highlight' ? 'animate-shake' : ''}`} style={{ width: '622px' }}>
            <div className="flex gap-[7px]" style={{ height: '460px', padding: '10px' }}>
              {Array.from({ length: GRID_COLS }).map((_, colIndex) => {
                const isColSpinning = isSpinning && colIndex >= stoppedCols;

                const columnSymbols = Array.from({ length: GRID_ROWS }).map((_, rowIndex) => {
                  const gridIndex = rowIndex * GRID_COLS + colIndex;
                  return { symbol: grid[gridIndex], index: gridIndex };
                });

                const spinStrip = Array.from({ length: 20 }, (_, i) =>
                  SYMBOLS[(i * 3 + colIndex * 7) % SYMBOLS.length]
                );

                return (
                  <div key={`col-${colIndex}`} className={`col-${colIndex} reel-col`}>
                    <div className="reel-strip is-spinning" style={{ '--spin-start': '-75%', display: isColSpinning ? '' : 'none' }}>
                      {spinStrip.map((sym, i) => (
                        <div key={`spin-${colIndex}-${i}`} className="reel-sym" style={{ height: '80px' }}>
                          <img src={sym.src} alt={sym.id} />
                        </div>
                      ))}
                    </div>
                    <div className="reel-strip" style={{ position: 'relative', top: '0', display: isColSpinning ? 'none' : '' }}>
                      {columnSymbols.map(({ symbol, index }, rowIndex) => {
                        const isWinning = winningCells.includes(index);
                        const isMultiplierCell = symbol.isMultiplier;
                        const isAnimating = isWinning || (isMultiplierCell && winStage !== 'idle');
                        const winIndex = isWinning ? winningCells.indexOf(index) : (isMultiplierCell ? winningCells.length : -1);
                        const staggerDelay = winIndex >= 0 ? `${winIndex * 0.1}s` : '0s';
                        const isMultiplierFlying = flyingGridMultipliers.some(m => m.cellIndex === index);
                        const isMultiplierCollected = collectedMultiplierCells.includes(index);

                        return (
                          <div
                            key={index}
                            className={`reel-sym ${landedCols.has(colIndex) ? 'reel-sym-land' : ''} ${isAnimating ? 'z-20' : 'z-0'} ${(isMultiplierFlying || isMultiplierCollected) ? 'opacity-0' : ''}`}
                            style={{
                              height: '80px',
                              marginBottom: rowIndex < GRID_ROWS - 1 ? '8px' : '0',
                              animationDelay: landedCols.has(colIndex) ? `${rowIndex * 0.07}s` : '0s',
                            }}
                          >
                            {isAnimating ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <div
                                  className={`absolute inset-0 flex items-center justify-center ${winStage === 'highlight' ? 'animate-win-pulse' : ''} ${(winStage === 'reveal' || winStage === 'collect' || winStage === 'completed') ? 'animate-symbol-out' : ''}`}
                                  style={{ animationDelay: (winStage === 'reveal' || winStage === 'collect') ? staggerDelay : '0s' }}
                                >
                                  <img src={symbol.src} alt={symbol.id} className="w-full h-full object-contain" />
                                </div>
                                {winStage === 'highlight' && <div className="symbol-lightning" />}
                                {(winStage === 'reveal' || winStage === 'collect' || winStage === 'completed') && (
                                  <div
                                    className={`absolute inset-0 flex items-center justify-center z-10 ${winStage === 'reveal' ? 'animate-coin-in' : ''} ${winStage === 'collect' && !isMultiplierCell ? 'animate-fly-up' : ''}`}
                                    style={{ animationDelay: staggerDelay }}
                                  >
                                    <span className="symbol-value" style={{ fontSize: '24px' }}>
                                      {symbol.isMultiplier ? `${symbol.multiplier}x` : `+${symbol.value}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <img
                                src={symbol.src}
                                alt={symbol.id}
                                className={`${symbol.dropRows > 0 ? 'animate-cascade-drop' : ''}`}
                                style={symbol.dropRows > 0 ? { '--drop-rows': symbol.dropRows } : {}}
                              />
                            )}

                            {/* Multiplier badge */}
                            {symbol.isMultiplier && !isMultiplierCollected && !isMultiplierFlying && (
                              <div className="absolute -top-1 -right-1 bg-red-700 text-yellow-300 text-xs font-black px-1 rounded shadow-lg border border-red-400">
                                {symbol.multiplier}x
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flying multipliers from grid to total multiplier */}
            {flyingGridMultipliers.map(fm => (
              <div key={fm.id} className="flying-multiplier-grid animate-multiplier-fly-from-grid" style={{ left: `${fm.startX}px`, top: `${fm.startY}px`, width: '60px', height: '60px', animationDelay: `${fm.delay}ms`, '--target-x': `${-fm.startX - 30}px`, '--target-y': `${-fm.startY + 50}px` }}>
                <div className="w-full h-full rounded-full bg-red-700 border-2 border-red-400 flex items-center justify-center shadow-lg">
                  <span className="text-yellow-300 font-black text-lg">{fm.multiplier}x</span>
                </div>
              </div>
            ))}
          </div>

          {/* ===== FREE SPIN DISPLAY with CSS mask clip path ===== */}
          <div className="relative mt-1" style={{ width: '434px', height: '66px' }}>
            <img src={ASSETS.displayFreeSpin} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {/* Masked freespin progress bar - clipPath approach */}
            <div
              className="absolute overflow-hidden"
              style={{
                left: '6%', top: '19%', width: '88%', height: '49%',
                WebkitMaskImage: `url(${ASSETS.freespinMask})`,
                maskImage: `url(${ASSETS.freespinMask})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            >
              <img
                src={ASSETS.progressBarFreeSpin}
                alt=""
                className="absolute top-0 left-0 w-full h-full object-cover transition-all duration-500 ease-out"
                style={{ clipPath: `inset(0 ${100 - (freeSpinsRemaining > 0 ? (freeSpinsRemaining / 15) * 100 : (spinsCount > 0 ? 100 : 0))}% 0 0)` }}
              />
            </div>
            <p className="absolute font-inter font-black text-[24px] text-center text-white" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {freeSpinsRemaining > 0 ? (
                <><span className="text-[#fff200]">{freeSpinsRemaining}</span> Spin gratis tersisa</>
              ) : (
                <>FREE SPIN</>
              )}
            </p>
          </div>
        </div>

        {/* ===== SPIN CONTROLS - matches Figma container_spin 429x404 ===== */}
        <div className="absolute" style={{ left: `${(751 - 429) / 2}px`, top: '900px', width: '429px', height: '404px' }}>
          {/* Power Bar - Figma y:0, x:84, 261x84 */}
          <div className="absolute" style={{ left: '84px', top: '0', width: '261px', height: '84px' }}>
            <img src={ASSETS.luckyBarBg} alt="" className="absolute object-contain" style={{ left: '0', top: '13.5%', width: '100%', height: '86.7%' }} />
            <div
              className="absolute overflow-hidden"
              style={{
                left: '0.8%', top: '0', width: '97%', height: '94%',
                WebkitMaskImage: `url(${ASSETS.powerBarMask})`,
                maskImage: `url(${ASSETS.powerBarMask})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            >
              <img
                src={ASSETS.powerBarActive}
                alt=""
                className="absolute top-0 left-0 w-full h-full object-cover transition-all duration-100 ease-out"
                style={{ clipPath: `inset(0 ${100 - (powerBar / 15) * 100}% 0 0)` }}
              />
            </div>
          </div>

          {/* Spin Button - Figma y:105, x:123.5, 182x182 */}
          <div
            className={`absolute cursor-pointer spin-btn-touch ${(!canSpin && freeSpinsRemaining === 0) ? 'opacity-50' : ''}`}
            onMouseDown={startCharging}
            onMouseUp={stopCharging}
            onMouseLeave={stopCharging}
            onTouchStart={startCharging}
            onTouchEnd={stopCharging}
            onDragStart={e => e.preventDefault()}
            onSelectCapture={e => e.preventDefault()}
            style={{ left: '123.5px', top: '105px', width: '182px', height: '182px' }}
          >
            <img src={ASSETS.spinButton} alt="SPIN" draggable="false" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" />
          </div>

          {/* Progress bar area - Figma y:309, 429x95 */}
          <div className="absolute" style={{ left: '0', top: '309px', width: '429px', height: '95px' }}>
            {/* Bet Info text - Figma y:0, x:47, 333x31 */}
            <p className="absolute font-inter font-black text-[26px] text-center text-white" style={{ left: '48px', top: '0', width: '333px', lineHeight: '31px' }}>
              {autoSpinActive ? (
                <><span className="text-[#fff200] animate-pulse">AUTO SPIN</span> - <span className="text-[#fff200]">{autoSpinCount}</span> spin tersisa</>
              ) : (
                <><span className="text-[#fff200]">{totalCost} Poin</span> terpakai (<span className="text-[#fff200]">{spinsCount} spin</span>)</>
              )}
            </p>
            {/* Background bar - Figma y:50, 429x44.5 */}
            <img src={ASSETS.progressBarBg} alt="" className="absolute pointer-events-none" style={{ left: '0', top: '50px', width: '429px', height: '45px' }} />
            {/* Masked fill - Figma y:60, x:26, 381x18 */}
            <div
              className="absolute overflow-hidden"
              style={{
                left: '26px', top: '60px', width: '381px', height: '18px',
                WebkitMaskImage: `url(${ASSETS.progressBarMask})`,
                maskImage: `url(${ASSETS.progressBarMask})`,
                WebkitMaskSize: '381px 18px',
                maskSize: '381px 18px',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: '0 0',
                maskPosition: '0 0',
              }}
            >
              <img src={ASSETS.progressBar} alt="" className="absolute top-0 left-0 h-full object-cover pointer-events-none" style={{ width: '381px', clipPath: `inset(0 ${100 - progressPercent}% 0 0)` }} />
            </div>
            {/* Slider thumb - Figma y:44, x:355, 52x51 */}
            <div className="absolute pointer-events-none z-20" style={{ left: `${26 + (progressPercent / 100) * 329}px`, top: '44px', width: '52px', height: '51px', transform: 'translateX(-50%)' }}>
              <img src={ASSETS.slider} alt="" className="w-full h-full object-contain" />
            </div>
            {/* Max label - Figma y:57, x:354, 43x24 */}
            <p className="absolute font-inter font-black text-[#fff200] text-[20px] text-center pointer-events-none" style={{ left: '354px', top: '57px', width: '43px', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Max</p>
            {/* Hidden range input */}
            <input type="range" min={MIN_BET} max={MAX_BET} step={BET_STEP} value={bet} onChange={e => setBet(Number(e.target.value))} className="absolute opacity-0 cursor-pointer z-10" disabled={isSpinning || autoSpinActive} style={{ left: '0', top: '44px', width: '429px', height: '51px', touchAction: 'none' }} />
          </div>
        </div>

        {/* ===== FLYING COINS (to balance) ===== */}
        {flyingCoins.map(coin => (
          <div key={coin.id} className="flying-coin animate-coin-win-to-balance" style={{ left: '380px', top: '286px', animationDelay: `${coin.delay}ms` }}>
            <div className="w-full h-full rounded-full bg-yellow-400 border-2 border-yellow-600 shadow-lg" />
          </div>
        ))}

        {/* Tutorial */}
        {showTutorial && renderTutorial()}
        </div>
      </div>
    </div>
  );

  // ==================== TUTORIAL RENDER ====================
  function renderTutorial() {
    return (
      <div className="absolute inset-0 z-[9000] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
        <div className="relative bg-gradient-to-b from-red-900 to-red-950 rounded-2xl p-8 mx-8 border-2 border-red-500 shadow-2xl" style={{ maxWidth: '600px', width: '90%' }}>
          <button className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-red-600 text-white font-black text-xl flex items-center justify-center border-2 border-red-400 shadow-lg touch-btn" onClick={() => { setShowTutorial(false); setTutorialStep(1); }}>
            ✕
          </button>
          <div className="text-center">
            <h2 className="font-inter font-black text-[#fff200] text-[32px] mb-4" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {tutorialStep === 1 && 'Cara Bermain'}
              {tutorialStep === 2 && 'Tombol Spin'}
              {tutorialStep === 3 && 'Free Spin'}
              {tutorialStep === 4 && 'Cara Menang'}
            </h2>
            <div className="text-white text-[20px] leading-relaxed mb-6 font-inter">
              {tutorialStep === 1 && (
                <div>
                  <p className="mb-2">Atur taruhan dengan menggeser <span className="text-[#fff200] font-black">slider</span> di bawah.</p>
                  <p className="mb-2">Setiap <span className="text-[#fff200] font-black">10 Poin</span> = 1 spin</p>
                  <p>Taruhan <span className="text-[#fff200] font-black">50 Poin</span> = 5 spin otomatis!</p>
                </div>
              )}
              {tutorialStep === 2 && (
                <div>
                  <p className="mb-2">Tekan tombol <span className="text-[#fff200] font-black">SPIN</span> untuk memutar gulungan.</p>
                  <p>Gulungan berhenti satu per satu dari kiri ke kanan.</p>
                </div>
              )}
              {tutorialStep === 3 && (
                <div>
                  <p className="mb-2">Aktifkan <span className="text-[#fff200] font-black">Mode Bonus</span> untuk mendapat <span className="text-[#fff200] font-black">15 Free Spin!</span></p>
                  <p>Free spin tidak mengurangi saldo Poin kamu.</p>
                </div>
              )}
              {tutorialStep === 4 && (
                <div>
                  <p className="mb-2">Menang dengan <span className="text-[#fff200] font-black">8 atau lebih</span> simbol yang sama!</p>
                  <p className="mb-2">Simbol <span className="text-[#fff200] font-black">Multiplier</span> mengalikan kemenanganmu!</p>
                  <p>Simbol menang dihapus dan diganti simbol baru (Cascade).</p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              {tutorialStep > 1 && (
                <button className="px-6 py-3 bg-red-700 text-white font-black rounded-xl border-2 border-red-400 touch-btn text-[18px]" onClick={() => setTutorialStep(p => p - 1)}>
                  Sebelumnya
                </button>
              )}
              {tutorialStep < 4 ? (
                <button className="px-6 py-3 bg-yellow-500 text-black font-black rounded-xl border-2 border-yellow-300 touch-btn text-[18px]" onClick={() => setTutorialStep(p => p + 1)}>
                  Selanjutnya
                </button>
              ) : (
                <button className="px-6 py-3 bg-green-500 text-white font-black rounded-xl border-2 border-green-300 touch-btn text-[18px]" onClick={() => { setShowTutorial(false); setTutorialStep(1); }}>
                  Mulai Main!
                </button>
              )}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`w-3 h-3 rounded-full ${s === tutorialStep ? 'bg-yellow-400' : 'bg-red-600'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
