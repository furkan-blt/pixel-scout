/**
 * Çok Oyunculu Piyasa Değeri Arenası — 4 Haneli Oda & Firebase Canlı Senkronizasyon Motoru
 */

const DB_BASE_URL = 'https://pixel-176f4-default-rtdb.firebaseio.com';
const CLIENT_ID_KEY = 'pixel_scout_mp_client_id';
const PLAYER_NAME_KEY = 'pixel_scout_mp_player_name';

export const BOT_PROFILES = [
  { id: 'bot-burak', name: 'Burak_K', avatar: 'BK', color: '#3b82f6', skill: 0.14 },
  { id: 'bot-emre', name: 'Emre99', avatar: 'E9', color: '#a855f7', skill: 0.18 },
  { id: 'bot-kaan', name: 'KaanT', avatar: 'KT', color: '#f97316', skill: 0.22 },
  { id: 'bot-mert', name: 'MertFB', avatar: 'MF', color: '#ec4899', skill: 0.26 },
  { id: 'bot-arda', name: 'ArdaGS', avatar: 'AG', color: '#14b8a6', skill: 0.16 }
];

const AVATAR_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#eab308'];

/**
 * 4 haneli sayısal oda kodu üretir (1000 - 9999 arası).
 */
export function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Oda kodunun tam 4 haneli sayı olup olmadığını doğrular.
 */
export function isValidRoomCode(code) {
  return typeof code === 'string' && /^\d{4}$/.test(code.trim());
}

/**
 * İstemci için kalıcı benzersiz oyuncu kimliği döndürür.
 */
export function getLocalClientId() {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = 'p_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return 'p_' + Math.random().toString(36).slice(2, 10);
  }
}

export function getSavedPlayerName() {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function savePlayerName(name) {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, String(name || '').trim().slice(0, 18));
  } catch {
    // ignore
  }
}

