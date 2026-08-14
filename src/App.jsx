import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Coins, Play, X, Check, Wallet, Clock, History as HistoryIcon,
  Send, Loader2, ShieldCheck, AlertCircle, RotateCcw, PauseCircle,
} from 'lucide-react';
import { MIN_TAKA, WITHDRAWALS_ENABLED } from './config.js';
import AD_POOL from './ads.js';

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
const C = {
  bg: '#0C1913',
  surface: '#142920',
  surfaceAlt: '#1B3327',
  border: '#2A4638',
  gold: '#D4A94A',
  goldDim: '#8C7038',
  seal: '#B23A2E',
  text: '#F3EFE2',
  textMuted: '#8FA396',
  success: '#4C9A6A',
  amber: '#C99A3A',
};

const DURATION = 7; // seconds, minimum watch time
const POINTS_PER_TAKA = 4;
const POINTS_PER_AD = 1;
const COOLDOWN_SECONDS = 30; // rest time before a watched ad can be tapped again

// Opens a link in the way that works best for the current context:
// inside Telegram it uses the Mini App SDK (no popup-blocker issues),
// otherwise it falls back to a normal new browser tab.
function openExternalLink(url) {
  if (!url) return;
  try {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
    if (tg?.openLink) {
      tg.openLink(url);
      return;
    }
  } catch {}
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ---------------------------------------------------------------------------
// Storage helpers
// NOTE: this uses the browser's localStorage, which is per-device only.
// Two phones opening the same Telegram account will NOT share balances.
// Swap these two functions for real API calls to your backend once you
// have one (see the "Database/Backend" step).
// ---------------------------------------------------------------------------
async function getOrDefault(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort; UI already reflects the change optimistically
  }
}

