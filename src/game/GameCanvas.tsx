import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, ShipConfig, UpgradeCard } from './types';
import { SHIPS, UPGRADES_LIST } from './constants';
import { soundEngine } from './audio';

interface GameCanvasProps {
  selectedShip: ShipConfig;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  enableCrt: boolean;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  wave: number;
  setWave: React.Dispatch<React.SetStateAction<number>>;
  highScore: number;
  setHighScore: React.Dispatch<React.SetStateAction<number>>;
  onOpenUpgradeModal: (cards: UpgradeCard[]) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  selectedShip,
  gameState,
  setGameState,
  enableCrt,
  score,
  setScore,
  wave,
  setWave,
  highScore,
  setHighScore,
  onOpenUpgradeModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stats for HUD
  const [playerHp, setPlayerHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(100);
  const [playerXp, setPlayerXp] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(100);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [comboMultiplier, setComboMultiplier] = useState(1.0);
  const [dashCooldownRatio, setDashCooldownRatio] = useState(0); // 0 = ready, 1 = on cd

  // Upgrades installed in current run
  const upgradesRef = useRef<Record<string, number>>({});
  
  // Game loop internal state
  const stateRef = useRef({
    score: 0,
    wave: 1,
    multiplier: 1.0,
    comboTimer: 0,
    screenShake: 0,
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 18,
      hp: selectedShip.maxHp,
      maxHp: selectedShip.maxHp,
      shield: selectedShip.maxShield,
      maxShield: selectedShip.maxShield,
      shieldRegenTimer: 0,
      fireCooldown: 0,
      dashCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      xp: 0,
      xpNeeded: 100,
      level: 1,
    },
    bullets: [] as Array<{ x: number; y: number; vx: number; vy: number; damage: number; radius: number; color: string }>,
    enemyBullets: [] as Array<{ x: number; y: number; vx: number; vy: number; damage: number; radius: number; color: string }>,
    enemies: [] as Array<{
      id: number;
      type: 'drone' | 'raider' | 'pulsar' | 'boss';
      x: number;
      y: number;
      hp: number;
      maxHp: number;
      radius: number;
      speed: number;
      color: string;
      fireCooldown: number;
      scoreValue: number;
    }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number; decay: number }>,
    drops: [] as Array<{ x: number; y: number; type: 'xp' | 'hp' | 'shield'; value: number }>,
    damageNumbers: [] as Array<{ x: number; y: number; text: string; color: string; alpha: number; life: number }>,
    stars: [] as Array<{ x: number; y: number; size: number; speed: number; alpha: number }>,
    keys: {} as Record<string, boolean>,
    mouse: { x: 0, y: 0, isDown: false },
    touchVector: { x: 0, y: 0 },
    enemiesRemainingInWave: 10,
    waveSpawnTimer: 0,
    nextEnemyId: 1,
  });

  // Reset run
  const resetRun = useCallback(() => {
    const s = stateRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;

    s.score = 0;
    s.wave = 1;
    s.multiplier = 1.0;
    s.comboTimer = 0;
    s.screenShake = 0;

    s.player = {
      x: w / 2,
      y: h / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 18,
      hp: selectedShip.maxHp,
      maxHp: selectedShip.maxHp,
      shield: selectedShip.maxShield,
      maxShield: selectedShip.maxShield,
      shieldRegenTimer: 0,
      fireCooldown: 0,
      dashCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      xp: 0,
      xpNeeded: 100,
      level: 1,
    };

    upgradesRef.current = {};
    s.bullets = [];
    s.enemyBullets = [];
    s.enemies = [];
    s.particles = [];
    s.drops = [];
    s.damageNumbers = [];
    s.enemiesRemainingInWave = 12;
    s.waveSpawnTimer = 0;

    setScore(0);
    setWave(1);
    setPlayerHp(selectedShip.maxHp);
    setPlayerShield(selectedShip.maxShield);
    setPlayerXp(0);
    setXpNeeded(100);
    setPlayerLevel(1);
    setComboMultiplier(1.0);
  }, [selectedShip, setScore, setWave]);

  // Handle ship change
  useEffect(() => {
    resetRun();
  }, [selectedShip, resetRun]);

  // Trigger special ability (Dash / EMP)
  const triggerDash = useCallback(() => {
    const s = stateRef.current;
    if (s.player.dashCooldown <= 0 && gameState === 'PLAYING') {
      soundEngine.playDash();
      s.player.isDashing = true;
      s.player.dashTimer = 0.24;
      const cooldownRed = (upgradesRef.current['chrono_boost'] || 0) * 0.6;
      s.player.dashCooldown = Math.max(1.8, (selectedShip.specialCooldown / 1000) - cooldownRed);
      s.screenShake = 8;

      // Burst particles
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        s.particles.push({
          x: s.player.x,
          y: s.player.y,
          vx: Math.cos(a) * (Math.random() * 200 + 80),
          vy: Math.sin(a) * (Math.random() * 200 + 80),
          size: Math.random() * 4 + 2,
          color: selectedShip.color,
          alpha: 1,
          decay: 2.8,
        });
      }

      // If ship is Spectre, EMP clear nearby enemy bullets
      if (selectedShip.id === 'spectre') {
        s.enemyBullets = s.enemyBullets.filter(eb => Math.hypot(eb.x - s.player.x, eb.y - s.player.y) > 280);
      }
    }
  }, [gameState, selectedShip]);

  // Main Canvas Setup & Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const handleResize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initialize stars
    const stars = stateRef.current.stars;
    if (stars.length === 0) {
      for (let i = 0; i < 180; i++) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 1.8 + 0.5,
          speed: Math.random() * 0.7 + 0.2,
          alpha: Math.random() * 0.7 + 0.3,
        });
      }
    }

    // Input handlers
    const onKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Spacebar') {
        stateRef.current.mouse.isDown = true;
        e.preventDefault();
      }
      if (e.key === 'Shift') {
        triggerDash();
      }
      if (e.key === 'Escape') {
        if (gameState === 'PLAYING') setGameState('PAUSED');
        else if (gameState === 'PAUSED') setGameState('PLAYING');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
      if (e.key === ' ' || e.key === 'Spacebar') {
        stateRef.current.mouse.isDown = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      stateRef.current.mouse.x = e.clientX;
      stateRef.current.mouse.y = e.clientY;
    };

    const onMouseDown = (e: MouseEvent) => {
      soundEngine.unlock();
      if (e.button === 0) stateRef.current.mouse.isDown = true;
      if (e.button === 2) {
        triggerDash();
        e.preventDefault();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) stateRef.current.mouse.isDown = false;
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);

    // Enemy Spawning Helper
    const spawnEnemy = (w: number, width: number, height: number) => {
      const s = stateRef.current;
      const isBossWave = (w % 5 === 0) && (s.enemies.length === 0);
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = Math.hypot(width, height) / 2 + 80;
      const ex = s.player.x + Math.cos(angle) * spawnDist;
      const ey = s.player.y + Math.sin(angle) * spawnDist;

      if (isBossWave && s.enemiesRemainingInWave <= 1) {
        soundEngine.playBossAlert();
        s.enemies.push({
          id: s.nextEnemyId++,
          type: 'boss',
          x: ex,
          y: ey,
          hp: 850 + w * 300,
          maxHp: 850 + w * 300,
          radius: 46,
          speed: 80,
          color: '#ef4444',
          fireCooldown: 1.5,
          scoreValue: 5000,
        });
        s.enemiesRemainingInWave = 0;
        return;
      }

      const types: Array<'drone' | 'raider' | 'pulsar'> = ['drone', 'raider', 'pulsar'];
      const chosenType = types[Math.floor(Math.random() * (w > 2 ? 3 : (w > 1 ? 2 : 1)))];

      let hp = 30 + w * 9;
      let speed = 160 + Math.random() * 50;
      let radius = 15;
      let color = selectedShip.color;
      let scoreVal = 100;

      if (chosenType === 'raider') {
        hp = 55 + w * 14;
        speed = 130;
        radius = 18;
        color = '#f59e0b';
        scoreVal = 240;
      } else if (chosenType === 'pulsar') {
        hp = 120 + w * 22;
        speed = 90;
        radius = 24;
        color = '#ec4899';
        scoreVal = 480;
      }

      s.enemies.push({
        id: s.nextEnemyId++,
        type: chosenType,
        x: ex,
        y: ey,
        hp,
        maxHp: hp,
        radius,
        speed,
        color,
        fireCooldown: Math.random() * 2 + 1.2,
        scoreValue: scoreVal,
      });

      s.enemiesRemainingInWave--;
    };

    // Game Loop
    const loop = (now: number) => {
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const s = stateRef.current;

      if (gameState === 'PLAYING') {
        // Shake decay
        if (s.screenShake > 0) s.screenShake = Math.max(0, s.screenShake - dt * 25);

        // Combo timer
        if (s.comboTimer > 0) {
          s.comboTimer -= dt;
          if (s.comboTimer <= 0) {
            s.multiplier = 1.0;
            setComboMultiplier(1.0);
          }
        }

        // Movement input
        let mx = 0;
        let my = 0;
        if (s.keys['w'] || s.keys['arrowup']) my -= 1;
        if (s.keys['s'] || s.keys['arrowdown']) my += 1;
        if (s.keys['a'] || s.keys['arrowleft']) mx -= 1;
        if (s.keys['d'] || s.keys['arrowright']) mx += 1;

        mx += s.touchVector.x;
        my += s.touchVector.y;

        const mLen = Math.hypot(mx, my);
        if (mLen > 0) {
          mx /= Math.max(1, mLen);
          my /= Math.max(1, mLen);
        }

        const thrusterLevel = upgradesRef.current['chrono_thruster'] || 0;
        const currentSpeed = selectedShip.speed * (1 + thrusterLevel * 0.15) * (s.player.isDashing ? 2.4 : 1);
        s.player.vx = mx * currentSpeed;
        s.player.vy = my * currentSpeed;

        s.player.x += s.player.vx * dt;
        s.player.y += s.player.vy * dt;

        // Boundaries
        s.player.x = Math.max(s.player.radius, Math.min(width - s.player.radius, s.player.x));
        s.player.y = Math.max(s.player.radius, Math.min(height - s.player.radius, s.player.y));

        // Aim angle
        if (s.touchVector.x !== 0 || s.touchVector.y !== 0) {
          s.player.angle = Math.atan2(s.touchVector.y, s.touchVector.x);
        } else {
          s.player.angle = Math.atan2(s.mouse.y - s.player.y, s.mouse.x - s.player.x);
        }

        // Exhaust trails
        if (mLen > 0 || s.player.isDashing) {
          const exAngle = s.player.angle + Math.PI + (Math.random() - 0.5) * 0.4;
          s.particles.push({
            x: s.player.x - Math.cos(s.player.angle) * 14,
            y: s.player.y - Math.sin(s.player.angle) * 14,
            vx: Math.cos(exAngle) * (Math.random() * 80 + 40),
            vy: Math.sin(exAngle) * (Math.random() * 80 + 40),
            size: Math.random() * 4 + 2,
            color: s.player.isDashing ? selectedShip.secondaryColor : selectedShip.color,
            alpha: 0.9,
            decay: 3.5,
          });
        }

        // Dash Timers
        if (s.player.isDashing) {
          s.player.dashTimer -= dt;
          if (s.player.dashTimer <= 0) s.player.isDashing = false;
        }
        if (s.player.dashCooldown > 0) {
          s.player.dashCooldown -= dt;
          const maxCd = selectedShip.specialCooldown / 1000;
          setDashCooldownRatio(Math.max(0, s.player.dashCooldown / maxCd));
        } else {
          setDashCooldownRatio(0);
        }

        // Passive shield regen
        s.player.shieldRegenTimer += dt;
        if (s.player.shieldRegenTimer > 2.5 && s.player.shield < s.player.maxShield) {
          const regenRate = selectedShip.shieldRegen + (upgradesRef.current['kinetic_barrier'] || 0) * 4;
          s.player.shield = Math.min(s.player.maxShield, s.player.shield + regenRate * dt);
          setPlayerShield(s.player.shield);
        }

        // Weapon firing
        s.player.fireCooldown -= dt;
        if (s.mouse.isDown && s.player.fireCooldown <= 0) {
          const scatterLevel = upgradesRef.current['plasma_scatter'] || 0;
          const velocityLevel = upgradesRef.current['hyper_velocity'] || 0;
          const shots = 1 + scatterLevel;
          const bSpeed = 660 + velocityLevel * 100;
          const bDmg = selectedShip.bulletDamage * (1 + velocityLevel * 0.18);
          const spreadAngle = 0.15;

          for (let i = 0; i < shots; i++) {
            const offset = (i - (shots - 1) / 2) * spreadAngle;
            const a = s.player.angle + offset;
            s.bullets.push({
              x: s.player.x + Math.cos(a) * 16,
              y: s.player.y + Math.sin(a) * 16,
              vx: Math.cos(a) * bSpeed,
              vy: Math.sin(a) * bSpeed,
              damage: bDmg,
              radius: 3.5,
              color: selectedShip.color,
            });
          }
          s.player.fireCooldown = 1 / selectedShip.fireRate;
          soundEngine.playLaser(selectedShip.id === 'dreadnought' ? 'heavy' : 'player');
          s.screenShake = Math.max(s.screenShake, 2);
        }

        // Update player bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < -60 || b.x > width + 60 || b.y < -60 || b.y > height + 60) {
            s.bullets.splice(i, 1);
          }
        }

        // Update enemy bullets
        for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
          const eb = s.enemyBullets[i];
          eb.x += eb.vx * dt;
          eb.y += eb.vy * dt;

          if (!s.player.isDashing && Math.hypot(eb.x - s.player.x, eb.y - s.player.y) < s.player.radius + eb.radius) {
            // Hit player
            damagePlayer(eb.damage);
            s.enemyBullets.splice(i, 1);
            continue;
          }

          if (eb.x < -60 || eb.x > width + 60 || eb.y < -60 || eb.y > height + 60) {
            s.enemyBullets.splice(i, 1);
          }
        }

        // Wave progression & enemy spawn
        if (s.enemiesRemainingInWave > 0) {
          s.waveSpawnTimer -= dt;
          if (s.waveSpawnTimer <= 0) {
            spawnEnemy(s.wave, width, height);
            s.waveSpawnTimer = Math.max(0.6, 2.2 - s.wave * 0.12);
          }
        } else if (s.enemies.length === 0) {
          // Next wave completed!
          const nextW = s.wave + 1;
          s.wave = nextW;
          s.enemiesRemainingInWave = 12 + nextW * 4;
          s.waveSpawnTimer = 0;
          setWave(nextW);
          soundEngine.playPowerup();
        }

        // Update Enemies
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const e = s.enemies[i];
          const angleToPlayer = Math.atan2(s.player.y - e.y, s.player.x - e.x);

          e.x += Math.cos(angleToPlayer) * e.speed * dt;
          e.y += Math.sin(angleToPlayer) * e.speed * dt;

          // Enemy shooting
          if (e.type !== 'drone') {
            e.fireCooldown -= dt;
            if (e.fireCooldown <= 0) {
              if (e.type === 'boss') {
                for (let k = 0; k < 10; k++) {
                  const ringAngle = (k / 10) * Math.PI * 2 + angleToPlayer;
                  s.enemyBullets.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(ringAngle) * 230,
                    vy: Math.sin(ringAngle) * 230,
                    damage: 20,
                    radius: 5,
                    color: '#ef4444',
                  });
                }
                e.fireCooldown = 2.0;
              } else if (e.type === 'pulsar') {
                for (let k = 0; k < 4; k++) {
                  const crossAngle = (k / 4) * Math.PI * 2;
                  s.enemyBullets.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(crossAngle) * 200,
                    vy: Math.sin(crossAngle) * 200,
                    damage: 16,
                    radius: 4,
                    color: '#ec4899',
                  });
                }
                e.fireCooldown = 2.4;
              } else {
                s.enemyBullets.push({
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(angleToPlayer) * 260,
                  vy: Math.sin(angleToPlayer) * 260,
                  damage: 14,
                  radius: 4,
                  color: '#f59e0b',
                });
                e.fireCooldown = 2.2;
              }
            }
          }

          // Direct collision with player
          if (!s.player.isDashing && Math.hypot(e.x - s.player.x, e.y - s.player.y) < s.player.radius + e.radius) {
            damagePlayer(22);
            e.hp -= 40;
            if (e.hp <= 0) {
              destroyEnemy(i);
              continue;
            }
          }

          // Bullet collisions
          for (let j = s.bullets.length - 1; j >= 0; j--) {
            const b = s.bullets[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < b.radius + e.radius) {
              e.hp -= b.damage;
              s.bullets.splice(j, 1);
              soundEngine.playHit();

              // Damage text
              s.damageNumbers.push({
                x: e.x + (Math.random() - 0.5) * 24,
                y: e.y - 12,
                text: Math.round(b.damage).toString(),
                color: '#ffffff',
                alpha: 1,
                life: 0.6,
              });

              // Sparks
              for (let sp = 0; sp < 4; sp++) {
                s.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 160,
                  vy: (Math.random() - 0.5) * 160,
                  size: 2.5,
                  color: selectedShip.color,
                  alpha: 1,
                  decay: 3.5,
                });
              }

              if (e.hp <= 0) {
                destroyEnemy(i);
                break;
              }
            }
          }
        }

        // Pull and collect drops
        const magnetLevel = upgradesRef.current['magnet_siphon'] || 0;
        const magnetRadius = 100 * (1 + magnetLevel * 0.75);

        for (let i = s.drops.length - 1; i >= 0; i--) {
          const d = s.drops[i];
          const dist = Math.hypot(d.x - s.player.x, d.y - s.player.y);
          if (dist < magnetRadius) {
            const a = Math.atan2(s.player.y - d.y, s.player.x - d.x);
            d.x += Math.cos(a) * 380 * dt;
            d.y += Math.sin(a) * 380 * dt;
          }

          if (dist < s.player.radius + 12) {
            soundEngine.playPowerup();
            if (d.type === 'xp') {
              s.player.xp += d.value;
              s.score += Math.round(20 * s.multiplier);
              setScore(s.score);

              if (s.player.xp >= s.player.xpNeeded) {
                s.player.xp -= s.player.xpNeeded;
                s.player.xpNeeded = Math.round(s.player.xpNeeded * 1.35);
                s.player.level += 1;
                setPlayerLevel(s.player.level);
                setXpNeeded(s.player.xpNeeded);

                // Trigger roguelite upgrade choice modal
                const available = UPGRADES_LIST.filter(u => (upgradesRef.current[u.id] || 0) < u.maxLevel);
                const shuffled = [...available].sort(() => 0.5 - Math.random()).slice(0, 3);
                const upgradeCards: UpgradeCard[] = shuffled.map(u => ({
                  ...u,
                  level: (upgradesRef.current[u.id] || 0) + 1,
                }));
                soundEngine.playLevelUp();
                setGameState('UPGRADE_SELECT');
                onOpenUpgradeModal(upgradeCards);
              }
              setPlayerXp(s.player.xp);
            } else if (d.type === 'hp') {
              s.player.hp = Math.min(s.player.maxHp, s.player.hp + 35);
              setPlayerHp(s.player.hp);
            } else if (d.type === 'shield') {
              s.player.shield = Math.min(s.player.maxShield, s.player.shield + 45);
              setPlayerShield(s.player.shield);
            }
            s.drops.splice(i, 1);
          }
        }

        // Particle updates
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.alpha -= p.decay * dt;
          if (p.alpha <= 0) s.particles.splice(i, 1);
        }

        // Damage numbers
        for (let i = s.damageNumbers.length - 1; i >= 0; i--) {
          const dn = s.damageNumbers[i];
          dn.y -= 30 * dt;
          dn.life -= dt;
          dn.alpha = dn.life / 0.6;
          if (dn.life <= 0) s.damageNumbers.splice(i, 1);
        }
      }

      // Damage player logic
      function damagePlayer(dmg: number) {
        s.player.shieldRegenTimer = 0;
        soundEngine.playHit();
        s.screenShake = 12;

        if (s.player.shield > 0) {
          s.player.shield -= dmg;
          if (s.player.shield < 0) {
            s.player.hp += s.player.shield;
            s.player.shield = 0;
          }
        } else {
          s.player.hp -= dmg;
        }

        setPlayerShield(Math.max(0, s.player.shield));
        setPlayerHp(Math.max(0, s.player.hp));

        if (s.player.hp <= 0) {
          s.player.hp = 0;
          soundEngine.playExplosion(true);
          if (s.score > highScore) {
            setHighScore(s.score);
            localStorage.setItem('neon_void_highscore', s.score.toString());
          }
          setGameState('GAME_OVER');
        }
      }

      // Destroy enemy logic
      function destroyEnemy(index: number) {
        const e = s.enemies[index];
        soundEngine.playExplosion(e.type === 'boss');
        s.screenShake = e.type === 'boss' ? 22 : 6;

        s.score += Math.round(e.scoreValue * s.multiplier);
        setScore(s.score);

        s.multiplier = Math.min(5.0, s.multiplier + 0.1);
        s.comboTimer = 3.5;
        setComboMultiplier(s.multiplier);

        const count = e.type === 'boss' ? 44 : 16;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          s.particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * (Math.random() * 240 + 60),
            vy: Math.sin(a) * (Math.random() * 240 + 60),
            size: Math.random() * 4 + 2,
            color: e.color,
            alpha: 1,
            decay: 2.0,
          });
        }

        // Drops
        s.drops.push({
          x: e.x,
          y: e.y,
          type: Math.random() < 0.12 ? (Math.random() < 0.5 ? 'hp' : 'shield') : 'xp',
          value: 20,
        });

        s.enemies.splice(index, 1);
      }

      // RENDER
      ctx.save();
      if (s.screenShake > 0) {
        const sx = (Math.random() - 0.5) * s.screenShake;
        const sy = (Math.random() - 0.5) * s.screenShake;
        ctx.translate(sx, sy);
      }

      // Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Stars
      for (const st of s.stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${st.alpha})`;
        ctx.beginPath();
        ctx.arc(st.x % width, st.y % height, st.size, 0, Math.PI * 2);
        ctx.fill();
        st.y += st.speed;
        if (st.y > height) st.y = 0;
      }

      // Grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 64;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Drops
      for (const d of s.drops) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
        if (d.type === 'hp') {
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#10b981';
        } else if (d.type === 'shield') {
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#06b6d4';
        } else {
          ctx.fillStyle = '#a855f7';
          ctx.shadowColor = '#a855f7';
        }
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Player Bullets
      for (const b of s.bullets) {
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Enemy Bullets
      for (const eb of s.enemyBullets) {
        ctx.save();
        ctx.fillStyle = eb.color;
        ctx.shadowColor = eb.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Enemies
      for (const e of s.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;

        if (e.type === 'boss') {
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();

          // Health bar above boss
          const barW = 80;
          const barH = 6;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.fillRect(-barW / 2, -e.radius - 16, barW, barH);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-barW / 2, -e.radius - 16, (e.hp / e.maxHp) * barW, barH);
        } else if (e.type === 'pulsar') {
          ctx.beginPath();
          ctx.rect(-e.radius / 2, -e.radius / 2, e.radius, e.radius);
          ctx.fill();
        } else {
          const a = Math.atan2(s.player.y - e.y, s.player.x - e.x);
          ctx.rotate(a);
          ctx.beginPath();
          ctx.moveTo(e.radius, 0);
          ctx.lineTo(-e.radius, -e.radius * 0.7);
          ctx.lineTo(-e.radius * 0.5, 0);
          ctx.lineTo(-e.radius, e.radius * 0.7);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Player Ship
      if (gameState !== 'MENU') {
        ctx.save();
        ctx.translate(s.player.x, s.player.y);
        ctx.rotate(s.player.angle);

        // Shield bubble
        if (s.player.shield > 0) {
          ctx.strokeStyle = `rgba(6, 182, 212, ${Math.min(0.8, s.player.shield / s.player.maxShield)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, s.player.radius + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Hull
        ctx.fillStyle = s.player.isDashing ? '#ffffff' : selectedShip.color;
        ctx.shadowColor = selectedShip.color;
        ctx.shadowBlur = s.player.isDashing ? 22 : 12;
        ctx.beginPath();
        ctx.moveTo(s.player.radius + 4, 0);
        ctx.lineTo(-s.player.radius, -s.player.radius * 0.75);
        ctx.lineTo(-s.player.radius * 0.4, 0);
        ctx.lineTo(-s.player.radius, s.player.radius * 0.75);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Particles
      for (const p of s.particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Damage Popups
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      for (const dn of s.damageNumbers) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, dn.alpha)})`;
        ctx.fillText(dn.text, dn.x, dn.y);
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, [gameState, selectedShip, triggerDash, setScore, setWave, setHighScore, highScore, onOpenUpgradeModal, setGameState]);

  // Touch joystick tracking
  const joyZoneRef = useRef<HTMLDivElement | null>(null);
  const joyStickRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchJoyStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!joyZoneRef.current) return;
    const rect = joyZoneRef.current.getBoundingClientRect();
    touchStartRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    handleTouchJoy(touch);
  };

  const onTouchJoyMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    handleTouchJoy(e.touches[0]);
  };

  const handleTouchJoy = (touch: React.Touch) => {
    if (!touchStartRef.current || !joyStickRef.current) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);
    const maxR = 40;
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const joyX = Math.cos(angle) * clampedDist;
    const joyY = Math.sin(angle) * clampedDist;
    joyStickRef.current.style.transform = `translate(${joyX}px, ${joyY}px)`;
    stateRef.current.touchVector = { x: joyX / maxR, y: joyY / maxR };
  };

  const onTouchJoyEnd = () => {
    touchStartRef.current = null;
    if (joyStickRef.current) {
      joyStickRef.current.style.transform = 'translate(0px, 0px)';
    }
    stateRef.current.touchVector = { x: 0, y: 0 };
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* Optional CRT Scanlines */}
      {enableCrt && <div className="crt-overlay" />}

      {/* In-Game HUD (Visible during PLAYING) */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start pointer-events-none z-10">
          <div className="flex gap-4 items-center">
            {/* Health & Shield */}
            <div className="flex flex-col gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>SHIELD</span>
                <span className="text-cyan-400 font-bold">{Math.round(playerShield)}/{selectedShip.maxShield}</span>
              </div>
              <div className="w-36 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-linear-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, (playerShield / selectedShip.maxShield) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-mono text-slate-400 mt-1">
                <span>HULL</span>
                <span className="text-emerald-400 font-bold">{Math.round(playerHp)}/{selectedShip.maxHp}</span>
              </div>
              <div className="w-36 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, (playerHp / selectedShip.maxHp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Sector / Wave */}
            <div className="flex flex-col bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-lg">
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-mono">SECTOR</span>
              <span className="text-xl font-bold font-mono text-white arcade-glow">{wave}</span>
            </div>
          </div>

          <div className="flex gap-4 items-center text-right">
            {/* Multiplier */}
            <div className="flex flex-col bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-lg">
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-mono">COMBO</span>
              <span className="text-xl font-bold font-mono text-pink-400">x{comboMultiplier.toFixed(1)}</span>
            </div>

            {/* Score */}
            <div className="flex flex-col bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-lg">
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-mono">SCORE</span>
              <span className="text-xl font-bold font-mono text-white tracking-widest">
                {score.toString().padStart(6, '0')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom XP Bar */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900 z-10">
          <div
            className="h-full bg-linear-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-200"
            style={{ width: `${Math.min(100, (playerXp / xpNeeded) * 100)}%` }}
          />
        </div>
      )}

      {/* Mobile Touch Controls */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none z-15 md:hidden">
          {/* Virtual Joystick */}
          <div
            ref={joyZoneRef}
            onTouchStart={onTouchJoyStart}
            onTouchMove={onTouchJoyMove}
            onTouchEnd={onTouchJoyEnd}
            onTouchCancel={onTouchJoyEnd}
            className="absolute bottom-8 left-8 w-32 h-32 rounded-full border border-slate-700/60 bg-slate-900/30 backdrop-blur-xs pointer-events-auto flex items-center justify-center touch-none"
          >
            <div
              ref={joyStickRef}
              className="w-12 h-12 rounded-full bg-cyan-500/70 border-2 border-white shadow-lg pointer-events-none"
            />
          </div>

          {/* Fire & Dash Touch Buttons */}
          <div className="absolute bottom-8 right-8 flex flex-col gap-4 items-center pointer-events-auto">
            <button
              onTouchStart={(e) => {
                triggerDash();
                e.preventDefault();
              }}
              disabled={dashCooldownRatio > 0}
              className={`w-14 h-14 rounded-full border-2 font-mono text-xs font-bold transition-all shadow-lg flex items-center justify-center ${
                dashCooldownRatio > 0
                  ? 'border-slate-700 text-slate-500 bg-slate-900/50'
                  : 'border-pink-500 bg-pink-500/20 text-pink-300 active:bg-pink-500 active:text-slate-950'
              }`}
            >
              DASH
            </button>
            <button
              onTouchStart={(e) => {
                stateRef.current.mouse.isDown = true;
                e.preventDefault();
              }}
              onTouchEnd={(e) => {
                stateRef.current.mouse.isDown = false;
                e.preventDefault();
              }}
              className="w-20 h-20 rounded-full border-2 border-cyan-400 bg-cyan-500/30 active:bg-cyan-400 active:text-slate-950 text-white font-mono font-bold text-sm tracking-widest shadow-xl flex items-center justify-center touch-none"
            >
              FIRE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