export function getInitials(name) {
  const clean = String(name || 'Oyuncu').trim();
  const parts = clean.split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Bot oyuncular için gerçekçi tahmin üretir (Euro veya Bonus TL).
 */
export function generateBotGuess(actualValue, skill = 0.18, isBonus = false) {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const errorFactor = (Math.random() * skill * 1.35) * direction;
  if (isBonus) {
    const rawTry = Math.max(1000, actualValue * (1 + errorFactor));
    return Math.round(rawTry / 250) * 250;
  }
  const rawEuro = Math.max(500_000, actualValue * (1 + errorFactor));
  return Math.round(rawEuro / 500_000) * 500_000;
}

/**
 * Firebase Realtime Database üzerinde oda okuma/yazma işlemleri.
 */
export class MultiplayerRoomClient {
  constructor() {
    this.roomCode = null;
    this.clientId = getLocalClientId();
    this.playerName = getSavedPlayerName() || 'Scout_' + this.clientId.slice(-3).toUpperCase();
    this.pollTimer = null;
    this.isOfflineMode = false;
    this.localRoomState = null;
    this.onStateChange = null;
  }

  async _fetchJson(path, options = {}) {
    const url = `${DB_BASE_URL}${path}.json`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`Firebase HTTP ${res.status}`);
    }
    return await res.json();
  }

  /**
   * Yeni bir 4 haneli oda oluşturur.
   */
  async createRoom({
    hostName,
    questionCount = 10,
    roundDurationSec = 15,
    bonusEnabled = true,
    deckIds = [],
    withBots = 0
  }) {
    const cleanName = (hostName || this.playerName || 'Kurucu').trim().slice(0, 18);
    this.playerName = cleanName;
    savePlayerName(cleanName);

    const code = generateRoomCode();
    const now = Date.now();

    const players = {
      [this.clientId]: {
        id: this.clientId,
        name: cleanName,
        avatar: getInitials(cleanName),
        color: AVATAR_COLORS[0],
        isHost: true,
        isBot: false,
        totalScore: 0,
        lastRoundDelta: 0,
        joinedAt: now
      }
    };

    const botCount = Math.min(5, Math.max(0, Number(withBots) || 0));
    for (let i = 0; i < botCount; i++) {
      const bot = BOT_PROFILES[i];
      players[bot.id] = {
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        color: bot.color,
        isHost: false,
        isBot: true,
        skill: bot.skill,
        totalScore: 0,
        lastRoundDelta: 0,
        joinedAt: now + i + 1
      };
    }

    const roomData = {
      code,
      hostId: this.clientId,
      status: 'lobby',
      createdAt: now,
      updatedAt: now,
      settings: {
        questionCount: Number(questionCount) === 20 ? 20 : 10,
        roundDurationSec: [10, 15, 20, 25, 30].includes(Number(roundDurationSec)) ? Number(roundDurationSec) : 15,
        bonusEnabled: Boolean(bonusEnabled),
        maxPlayers: 6
      },
      deckIds,
      currentRound: 0,
      roundStartedAt: null,
      players,
      guesses: {},
      roundHistory: {}
    };

    try {
      await this._fetchJson(`/mp_rooms/${code}`, {
        method: 'PUT',
        body: JSON.stringify(roomData)
      });
      this.isOfflineMode = false;
    } catch {
      this.isOfflineMode = true;
    }

    this.roomCode = code;
    this.localRoomState = roomData;
    this._startPolling();
    this._emit();
    return roomData;
  }

  /**
   * 4 haneli kod ile mevcut odaya katılır.
   */
  async joinRoom({ roomCode, playerName }) {
    const cleanCode = String(roomCode || '').trim();
    if (!isValidRoomCode(cleanCode)) {
      throw new Error('Lütfen 4 haneli geçerli bir oda kodu girin (Örn: 4819).');
    }

    const cleanName = (playerName || this.playerName || 'Oyuncu').trim().slice(0, 18);
    this.playerName = cleanName;
    savePlayerName(cleanName);

    const existing = await this._fetchJson(`/mp_rooms/${cleanCode}`);
    if (!existing || !existing.code) {
      throw new Error(`#${cleanCode} kodlu aktif bir oda bulunamadı.`);
    }

    const currentPlayers = existing.players || {};
    const playerIds = Object.keys(currentPlayers);
    if (!currentPlayers[this.clientId] && playerIds.length >= (existing.settings?.maxPlayers || 6)) {
      throw new Error('Bu oda maksimum oyuncu kapasitesine (6/6) ulaşmış.');
    }

    const colorIdx = playerIds.length % AVATAR_COLORS.length;
    const playerObj = currentPlayers[this.clientId] || {
      id: this.clientId,
      name: cleanName,
      avatar: getInitials(cleanName),
      color: AVATAR_COLORS[colorIdx],
      isHost: existing.hostId === this.clientId,
      isBot: false,
      totalScore: 0,
      lastRoundDelta: 0,
      joinedAt: Date.now()
    };
    playerObj.name = cleanName;
    playerObj.avatar = getInitials(cleanName);

    await this._fetchJson(`/mp_rooms/${cleanCode}/players/${this.clientId}`, {
      method: 'PUT',
      body: JSON.stringify(playerObj)
    });

    existing.players = { ...currentPlayers, [this.clientId]: playerObj };
    this.roomCode = cleanCode;
    this.isOfflineMode = false;
    this.localRoomState = existing;
    this._startPolling();
    this._emit();
    return existing;
  }

  /**
   * Lobiye bot rakip ekler (oda sahibi tarafından).
   */
  async addBotToRoom() {
    if (!this.localRoomState) return null;
    const players = this.localRoomState.players || {};
    const count = Object.keys(players).length;
    if (count >= 6) return this.localRoomState;

    const availableBot = BOT_PROFILES.find((b) => !players[b.id]);
    if (!availableBot) return this.localRoomState;

    const botEntry = {
      id: availableBot.id,
      name: availableBot.name,
      avatar: availableBot.avatar,
      color: availableBot.color,
      isHost: false,
      isBot: true,
      skill: availableBot.skill,
      totalScore: 0,
      lastRoundDelta: 0,
      joinedAt: Date.now()
    };

    this.localRoomState.players[availableBot.id] = botEntry;
    if (!this.isOfflineMode && this.roomCode) {
      try {
        await this._fetchJson(`/mp_rooms/${this.roomCode}/players/${availableBot.id}`, {
          method: 'PUT',
          body: JSON.stringify(botEntry)
        });
      } catch {
        // ignore
      }
    }
    this._emit();
    return this.localRoomState;
  }

  /**
   * Oyunu başlatır (Tur 0).
   */
  async startGame(deckIds, getPlayerById) {
    if (!this.localRoomState) return;
    const now = Date.now();
    this.localRoomState.status = 'playing';
    this.localRoomState.currentRound = 0;
    this.localRoomState.roundStartedAt = now;
    this.localRoomState.guesses = {};
    this.localRoomState.roundHistory = {};
    if (Array.isArray(deckIds) && deckIds.length > 0) {
      this.localRoomState.deckIds = deckIds;
    }

    for (const pid of Object.keys(this.localRoomState.players || {})) {
      this.localRoomState.players[pid].totalScore = 0;
      this.localRoomState.players[pid].lastRoundDelta = 0;
    }

    this._populateBotGuessesForCurrentRound(getPlayerById);

    if (!this.isOfflineMode && this.roomCode) {
      try {
        await this._fetchJson(`/mp_rooms/${this.roomCode}`, {
          method: 'PUT',
          body: JSON.stringify(this.localRoomState)
        });
      } catch {
        // ignore
      }
    }
    this._emit();
  }

  _populateBotGuessesForCurrentRound(getPlayerById) {
    if (!this.localRoomState || typeof getPlayerById !== 'function') return;
    const roundIdx = this.localRoomState.currentRound || 0;
    const targetId = this.localRoomState.deckIds?.[roundIdx];
    const footballer = getPlayerById(targetId);
    if (!footballer) return;

    if (!this.localRoomState.guesses) this.localRoomState.guesses = {};
    if (!this.localRoomState.guesses[roundIdx]) this.localRoomState.guesses[roundIdx] = {};

    const now = Date.now();
    for (const p of Object.values(this.localRoomState.players || {})) {
      if (p.isBot) {
        const botGuess = generateBotGuess(footballer.marketValue, p.skill || 0.18, Boolean(footballer.isBonus));
        const simulatedDelayMs = 1500 + Math.floor(Math.random() * 4500);
        this.localRoomState.guesses[roundIdx][p.id] = {
          playerId: p.id,
          guess: botGuess,
          locked: true,
          lockedAt: now + simulatedDelayMs
        };
      }
    }
  }

  /**
   * Oyuncunun bu turdaki tahminini kaydeder (locked = false ise canlı taslak, locked = true ise sabitlenmiş).
   */
  async submitGuess(guessVal, locked = true) {
    if (!this.localRoomState) return;
    const roundIdx = this.localRoomState.currentRound || 0;
    if (!this.localRoomState.guesses) this.localRoomState.guesses = {};
    if (!this.localRoomState.guesses[roundIdx]) this.localRoomState.guesses[roundIdx] = {};

    const existing = this.localRoomState.guesses[roundIdx][this.clientId];
    if (existing?.locked && !locked) return;

    const numericGuess = Math.round((Number(guessVal) || 0) * 100) / 100;
    const payload = {
      playerId: this.clientId,
      guess: numericGuess,
      locked: Boolean(locked),
      lockedAt: locked ? Date.now() : (existing?.lockedAt || Date.now())
    };

    this.localRoomState.guesses[roundIdx][this.clientId] = payload;

    if (!this.isOfflineMode && this.roomCode) {
      try {
        await this._fetchJson(`/mp_rooms/${this.roomCode}/guesses/${roundIdx}/${this.clientId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } catch {
        // ignore
      }
    }
    if (locked) {
      this._emit();
    }
  }

  /**
   * Tur sonuçlarını hesaplar ve 'reveal' aşamasına geçirir.
   */
  async revealRoundResults(roundScores) {
    if (!this.localRoomState || this.localRoomState.status === 'reveal') return;
    const roundIdx = this.localRoomState.currentRound || 0;
    this.localRoomState.status = 'reveal';
    if (!this.localRoomState.roundHistory) this.localRoomState.roundHistory = {};
    this.localRoomState.roundHistory[roundIdx] = roundScores;

    for (const item of roundScores) {
      const p = this.localRoomState.players?.[item.playerId];
      if (p) {
        p.lastRoundDelta = item.totalRoundPoints || 0;
        p.totalScore = (p.totalScore || 0) + p.lastRoundDelta;
      }
    }

    this.localRoomState.updatedAt = Date.now();
    if (!this.isOfflineMode && this.roomCode) {
      try {
        await this._fetchJson(`/mp_rooms/${this.roomCode}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'reveal',
            players: this.localRoomState.players,
            roundHistory: this.localRoomState.roundHistory,
            updatedAt: this.localRoomState.updatedAt
          })
        });
      } catch {
        // ignore
      }
    }
    this._emit();
  }

  /**
   * Sonraki soruya geçer veya son soruysa oyunu bitirir.
   */
  async nextRound(getPlayerById) {
    if (!this.localRoomState) return;
    const nextIdx = (this.localRoomState.currentRound || 0) + 1;
    const totalRounds = Array.isArray(this.localRoomState.deckIds) && this.localRoomState.deckIds.length > 0
      ? this.localRoomState.deckIds.length
      : (this.localRoomState.settings?.questionCount || 10);

    if (nextIdx >= totalRounds) {
      this.localRoomState.status = 'finished';
    } else {
      this.localRoomState.status = 'playing';
      this.localRoomState.currentRound = nextIdx;
      this.localRoomState.roundStartedAt = Date.now();
      this._populateBotGuessesForCurrentRound(getPlayerById);
    }

    this.localRoomState.updatedAt = Date.now();
    if (!this.isOfflineMode && this.roomCode) {
      try {
        await this._fetchJson(`/mp_rooms/${this.roomCode}`, {
          method: 'PUT',
          body: JSON.stringify(this.localRoomState)
        });
      } catch {
        // ignore
      }
    }
    this._emit();
  }

  _startPolling() {
    this._stopPolling();
    if (this.isOfflineMode || !this.roomCode) return;

    this.pollTimer = setInterval(async () => {
      try {
        const remote = await this._fetchJson(`/mp_rooms/${this.roomCode}`);
        if (remote && remote.code) {
          const rIdx = remote.currentRound || 0;
          const myLocalDraft = this.localRoomState?.guesses?.[rIdx]?.[this.clientId];
          if (myLocalDraft && remote.status === 'playing') {
            if (!remote.guesses) remote.guesses = {};
            if (!remote.guesses[rIdx]) remote.guesses[rIdx] = {};
            if (!remote.guesses[rIdx][this.clientId]?.locked) {
              remote.guesses[rIdx][this.clientId] = myLocalDraft;
            }
          }
          this.localRoomState = remote;
          this._emit();
        }
      } catch {
        // ignore
      }
    }, 1400);
  }

  _stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  _emit() {
    if (typeof this.onStateChange === 'function' && this.localRoomState) {
      this.onStateChange(this.localRoomState);
    }
  }

  leaveRoom() {
    this._stopPolling();
    this.roomCode = null;
    this.localRoomState = null;
  }
}