function taka(points) {
  return (points / POINTS_PER_TAKA).toFixed(2);
}
function maskBkash(num) {
  if (!num || num.length < 7) return num;
  return num.slice(0, 5) + '\u2022\u2022\u2022' + num.slice(-3);
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Ledger card (signature element)
// ---------------------------------------------------------------------------
function LedgerCard({ points }) {
  return (
    <div
      className="relative rounded-2xl p-[3px]"
      style={{ background: `linear-gradient(135deg, ${C.gold}66, ${C.border})` }}
    >
      <div className="rounded-2xl p-4" style={{ backgroundColor: C.surface }}>
        <div
          className="h-[6px] rounded-full mb-4"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${C.gold}33 0, ${C.gold}33 1px, transparent 1px, transparent 6px)`,
          }}
        />
        <div className="rounded-xl border p-4" style={{ borderColor: `${C.gold}40` }}>
          <div
            className="text-[10px] font-body font-semibold tracking-widest uppercase mb-1"
            style={{ color: C.textMuted }}
          >
            Available balance
          </div>
          <div className="flex items-end gap-2">
            <span className="font-display text-4xl font-semibold" style={{ color: C.text }}>
              {points}
            </span>
            <span className="text-sm font-body pb-1" style={{ color: C.textMuted }}>points</span>
          </div>
          <div className="font-mono text-sm mt-1" style={{ color: C.gold }}>
            &#2547; {taka(points)}
          </div>
        </div>
        <div
          className="h-[6px] rounded-full mt-4"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${C.gold}33 0, ${C.gold}33 1px, transparent 1px, transparent 6px)`,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ad watch modal
// ---------------------------------------------------------------------------
function AdModal({ ad, onClose, onComplete }) {
  const [remaining, setRemaining] = useState(DURATION);
  const [stage, setStage] = useState('playing'); // playing | verified
  const startRef = useRef(Date.now());
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const left = Math.max(0, DURATION - elapsed);
      setRemaining(left);
      if (left <= 0) {
        setStage('verified');
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (stage === 'verified') {
      const t = setTimeout(() => onComplete(ad), 850);
      return () => clearTimeout(t);
    }
  }, [stage, ad, onComplete]);

  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const progress = 1 - remaining / DURATION;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(6,12,9,0.72)' }}
        onClick={stage === 'playing' ? () => onClose() : undefined}
      />
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-6"
        style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-body tracking-widest uppercase" style={{ color: C.textMuted }}>
            Sponsored
          </div>
          {stage === 'playing' && (
            <button
              onClick={onClose}
              aria-label="Close ad"
              className="rounded-full p-1.5"
              style={{ backgroundColor: C.surface, color: C.textMuted }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div
          className="rounded-2xl h-36 flex items-end p-4 mb-5"
          style={{ background: `linear-gradient(160deg, ${ad.hue}, ${C.bg})` }}
        >
          <div>
            <div className="font-display text-xl font-semibold text-white">{ad.sponsor}</div>
            <div className="text-sm text-white/80 font-body">{ad.tagline}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-[130px] h-[130px]">
            <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
              <circle cx="65" cy="65" r={R} stroke={C.border} strokeWidth="8" fill="none" />
              <circle
                cx="65" cy="65" r={R}
                stroke={stage === 'verified' ? C.success : C.gold}
                strokeWidth="8" fill="none" strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {stage === 'verified' ? (
                <div
                  className="rounded-full p-3 border-2 animate-stamp"
                  style={{ borderColor: C.success, color: C.success }}
                >
                  <Check size={30} strokeWidth={3} />
                </div>
              ) : (
                <span className="font-mono text-3xl" style={{ color: C.text }}>
                  {Math.ceil(remaining)}
                </span>
              )}
            </div>
          </div>
          <div className="text-xs font-body mt-3 text-center" style={{ color: C.textMuted }}>
            {stage === 'verified'
              ? 'Verified \u2014 crediting your point\u2026'
              : `Link opened in another tab \u2014 come back and wait ${DURATION}s to earn ${POINTS_PER_AD} point`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function Toast({ toast }) {
  if (!toast) return null;
  const color = toast.type === 'error' ? C.seal : toast.type === 'info' ? C.textMuted : C.success;
  return (
    <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
      <div
        className="animate-toast rounded-full px-4 py-2 text-sm font-body flex items-center gap-2 max-w-md"
        style={{ backgroundColor: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text }}
      >
        <span style={{ color }}>&#9679;</span>
        {toast.text}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------
export default function PoyshaApp() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [watched, setWatched] = useState([]); // [{id, sponsor, ts}]
  const [withdrawals, setWithdrawals] = useState([]);
  const [cooldowns, setCooldowns] = useState({}); // { [adId]: timestamp when watchable again }
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState('earn');
  const [activeAd, setActiveAd] = useState(null);
  const [toast, setToast] = useState(null);

  const [bkashNumber, setBkashNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Ticks once a second so cooldown countdowns on the ad cards stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
      let resolvedUser = null;
      if (tg?.initDataUnsafe?.user) {
        try { tg.ready(); tg.expand(); } catch {}
        const u = tg.initDataUnsafe.user;
        resolvedUser = { id: String(u.id), name: u.first_name || u.username || 'Friend' };
      } else {
        const existing = await getOrDefault('guest-profile', null);
        if (existing) {
          resolvedUser = existing;
        } else {
          resolvedUser = { id: 'guest-' + Math.random().toString(36).slice(2, 10), name: 'Guest' };
          await saveKey('guest-profile', resolvedUser);
        }
      }
      setUser(resolvedUser);
      // NOTE: points/watched/withdrawals are currently keyed by localStorage only
      // (not by resolvedUser.id), so this is single-user-per-device. Once you add
      // a backend, key everything by resolvedUser.id server-side.
      const [pts, w, wd, cd] = await Promise.all([
        getOrDefault('points', 0),
        getOrDefault('watched-ads', []),
        getOrDefault('withdrawals', []),
        getOrDefault('ad-cooldowns', {}),
      ]);
      setPoints(pts);
      setWatched(w);
      setWithdrawals(wd);
      setCooldowns(cd);
      setLoading(false);
    })();
  }, []);

  const handleCloseEarly = useCallback(() => {
    setActiveAd(null);
    setToast({ type: 'error', text: 'Closed early \u2014 no point awarded' });
  }, []);

  const handleAdComplete = useCallback((ad) => {
    setActiveAd(null);
    setWatched((prev) => {
      const next = [...prev, { id: ad.id, sponsor: ad.sponsor, ts: Date.now() }];
      saveKey('watched-ads', next);
      return next;
    });
    setPoints((prev) => {
      const next = prev + POINTS_PER_AD;
      saveKey('points', next);
      return next;
    });
    setCooldowns((prev) => {
      const next = { ...prev, [ad.id]: Date.now() + COOLDOWN_SECONDS * 1000 };
      saveKey('ad-cooldowns', next);
      return next;
    });
    setToast({ type: 'success', text: `+${POINTS_PER_AD} point verified` });
  }, []);

  const handleWithdraw = async () => {
    setWithdrawError('');
    const amt = parseFloat(withdrawAmount);
    if (!/^01[3-9]\d{8}$/.test(bkashNumber)) {
      setWithdrawError('Enter a valid 11-digit bKash number.');
      return;
    }
    if (!amt || amt < MIN_TAKA) {
      setWithdrawError(`Minimum withdrawal is \u09F3${MIN_TAKA}.`);
      return;
    }
    const pointsNeeded = Math.round(amt * POINTS_PER_TAKA);
    if (pointsNeeded > points) {
      setWithdrawError('Not enough points for that amount.');
      return;
    }
    const record = {
      id: 'wd-' + Date.now(),
      amountTaka: amt,
      pointsSpent: pointsNeeded,
      bkashNumber,
      status: 'pending',
      ts: Date.now(),
    };
    const nextPoints = points - pointsNeeded;
    const nextWithdrawals = [record, ...withdrawals];
    setPoints(nextPoints);
    setWithdrawals(nextWithdrawals);
    setBkashNumber('');
    setWithdrawAmount('');
    await Promise.all([saveKey('points', nextPoints), saveKey('withdrawals', nextWithdrawals)]);
    setToast({ type: 'success', text: 'Withdrawal request submitted' });
  };

  const handleReset = async () => {
    await Promise.all([
      saveKey('points', 0),
      saveKey('watched-ads', []),
      saveKey('withdrawals', []),
      saveKey('ad-cooldowns', {}),
    ]);
    setPoints(0);
    setWatched([]);
    setWithdrawals([]);
    setCooldowns({});
    setToast({ type: 'info', text: 'Demo progress reset' });
  };

  // All 5 ads stay visible forever \u2014 each just enters its own cooldown
  // after being watched, instead of disappearing from the list.
  const availableAds = AD_POOL;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <Loader2 className="animate-spin" size={28} style={{ color: C.gold }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body flex justify-center" style={{ backgroundColor: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Manrope', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        @keyframes stampIn {
          0% { transform: scale(1.6) rotate(-18deg); opacity: 0; }
          60% { transform: scale(0.92) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(-6deg); opacity: 1; }
        }
        .animate-stamp { animation: stampIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes toastIn {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-toast { animation: toastIn 0.25s ease-out both; }
        input::placeholder { color: ${C.textMuted}; opacity: 0.7; }
      `}</style>

      <div className="w-full max-w-md flex flex-col min-h-screen relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="rounded-full p-2 border"
              style={{ borderColor: `${C.gold}55`, backgroundColor: C.surface }}
            >
              <Coins size={18} style={{ color: C.gold }} />
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-tight" style={{ color: C.text }}>
                Poysha
              </div>
              <div className="text-[11px]" style={{ color: C.textMuted }}>
                Hi, {user?.name || 'Friend'}
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-1 text-[11px] rounded-full px-2.5 py-1 border"
            style={{ borderColor: C.border, color: C.textMuted }}
          >
            <ShieldCheck size={12} style={{ color: C.success }} />
            Beta
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {tab === 'earn' && (
            <>
              <LedgerCard points={points} />
              <div
                className="text-[10px] tracking-widest uppercase font-semibold mt-6 mb-3"
                style={{ color: C.textMuted }}
              >
                Watch to earn
              </div>
              {availableAds.length === 0 ? (
                <div
                  className="rounded-2xl border p-6 text-center"
                  style={{ borderColor: C.border, backgroundColor: C.surface }}
                >
                  <div className="font-display text-base mb-1" style={{ color: C.text }}>
                    No ads available
                  </div>
                  <div className="text-xs" style={{ color: C.textMuted }}>
                    Check back soon.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {availableAds.map((ad) => {
                    const cooldownUntil = cooldowns[ad.id] || 0;
                    const secondsLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
                    const isResting = secondsLeft > 0;
                    return (
                      <button
                        key={ad.id}
                        disabled={isResting}
                        onClick={() => {
                          if (isResting) return;
                          openExternalLink(ad.url);
                          setActiveAd(ad);
                        }}
                        className="rounded-2xl border p-3 flex items-center gap-3 text-left"
                        style={{
                          borderColor: C.border,
                          backgroundColor: C.surface,
                          opacity: isResting ? 0.5 : 1,
                          cursor: isResting ? 'default' : 'pointer',
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex-shrink-0"
                          style={{ background: `linear-gradient(160deg, ${ad.hue}, ${C.bg})` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate" style={{ color: C.text }}>
                            {ad.sponsor}
                          </div>
                          <div className="text-xs truncate" style={{ color: C.textMuted }}>
                            {isResting ? `Resting \u2014 back in ${secondsLeft}s` : ad.tagline}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isResting ? (
                            <div
                              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
                              style={{ backgroundColor: C.surfaceAlt, color: C.textMuted }}
                            >
                              <Clock size={11} /> {secondsLeft}s
                            </div>
                          ) : (
                            <div
                              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
                              style={{ backgroundColor: C.surfaceAlt, color: C.gold }}
                            >
                              <Play size={11} /> {DURATION}s
                            </div>
                          )}
                          <div className="text-[10px]" style={{ color: C.textMuted }}>
                            +{POINTS_PER_AD} pt
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'wallet' && (
            <>
              <LedgerCard points={points} />
              <div
                className="text-[10px] tracking-widest uppercase font-semibold mt-6 mb-3"
                style={{ color: C.textMuted }}
              >
                Withdraw via bKash
              </div>
              {WITHDRAWALS_ENABLED ? (
                <div
                  className="rounded-2xl border p-4 flex flex-col gap-3"
                  style={{ borderColor: C.border, backgroundColor: C.surface }}
                >
                  <div>
                    <label className="text-[11px]" style={{ color: C.textMuted }}>bKash number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="01XXXXXXXXX"
                      value={bkashNumber}
                      onChange={(e) => setBkashNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className="w-full mt-1 rounded-xl px-3 py-2.5 text-sm font-mono outline-none"
                      style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px]" style={{ color: C.textMuted }}>
                      Amount (&#2547; taka \u00b7 min {MIN_TAKA})
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full mt-1 rounded-xl px-3 py-2.5 text-sm font-mono outline-none"
                      style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                    />
                    {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                      <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>
                        = {Math.round(parseFloat(withdrawAmount) * POINTS_PER_TAKA)} points
                      </div>
                    )}
                  </div>
                  {withdrawError && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: C.seal }}>
                      <AlertCircle size={13} /> {withdrawError}
                    </div>
                  )}
                  <button
                    onClick={handleWithdraw}
                    className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
                    style={{ backgroundColor: C.gold, color: '#1B2B22' }}
                  >
                    <Send size={15} /> Request withdrawal
                  </button>
                  <div className="text-[10px] leading-relaxed" style={{ color: C.textMuted }}>
                    Saved on this device for now. Sending real money needs a backend wired to bKash&#8217;s
                    Merchant API \u2014 that&#8217;s the next step.
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-2xl border p-6 text-center flex flex-col items-center gap-2"
                  style={{ borderColor: C.border, backgroundColor: C.surface }}
                >
                  <PauseCircle size={22} style={{ color: C.amber }} />
                  <div className="font-display text-base" style={{ color: C.text }}>
                    Withdrawals are paused
                  </div>
                  <div className="text-xs" style={{ color: C.textMuted }}>
                    Your points are safe \u2014 check back soon.
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'history' && (
            <>
              <div
                className="text-[10px] tracking-widest uppercase font-semibold mt-2 mb-3"
                style={{ color: C.textMuted }}
              >
                Ads watched
              </div>
              {watched.length === 0 ? (
                <div className="text-xs mb-6" style={{ color: C.textMuted }}>
                  Nothing yet \u2014 watch an ad to see it here.
                </div>
              ) : (
                <div className="flex flex-col gap-2 mb-6">
                  {[...watched].reverse().map((w) => (
                    <div
                      key={w.id + w.ts}
                      className="rounded-xl border px-3 py-2.5 flex items-center justify-between"
                      style={{ borderColor: C.border, backgroundColor: C.surface }}
                    >
                      <div>
                        <div className="text-sm font-semibold" style={{ color: C.text }}>{w.sponsor}</div>
                        <div className="text-[11px]" style={{ color: C.textMuted }}>{timeAgo(w.ts)}</div>
                      </div>
                      <div className="text-xs font-mono" style={{ color: C.success }}>+1 pt</div>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="text-[10px] tracking-widest uppercase font-semibold mb-3"
                style={{ color: C.textMuted }}
              >
                Withdrawals
              </div>
              {withdrawals.length === 0 ? (
                <div className="text-xs mb-6" style={{ color: C.textMuted }}>
                  No withdrawal requests yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2 mb-6">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-xl border px-3 py-2.5 flex items-center justify-between"
                      style={{ borderColor: C.border, backgroundColor: C.surface }}
                    >
                      <div>
                        <div className="text-sm font-mono" style={{ color: C.text }}>
                          {maskBkash(w.bkashNumber)}
                        </div>
                        <div className="text-[11px]" style={{ color: C.textMuted }}>{timeAgo(w.ts)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: C.text }}>
                          &#2547;{w.amountTaka}
                        </div>
                        <div
                          className="text-[10px] rounded-full px-2 py-0.5 mt-0.5 inline-block"
                          style={{ backgroundColor: C.surfaceAlt, color: C.amber }}
                        >
                          {w.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[11px] mt-2"
                style={{ color: C.textMuted }}
              >
                <RotateCcw size={12} /> Reset demo progress
              </button>
            </>
          )}
        </div>

        {/* Tab bar */}
        <div
          className="fixed bottom-0 left-0 right-0 flex justify-center border-t"
          style={{ borderColor: C.border, backgroundColor: C.surfaceAlt }}
        >
          <div className="w-full max-w-md flex">
            {[
              { key: 'earn', label: 'Earn', icon: Play },
              { key: 'wallet', label: 'Wallet', icon: Wallet },
              { key: 'history', label: 'History', icon: HistoryIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex-1 flex flex-col items-center gap-1 py-3"
                style={{ color: tab === key ? C.gold : C.textMuted }}
              >
                <Icon size={18} />
                <span className="text-[10px] font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeAd && (
          <AdModal ad={activeAd} onClose={handleCloseEarly} onComplete={handleAdComplete} />
        )}
        <Toast toast={toast} />
      </div>
    </div>
  );
}
