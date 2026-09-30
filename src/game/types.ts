export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'UPGRADE_SELECT' | 'GAME_OVER';

export type GameMode = 'SURVIVAL' | 'TIME_ATTACK' | 'BOSS_RUSH';

export interface ShipConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  speed: number;
  maxHp: number;
  maxShield: number;
  shieldRegen: number;
  fireRate: number; // shots per sec
  bulletDamage: number;
  specialAbility: string;
  specialCooldown: number; // ms
  color: string;
  secondaryColor: string;
}

export interface UpgradeCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
  rarity: 'common' | 'rare' | 'epic';
}

export interface PlayerStats {
  score: number;
  highScore: number;
  wave: number;
  credits: number;
  enemiesDefeated: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}
