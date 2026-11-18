import { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingBag, Search, X, Plus, Minus, Clock, ChefHat, Check, Copy, RotateCcw, Truck, MessageCircle, LogOut, Utensils, Upload, FileText, Sun, Moon } from 'lucide-react';
import { supabase } from './supabaseClient';
import { TOWERS, WA_NUMBER, STAFF_USER, STAFF_PASS, STAGES, SLOTS, ADDONS, SABZIS, PHOTO_PRESETS, CATEGORIES, THALIS0, MENU0 } from './data';

const API = import.meta.env.VITE_API_URL || '';
const inr = (n) => `₹${n}`;
// ---- timing helpers: times are stored as "8:45 PM" text; <input type="time"> uses "20:45" ----
const to24 = (label) => { const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label || ''); if (!m) return ''; let h = Number(m[1]) % 12; if (m[3].toUpperCase() === 'PM') h += 12; return `${String(h).padStart(2, '0')}:${m[2]}`; };
const to12 = (v) => { if (!v) return ''; const [H, M] = v.split(':').map(Number); return `${H % 12 || 12}:${String(M).padStart(2, '0')} ${H >= 12 ? 'PM' : 'AM'}`; };
const addMins = (v, n) => { const [H, M] = v.split(':').map(Number); const t = Math.min(23 * 60 + 59, H * 60 + M + n); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
const CFG_DEFAULTS = { open: '6:00 PM', cutoff: '8:45 PM', instantMins: 30, slots: SLOTS.slice(1), demo: true, counter: 101, menuImg: null };
const cx = (...a) => a.filter(Boolean).join(' ');
const btn = 'rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';
const btnP = `${btn} bg-chili text-white hover:bg-red-700`;
const btnD = `${btn} bg-ink text-paper hover:bg-ink/90`;
const btnO = `${btn} border border-ink/25 hover:bg-mist`;
const field = 'w-full rounded-lg border border-ink/25 bg-card text-ink placeholder:text-ink/50 px-3 py-2 text-sm';

function useLS(key, init) {
  const [v, setV] = useState(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage full */ } }, [key, v]);
  return [v, setV];
}
async function api(path, method, body) {
  const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return r.json();
}
const toRow = (o) => ({ token: o.token, resident_name: o.name, resident_phone: o.phone, tower: o.tower, flat: o.flat, delivery_slot: o.slot, payment_method: o.payMethod, payment_status: o.payStatus, razorpay_order_id: o.rzpOrderId || null, razorpay_payment_id: o.rzpPaymentId || null, total_inr: o.total, status: o.status, items: o.items });
const fromRow = (r) => ({ id: r.id, dbId: r.id, token: r.token, name: r.resident_name, phone: r.resident_phone, tower: r.tower, flat: r.flat, slot: r.delivery_slot, payMethod: r.payment_method, payStatus: r.payment_status, rzpOrderId: r.razorpay_order_id, rzpPaymentId: r.razorpay_payment_id, total: r.total_inr, status: r.status, items: r.items, at: new Date(r.created_at).getTime() });

const atLabel = (label, base, fallback) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label || '');
  const d = new Date(base);
  if (!m) { d.setHours(fallback[0], fallback[1], 0, 0); return d; }
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  d.setHours(h, Number(m[2]), 0, 0);
  return d;
};
function useCountdown(cutoff, open) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const end = atLabel(cutoff, now, [20, 45]);
  const start = atLabel(open, now, [18, 0]);
  const left = end - now;
  const s = Math.max(0, Math.floor(left / 1000));
  const fmt = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, '0')).join(':');
  return { open: now >= start && left > 0, before: now < start, fmt };
}

const orderText = (o) => `*Molly's Kitchen — Migsun Twiinz*\nOrder ${o.token}\n${o.name} • ${o.tower}, Flat ${o.flat}\nSlot: ${o.slot}\n\n${o.items.map((i) => `${i.qty} x ${i.name}${i.opts ? ` (${i.opts})` : ''} = ${inr(i.price * i.qty)}`).join('\n')}\n\nDelivery: FREE\n*Total: ${inr(o.total)}* (${o.payMethod} — ${o.payStatus})`;
const waLink = (num, text) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div onClick={(e) => e.stopPropagation()} className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-paper p-5 sm:rounded-2xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-mist"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
const VegDot = ({ veg }) => (
  <span title={veg ? 'Veg' : 'Contains egg'} className={cx('inline-flex h-4 w-4 items-center justify-center rounded-sm border-2', veg ? 'border-leaf' : 'border-chili')}>
    <span className={cx('h-2 w-2 rounded-full', veg ? 'bg-leaf' : 'bg-chili')} />
  </span>
);
const Qty = ({ qty, onChange }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-ink/25 px-1">
    <button aria-label="Less" onClick={() => onChange(qty - 1)} className="p-1"><Minus size={14} /></button>
    <span className="w-5 text-center text-sm font-bold">{qty}</span>
    <button aria-label="More" onClick={() => onChange(qty + 1)} className="p-1"><Plus size={14} /></button>
  </div>
);
const Photo = ({ src, alt }) => (src && src.startsWith('data:') ? (
  <img src={src} alt={alt} className="h-44 w-full bg-mist object-cover" />
) : null);

/* ------------------------------ RESIDENT ------------------------------ */
function LoginModal({ onDone, onClose }) {
  const real = !!supabase; // real email OTP when Supabase is connected; on-screen demo OTP only in offline mode
  const [f, setF] = useState({ name: '', phone: '', email: '', tower: 'SUN 1', flat: '' });
  const [stage, setStage] = useState('form');
  const [demoOtp, setDemoOtp] = useState(null);
  const [typed, setTyped] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [cool, setCool] = useState(0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { if (cool <= 0) return undefined; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);

  const friendly = (m = '') => {
    const x = m.toLowerCase();
    if (x.includes('rate limit') || x.includes('security purposes')) return 'Too many codes requested. Please wait a minute and try again.';
    if (x.includes('not authorized')) return 'This email address cannot receive codes yet. The kitchen needs to finish the email setup.';
    if (x.includes('expired') || x.includes('invalid')) return 'That code is wrong or has expired. Check it or request a new one.';
    return m || 'Something went wrong. Please try again.';
  };
  const send = async () => {
    const email = f.email.trim().toLowerCase();
    if (!f.name.trim() || !/^[6-9]\d{9}$/.test(f.phone) || !f.flat.trim()) return setErr('Enter your name, a valid 10-digit mobile number and your flat number.');
    if (real && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('Enter a valid email address. We will send your code there.');
    setErr(''); setBusy(true);
    if (real) {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      setBusy(false);
      if (error) return setErr(friendly(error.message));
      setCool(60);
    } else { setBusy(false); setDemoOtp(String(100000 + Math.floor(Math.random() * 900000))); }
    setTyped(''); setStage('code');
  };
  const verify = async () => {
    const code = typed.trim();
    if (!code) return setErr('Enter the code.');
    setErr(''); setBusy(true);
    const done = () => onDone({ name: f.name.trim(), phone: f.phone, email: f.email.trim().toLowerCase(), tower: f.tower, flat: f.flat.trim() });
    if (real) {
      const { error } = await supabase.auth.verifyOtp({ email: f.email.trim().toLowerCase(), token: code, type: 'email' });
      setBusy(false);
      if (error) return setErr(friendly(error.message));
      supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      return done();
    }
    setBusy(false);
    return code === demoOtp ? done() : setErr('That OTP does not match. Try again.');
  };
  return (
    <Modal title="Sign in to order" onClose={onClose}>
      {stage === 'form' ? (
        <div className="space-y-3">
          <input className={field} placeholder="Your name" value={f.name} onChange={set('name')} />
          <input className={field} placeholder="10-digit mobile number (for delivery)" inputMode="numeric" maxLength={10} value={f.phone} onChange={set('phone')} />
          {real && <input className={field} type="email" placeholder="Email address (we send your code here)" autoComplete="email" value={f.email} onChange={set('email')} />}
          <div className="grid grid-cols-2 gap-3">
            <select className={field} value={f.tower} onChange={set('tower')}>{TOWERS.map((t) => <option key={t}>{t}</option>)}</select>
            <input className={field} placeholder="Flat number" value={f.flat} onChange={set('flat')} />
          </div>
          {!real && <p className="text-xs text-ink/60">Demo mode: no email service is connected, so the code is shown on screen.</p>}
          {err && <p className="text-sm text-chili">{err}</p>}
          <button className={cx(btnP, 'w-full')} disabled={busy} onClick={send}>{busy ? 'Sending…' : real ? 'Email me a code' : 'Send OTP'}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {real ? <p className="text-sm">We sent a code to <b>{f.email.trim().toLowerCase()}</b>. Check your inbox (and spam folder).</p> : (
            <div className="flex items-center justify-between rounded-lg bg-haldi/30 p-3 text-sm">
              <span>Demo OTP: <b className="tracking-widest">{demoOtp}</b></span>
              <button className="font-bold underline" onClick={() => setTyped(demoOtp)}>Auto-fill</button>
            </div>
          )}
          <input className={cx(field, 'text-center text-xl tracking-[0.4em]')} maxLength={8} inputMode="numeric" autoComplete="one-time-code" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && verify()} placeholder="------" />
          {err && <p className="text-sm text-chili">{err}</p>}
          <button className={cx(btnP, 'w-full')} disabled={busy} onClick={verify}>{busy ? 'Checking…' : 'Verify and continue'}</button>
          <div className="flex justify-between text-sm">
            <button className="underline" onClick={() => { setStage('form'); setErr(''); }}>Change details</button>
            {real && <button className="underline disabled:opacity-40 disabled:no-underline" disabled={cool > 0 || busy} onClick={send}>{cool > 0 ? `Resend in ${cool}s` : 'Resend code'}</button>}
          </div>
        </div>
      )}
    </Modal>
  );
}

function ThaliCard({ t, orderable, openLabel, onAdd, inCart }) {
  const pct = Math.round((t.left / t.total) * 100);
  const soldOut = t.left <= 0;
  return (
    <article className="overflow-hidden rounded-2xl border border-ink/15 bg-card">
      <Photo src={t.img} alt={t.title} />
      <div className="space-y-2 p-4">
        <span className="inline-block rounded-full bg-haldi px-3 py-0.5 text-xs font-bold text-[#1D2B24]">{t.badge}</span>
        <h3 className="font-display text-lg font-bold leading-tight">{t.title}</h3>
        {t.sabzi && <p className="text-sm font-semibold text-chili">Tonight's sabzi: {t.sabzi}</p>}
        <p className="text-sm text-ink/70">{t.base}</p>
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-mist"><div className={cx('h-full', pct < 30 ? 'bg-chili' : 'bg-leaf')} style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs text-ink/70">{soldOut ? 'Sold out for tonight' : `${t.left} of ${t.total} plates left`}</p>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-display text-2xl font-extrabold">{inr(t.price)}</span>
          <button className={btnP} disabled={!orderable || soldOut || inCart >= t.left} onClick={() => onAdd(t)}>
            {soldOut ? 'Sold out' : orderable ? (inCart ? `Add another (${inCart})` : 'Add to cart') : `Opens ${openLabel}`}
          </button>
        </div>
      </div>
    </article>
  );
}

function CustomizeModal({ item, onAdd, onClose }) {
  const [sel, setSel] = useState([]);
  const [note, setNote] = useState('');
  const [qty, setQty] = useState(1);
  const picked = ADDONS.filter((a) => sel.includes(a.id));
  const unit = item.price + picked.reduce((s, a) => s + a.price, 0);
  return (
    <Modal title={item.name} onClose={onClose}>
      <p className="mb-3 text-sm text-ink/70">{item.desc}</p>
      <div className="space-y-2">
        {ADDONS.map((a) => (
          <label key={a.id} className="flex items-center justify-between rounded-lg border border-ink/15 p-2 text-sm">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={sel.includes(a.id)} onChange={() => setSel(sel.includes(a.id) ? sel.filter((x) => x !== a.id) : [...sel, a.id])} />
              {a.label}
            </span>
            <b>{a.price ? `+${inr(a.price)}` : 'Free'}</b>
          </label>
        ))}
        <textarea className={field} rows={2} placeholder="Special cooking note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Qty qty={qty} onChange={(q) => setQty(Math.max(1, q))} />
        <button className={btnP} onClick={() => onAdd({ item, qty, unit, opts: [...picked.map((a) => a.label), note.trim()].filter(Boolean).join(', ') })}>Add {inr(unit * qty)}</button>
      </div>
    </Modal>
  );
}

function RazorpaySim({ amount, onPay, onClose }) {
  const [tab, setTab] = useState('UPI');
  const [busy, setBusy] = useState(false);
  const pay = () => { setBusy(true); setTimeout(() => onPay({ razorpay_order_id: `order_DEMO_${Date.now()}`, razorpay_payment_id: `pay_DEMO_${Math.random().toString(36).slice(2, 10)}` }), 1200); };
  return (
    <Modal title="Razorpay Checkout (test mode)" onClose={onClose}>
      <p className="mb-3 text-sm">Paying <b>{inr(amount)}</b> to Molly's Kitchen</p>
      <div className="mb-3 flex gap-2">{['UPI', 'Card', 'Netbanking'].map((t) => <button key={t} onClick={() => setTab(t)} className={cx(btn, tab === t ? 'bg-ink text-paper' : 'border border-ink/25')}>{t}</button>)}</div>
      <input className={field} placeholder={tab === 'UPI' ? 'yourname@upi' : tab === 'Card' ? '4111 1111 1111 1111' : 'Choose your bank'} />
      <button className={cx(btnP, 'mt-4 w-full')} disabled={busy} onClick={pay}>{busy ? 'Processing…' : `Pay ${inr(amount)}`}</button>
    </Modal>
  );
}

function Tracker({ status }) {
  const idx = STAGES.indexOf(status);
  return (
    <ol className="mt-3 grid grid-cols-4 gap-1">
      {STAGES.map((s, i) => (
        <li key={s} className="text-center">
          <div className={cx('mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', i <= idx ? 'bg-leaf text-white' : 'bg-mist text-ink/50')}>{i <= idx ? <Check size={14} /> : i + 1}</div>
          <p className={cx('mt-1 text-[11px] leading-tight', i === idx ? 'font-bold' : 'text-ink/60')}>{s}</p>
        </li>
      ))}
    </ol>
  );
}

function Resident({ ctx }) {
  const { resident, setResident, menu, thalis, setThalis, cfg, setCfg, orders, setOrders, placeOrder, health } = ctx;
  const [cart, setCart] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [pureVeg, setPureVeg] = useState(false);
  const [login, setLogin] = useState(false);
  const [custom, setCustom] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuCard, setMenuCard] = useState(false);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [pay, setPay] = useState('Cash on Delivery');
  const [sim, setSim] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [tab, setTab] = useState('shop');
  const [busy, setBusy] = useState(false);
  const cd = useCountdown(cfg.cutoff, cfg.open);
  const instant = `Instant Fast-Food (${cfg.instantMins} mins)`;
  const orderable = cfg.demo || cd.open;

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  // Slot rules: fast food only -> Instant (30 mins) only; any thali (alone or with fast food) -> scheduled dinner slots only.
  const hasThali = cart.some((i) => i.type === 'thali');
  const hasFood = cart.some((i) => i.type === 'item');
  const allowedSlots = hasFood && !hasThali ? [instant] : (cfg.slots.length ? cfg.slots : [instant]);
  const slotSel = allowedSlots.includes(slot) ? slot : allowedSlots[0];
  const addCart = (line) => setCart((c) => { const k = c.findIndex((x) => x.key === line.key); return k >= 0 ? c.map((x, j) => (j === k ? { ...x, qty: x.qty + line.qty } : x)) : [...c, line]; });
  const setLineQty = (key, qty) => setCart((c) => (qty <= 0 ? c.filter((x) => x.key !== key) : c.map((x) => (x.key === key ? { ...x, qty } : x))));
  const needLogin = (fn) => (resident ? fn() : setLogin(true));

  const shown = useMemo(() => menu.filter((m) => (cat === 'All' || m.category === cat) && (!pureVeg || m.veg) && m.name.toLowerCase().includes(q.toLowerCase())), [menu, cat, pureVeg, q]);
  const myOrders = orders.filter((o) => resident && (o.phone === resident.phone || (o.tower === resident.tower && o.flat === resident.flat))).sort((a, b) => b.at - a.at);

  const finalize = async (payInfo) => {
    const o = await placeOrder({ cart, total, slot: slotSel, payMethod: pay, payInfo });
    if (!o) return;
    setCart([]); setCartOpen(false); setSim(false); setReceipt(o); setTab('orders');
  };
  const checkout = async () => {
    if (!resident) return setLogin(true);
    if (pay === 'Cash on Delivery') return finalize(null);
    if (API && health?.razorpayConnected) {
      setBusy(true);
      try {
        if (!window.Razorpay) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = res; s.onerror = rej; document.body.appendChild(s); });
        const o = await api('/api/payment/create-order', 'POST', { amountInr: total, residentName: resident.name, phone: resident.phone, tower: resident.tower, flat: resident.flat });
        if (!o.id || !o.key_id) throw new Error('Payment server not ready');
        const rz = new window.Razorpay({
          key: o.key_id, amount: o.amount, currency: 'INR', order_id: o.id, name: "Molly's Kitchen", description: 'Dinner order', prefill: { name: resident.name, contact: resident.phone },
          theme: { color: '#D8392B' },
          modal: { ondismiss: () => setBusy(false) },
          handler: async (r) => {
            try {
              const v = await api('/api/payment/verify', 'POST', r);
              if (v.verified) await finalize(r);
              else alert(`Payment could not be verified. If money was deducted, quote payment ID ${r.razorpay_payment_id} to the kitchen.`);
            } catch { alert(`Could not confirm payment. Quote payment ID ${r.razorpay_payment_id} to the kitchen.`); }
            setBusy(false);
          }
        });
        rz.on('payment.failed', (e) => { setBusy(false); alert(`Payment failed: ${e.error?.description || 'please try again or choose Cash on Delivery.'}`); });
        rz.open();
      } catch { setBusy(false); alert('Could not reach the payment server. Choose Cash on Delivery or try again.'); }
    } else setSim(true);
  };
  const reorder = (o) => { setCart(o.items.map((i) => ({ ...i }))); setCartOpen(true); setTab('shop'); };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28">
      <div className="mt-4 flex gap-2">
        <button className={cx(btn, tab === 'shop' ? 'bg-ink text-paper' : 'border border-ink/25')} onClick={() => setTab('shop')}>Order food</button>
        <button className={cx(btn, tab === 'orders' ? 'bg-ink text-paper' : 'border border-ink/25')} onClick={() => needLogin(() => setTab('orders'))}>My orders {myOrders.length ? `(${myOrders.length})` : ''}</button>
        <div className="ml-auto text-sm">{resident ? <button className="underline" onClick={() => setResident(null)}>{resident.name} · {resident.tower}-{resident.flat} · Sign out</button> : <button className={btnD} onClick={() => setLogin(true)}>Sign in</button>}</div>
      </div>

      {tab === 'shop' && (
        <>
          <section className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Tonight's Dinner @ ₹139</h1>
                <p className="text-sm text-ink/70">Freshly cooked • Homemade • Delicious. Free delivery to SUN 1–SUN 10.</p>
              </div>
              <div className={cx('rounded-xl px-4 py-2 text-sm font-semibold', orderable ? 'bg-leaf text-white' : 'bg-ink text-paper')}>
                <Clock size={14} className="mr-1 inline" />
                {cd.before && !cfg.demo ? `Booking opens at ${cfg.open}` : cd.open || cfg.demo ? `Dinner orders close in ${cd.open ? cd.fmt : '--'} (${cfg.cutoff})` : `Dinner orders closed (${cfg.cutoff})`}
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {thalis.filter((t) => t.active).map((t) => (
                <ThaliCard key={t.id} t={t} orderable={orderable} openLabel={cfg.open} inCart={cart.find((c) => c.id === t.id)?.qty || 0}
                  onAdd={() => addCart({ key: t.id, id: t.id, type: 'thali', name: t.sabzi ? `${t.sabzi} Thali` : 'Chole Puri Thali', price: t.price, qty: 1 })} />
              ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-bold">Fast food menu</h2>
              <button className={btnO} onClick={() => setMenuCard(true)}><FileText size={14} className="mr-1 inline" />View full menu card</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-2.5 text-ink/50" /><input className={cx(field, 'pl-9')} placeholder="Search dishes" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <label className="flex items-center gap-2 rounded-lg border border-ink/25 px-3 text-sm"><input type="checkbox" checked={pureVeg} onChange={() => setPureVeg(!pureVeg)} />Pure veg only</label>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {['All', ...CATEGORIES].map((c) => <button key={c} onClick={() => setCat(c)} className={cx(btn, 'shrink-0', cat === c ? 'bg-ink text-paper' : 'border border-ink/25')}>{c}</button>)}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {shown.map((m) => (
                <div key={m.id} className={cx('flex items-center gap-3 rounded-xl border border-ink/15 bg-card p-3', !m.inStock && 'opacity-50')}>
                  {m.img && <img src={m.img} alt={m.name} loading="lazy" className="h-20 w-20 shrink-0 rounded-lg object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><VegDot veg={m.veg} /><h3 className="truncate font-semibold">{m.name}</h3></div>
                    <p className="text-xs text-ink/65">{m.category} · {m.desc}</p>
                    <p className="mt-1 font-display text-lg font-bold">{inr(m.price)}</p>
                  </div>
                  <button className={btnP} disabled={!m.inStock} onClick={() => setCustom(m)}>{m.inStock ? 'Add' : 'Sold out'}</button>
                </div>
              ))}
              {!shown.length && <p className="text-sm text-ink/60">No dishes match. Clear the search or filters.</p>}
            </div>
          </section>
        </>
      )}

      {tab === 'orders' && (
        <section className="mt-6 space-y-4">
          <h2 className="font-display text-2xl font-bold">My orders</h2>
          {!myOrders.length && <p className="text-sm text-ink/60">No orders yet. Pick something from tonight's menu.</p>}
          {myOrders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-ink/15 bg-card p-4">
              <div className="flex items-center justify-between"><b className="font-display text-lg">{o.token}</b><span className="text-sm">{inr(o.total)} · {o.payMethod} ({o.payStatus})</span></div>
              <p className="text-sm text-ink/70">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
              <p className="text-xs text-ink/60">Slot: {o.slot}</p>
              {o.status === 'Cancelled' ? <p className="mt-3 rounded-lg bg-chili/15 p-2 text-sm font-semibold text-chili">Cancelled by the kitchen · Payment: {o.payStatus}</p> : <Tracker status={o.status} />}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={btnO} onClick={() => setReceipt(o)}>Receipt</button>
                <a className={btnO} target="_blank" rel="noreferrer" href={waLink(WA_NUMBER, orderText(o))}><MessageCircle size={14} className="mr-1 inline" />Send on WhatsApp</a>
                <button className={btnO} onClick={() => reorder(o)}><RotateCcw size={14} className="mr-1 inline" />Reorder</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {count > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-chili px-6 py-3 font-bold text-white shadow-lg">
          <ShoppingBag size={18} /> {count} item{count > 1 ? 's' : ''} · {inr(total)} · View cart
        </button>
      )}

      {cartOpen && (
        <Modal title="Your cart" onClose={() => setCartOpen(false)}>
          {!cart.length ? <p className="text-sm">Your cart is empty.</p> : (
            <div className="space-y-4">
              {cart.map((i) => (
                <div key={i.key} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0"><p className="font-semibold">{i.name}</p>{i.opts && <p className="text-xs text-ink/60">{i.opts}</p>}<p>{inr(i.price)}</p></div>
                  <Qty qty={i.qty} onChange={(n) => setLineQty(i.key, n)} />
                </div>
              ))}
              <div>
                <p className="mb-1 text-sm font-semibold"><Truck size={14} className="mr-1 inline" />Delivery slot</p>
                <select className={field} value={slotSel} disabled={allowedSlots.length === 1} onChange={(e) => setSlot(e.target.value)}>{allowedSlots.map((s) => <option key={s}>{s}</option>)}</select>
                <p className="mt-1 text-xs text-ink/60">{hasThali ? (hasFood ? 'Your order has a thali, so everything arrives in your chosen dinner slot.' : 'Dinner thalis are delivered in these scheduled slots.') : 'Fast-food orders are delivered instantly, in about 30 minutes.'}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold">Payment</p>
                <div className="grid grid-cols-2 gap-2">{['Razorpay Online', 'Cash on Delivery'].map((p) => <button key={p} onClick={() => setPay(p)} className={cx(btn, pay === p ? 'bg-ink text-paper' : 'border border-ink/25')}>{p}</button>)}</div>
              </div>
              <div className="space-y-1 border-t border-ink/15 pt-3 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{inr(total)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><b className="text-leaf">FREE (₹0)</b></div>
                <div className="flex justify-between font-display text-xl font-extrabold"><span>Total</span><span>{inr(total)}</span></div>
              </div>
              <button className={cx(btnP, 'w-full')} disabled={busy} onClick={checkout}>{resident ? (pay === 'Cash on Delivery' ? 'Place order' : `Pay ${inr(total)}`) : 'Sign in to place order'}</button>
            </div>
          )}
        </Modal>
      )}

      {login && <LoginModal onClose={() => setLogin(false)} onDone={(r) => { setResident(r); setLogin(false); }} />}
      {custom && <CustomizeModal item={custom} onClose={() => setCustom(null)} onAdd={({ item, qty, unit, opts }) => { addCart({ key: `${item.id}|${opts}`, id: item.id, type: 'item', name: item.name, price: unit, opts, qty }); setCustom(null); }} />}
      {sim && <RazorpaySim amount={total} onClose={() => setSim(false)} onPay={finalize} />}
      {receipt && (
        <Modal title={`Order ${receipt.token} placed`} onClose={() => setReceipt(null)}>
          <pre className="whitespace-pre-wrap rounded-lg bg-mist p-3 text-xs">{orderText(receipt)}</pre>
          <a className={cx(btnP, 'mt-3 block text-center')} target="_blank" rel="noreferrer" href={waLink(WA_NUMBER, orderText(receipt))}>Send receipt on WhatsApp</a>
        </Modal>
      )}
      {menuCard && (
        <Modal title="Molly's Kitchen — Menu card" onClose={() => setMenuCard(false)} wide>
          <img src="/logo.png" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="mx-auto mb-3 h-20 w-20 rounded-full object-cover" />
          {cfg.menuImg && <img src={cfg.menuImg} alt="Menu pamphlet" className="mb-4 w-full rounded-lg" />}
          {CATEGORIES.map((c) => (
            <div key={c} className="mb-3"><h3 className="font-display font-bold text-chili">{c}</h3>
              {menu.filter((m) => m.category === c).map((m) => <div key={m.id} className="flex justify-between border-b border-dashed border-ink/20 py-1 text-sm"><span>{m.name}</span><b>{inr(m.price)}</b></div>)}
            </div>
          ))}
          <p className="text-xs text-ink/60">Call / WhatsApp: 9729099722 · 7988059542</p>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------- ADMIN -------------------------------- */
const readFile = (file, cb, max = 900, quality = 0.72) => {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', quality)); };
    img.onerror = () => cb(r.result);
    img.src = r.result;
  };
  r.readAsDataURL(file);
};

function StaffLogin({ onOk }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const login = async () => {
    const u = user.trim();
    let ok = u === STAFF_USER && pass === STAFF_PASS;
    if (API) { try { const r = await api('/api/admin/login', 'POST', { username: u, password: pass }); ok = !!r.authenticated; } catch { /* backend offline: fall back to local check */ } }
    ok ? onOk() : setErr('Wrong username or password.');
  };
  return (
    <div className="mx-auto mt-10 max-w-sm space-y-3 px-4">
      <img src="/logo.png" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="mx-auto h-24 w-24 rounded-full object-cover" />
      <h1 className="font-display text-3xl font-extrabold">Kitchen staff login</h1>
      <input className={field} placeholder="Username" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} />
      <input className={field} type="password" placeholder="Password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} />
      {err && <p className="text-sm text-chili">{err}</p>}
      <button className={cx(btnP, 'w-full')} onClick={login}>Log in</button>
    </div>
  );
}

function OrdersTab({ orders, setStatus, cancelOrder }) {
  const [f, setF] = useState('All');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const doCancel = async () => { setBusy(true); const r = await cancelOrder(confirm); setBusy(false); if (r.ok) setConfirm(null); else alert(r.msg); };
  const list = orders.filter((o) => f === 'All' || o.status === f).sort((a, b) => b.at - a.at);
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto">{['All', ...STAGES, 'Cancelled'].map((s) => <button key={s} onClick={() => setF(s)} className={cx(btn, 'shrink-0', f === s ? 'bg-ink text-paper' : 'border border-ink/25')}>{s} ({s === 'All' ? orders.length : orders.filter((o) => o.status === s).length})</button>)}</div>
      {!list.length && <p className="text-sm text-ink/60">No orders in this view yet.</p>}
      {list.map((o) => (
        <div key={o.id} className="rounded-2xl border border-ink/15 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><b className="font-display text-lg">{o.token} · {o.tower}-{o.flat}</b><span className="text-sm">{o.name} · {o.phone}</span></div>
          <ul className="my-2 text-sm">{o.items.map((i, k) => <li key={k}>{i.qty}× {i.name}{i.opts ? <span className="text-ink/60"> ({i.opts})</span> : ''}</li>)}</ul>
          <p className="text-xs text-ink/60">{o.slot} · {inr(o.total)} · {o.payMethod} ({o.payStatus})</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {o.status === 'Cancelled' ? <span className="rounded-full bg-chili/15 px-3 py-2 text-sm font-semibold text-chili">Cancelled · {o.payStatus}</span> : STAGES.map((s) => <button key={s} className={cx(btn, o.status === s ? 'bg-leaf text-white' : 'border border-ink/25')} onClick={() => setStatus([o.id], s)}>{s}</button>)}
            {o.status !== 'Cancelled' && o.status !== 'Delivered' && <button className={cx(btn, 'border border-chili text-chili hover:bg-chili/10')} onClick={() => setConfirm(o)}>{o.payMethod === 'Razorpay Online' && String(o.payStatus).startsWith('Paid') ? `Cancel & refund ${inr(o.total)}` : 'Cancel order'}</button>}
            <a className={btnO} target="_blank" rel="noreferrer" href={waLink(`91${o.phone.slice(-10)}`, `Hi ${o.name}! Your Molly's Kitchen order ${o.token} for ${o.tower} - Flat ${o.flat} is now "${o.status}".${o.status === 'Cancelled' ? ` Payment: ${o.payStatus}.` : ''}\n${o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}`)}><MessageCircle size={14} className="mr-1 inline" />Notify</a>
          </div>
        </div>
      ))}
      {confirm && (
        <Modal title={`Cancel order ${confirm.token}?`} onClose={() => !busy && setConfirm(null)}>
          <p className="text-sm">{confirm.name} · {confirm.tower}-{confirm.flat} · {inr(confirm.total)}</p>
          <p className="mt-2 text-sm text-ink/70">{confirm.payMethod === 'Razorpay Online' && String(confirm.payStatus).startsWith('Paid') ? `${inr(confirm.total)} will be refunded to the customer's original payment method through Razorpay (usually 5 to 7 working days).` : 'This is a Cash on Delivery order, so nothing needs to be refunded.'} Reserved plates go back on sale.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className={btnO} disabled={busy} onClick={() => setConfirm(null)}>Keep order</button>
            <button className={btnP} disabled={busy} onClick={doCancel}>{busy ? 'Cancelling…' : 'Yes, cancel'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PrepTab({ orders, thalis, setStatus }) {
  const active = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const t = { rotis: 0, puris: 0, rice: 0, sabzi: 0, chole: 0 };
  const food = {};
  active.forEach((o) => o.items.forEach((i) => {
    const th = thalis.find((x) => x.id === i.id);
    if (i.type === 'thali' && th) { t.rotis += th.rotis * i.qty; t.puris += th.puris * i.qty; t.rice += i.qty; if (th.rotis) t.sabzi += i.qty; if (th.puris) t.chole += i.qty; } else food[i.name] = (food[i.name] || 0) + i.qty;
  }));
  const stat = (label, v) => <div className="rounded-xl bg-card p-3 text-center"><p className="font-display text-3xl font-extrabold">{v}</p><p className="text-xs text-ink/70">{label}</p></div>;
  const byTower = TOWERS.map((tw) => [tw, active.filter((o) => o.tower === tw)]).filter(([, l]) => l.length);
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 font-display text-xl font-bold">Live cook sheet ({active.length} active orders)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{stat(`Sabzi-Roti thalis`, t.sabzi)}{stat('Tawa rotis to roll', t.rotis)}{stat('Chole-Puri thalis', t.chole)}{stat('Hot puris to fry', t.puris)}{stat('Rice portions', t.rice)}</div>
        <div className="mt-3 rounded-xl bg-card p-3 text-sm">{Object.keys(food).length ? Object.entries(food).map(([n, c]) => <div key={n} className="flex justify-between border-b border-dashed border-ink/20 py-1"><span>{n}</span><b>{c}×</b></div>) : 'No fast-food items in active orders.'}</div>
      </section>
      <section>
        <h2 className="mb-2 font-display text-xl font-bold">Tower-wise delivery batches</h2>
        {!byTower.length && <p className="text-sm text-ink/60">No active orders to batch.</p>}
        {byTower.map(([tw, l]) => (
          <div key={tw} className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3">
            <div><b>{tw}</b> · {l.length} order{l.length > 1 ? 's' : ''}<p className="text-xs text-ink/60">Flats: {l.map((o) => o.flat).join(', ')}</p></div>
            <button className={btnD} onClick={() => setStatus(l.map((o) => o.id), 'Out for Delivery')}><Truck size={14} className="mr-1 inline" />Dispatch all {tw} orders</button>
          </div>
        ))}
      </section>
    </div>
  );
}

function TimingsEditor({ cfg, setCfg }) {
  const set = (patch) => setCfg({ ...cfg, ...patch });
  const { slots } = cfg;
  const parse = (x) => { const [a, b] = String(x).split(' - '); return [to24(a), to24(b)]; };
  const setSlot = (i, a, b) => set({ slots: slots.map((x, k) => (k === i ? `${to12(a)} - ${to12(b)}` : x)) });
  const bad = (x) => { const [a, b] = parse(x); return !a || !b || b <= a; };
  const cutBad = to24(cfg.cutoff) <= to24(cfg.open);
  const addSlot = () => { const last = slots.length ? parse(slots[slots.length - 1])[1] : '19:30'; const a = last || '19:30'; set({ slots: [...slots, `${to12(a)} - ${to12(addMins(a, 30))}`] }); };
  const lab = 'block text-sm font-semibold';
  return (
    <section className="space-y-4 rounded-2xl bg-card p-4">
      <h2 className="font-display text-xl font-bold">Timings</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={lab}>Booking opens at<input type="time" className={cx(field, 'mt-1')} value={to24(cfg.open)} onChange={(e) => e.target.value && set({ open: to12(e.target.value) })} /></label>
        <label className={lab}>Order cutoff<input type="time" className={cx(field, 'mt-1')} value={to24(cfg.cutoff)} onChange={(e) => e.target.value && set({ cutoff: to12(e.target.value) })} /></label>
        <label className={lab}>Instant fast-food delivery (minutes)<input type="number" min="10" max="180" step="5" className={cx(field, 'mt-1')} value={cfg.instantMins} onChange={(e) => set({ instantMins: Math.min(180, Math.max(10, Number(e.target.value) || 30)) })} /></label>
      </div>
      {cutBad && <p className="text-sm text-chili">The cutoff is not after the opening time, so dinner orders will always show as closed.</p>}
      <div>
        <p className="mb-2 text-sm font-semibold">Dinner delivery slots</p>
        {slots.map((x, i) => {
          const [a, b] = parse(x);
          return (
            <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
              <input type="time" aria-label="Slot start" className={cx(field, 'w-32')} value={a} onChange={(e) => e.target.value && setSlot(i, e.target.value, b || e.target.value)} />
              <span className="text-sm">to</span>
              <input type="time" aria-label="Slot end" className={cx(field, 'w-32')} value={b} onChange={(e) => e.target.value && setSlot(i, a || e.target.value, e.target.value)} />
              <button className={btnO} disabled={slots.length <= 1} onClick={() => set({ slots: slots.filter((_, k) => k !== i) })}>Remove</button>
              {bad(x) && <span className="text-xs text-chili">End must be after start</span>}
            </div>
          );
        })}
        <div className="mt-1 flex flex-wrap gap-2">
          <button className={btnO} onClick={addSlot}><Plus size={14} className="mr-1 inline" />Add slot</button>
          <button className={btnO} onClick={() => set({ open: CFG_DEFAULTS.open, cutoff: CFG_DEFAULTS.cutoff, instantMins: CFG_DEFAULTS.instantMins, slots: CFG_DEFAULTS.slots })}>Reset to default timings</button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg.demo} onChange={() => set({ demo: !cfg.demo })} />Testing mode: accept dinner orders at any time of day (turn off to enforce the opening and cutoff times)</label>
    </section>
  );
}

function PublishTab({ thalis, setThalis, cfg, setCfg }) {
  const [copied, setCopied] = useState(false);
  const upd = (id, patch) => setThalis((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const s = thalis.find((t) => t.sabzi !== null && t.rotis > 0);
  const c = thalis.find((t) => t.puris > 0);
  const win = cfg.slots.length ? `${cfg.slots[0].split(' - ')[0]} to ${cfg.slots[cfg.slots.length - 1].split(' - ')[1]}` : '';
  const msg = `🍽️ *Molly's Kitchen — Tonight's Dinner @ ₹139*\nMigsun Twiinz, ETA 2\n\n${thalis.filter((t) => t.active).map((t, i) => `${i + 1}. ${t.sabzi ? `${t.sabzi} + ${t.rotis} Roti + Dal Fry + Rice + Salad` : 'Chole + Rice + 5 Puri + Salad'} — ₹${t.price} (${t.left} plates)`).join('\n')}\n\nOrder ${cfg.open} to ${cfg.cutoff}. Delivery ${win}, FREE to SUN 1–SUN 10.\nPay online (UPI/Card) or Cash on Delivery.\nOrder here: ${typeof window !== 'undefined' ? window.location.origin : ''}`;
  return (
    <div className="space-y-6">
      <TimingsEditor cfg={cfg} setCfg={setCfg} />
      {thalis.map((t) => (
        <section key={t.id} className="space-y-3 rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between"><h3 className="font-display font-bold">{t.title}</h3><label className="text-sm"><input type="checkbox" checked={t.active} onChange={() => upd(t.id, { active: !t.active })} /> On tonight</label></div>
          {t.sabzi !== null && (
            <div>
              <p className="mb-1 text-sm font-semibold">Tonight's sabzi</p>
              <div className="flex flex-wrap gap-2">{SABZIS.map((x) => <button key={x} className={cx(btn, t.sabzi === x ? 'bg-haldi text-[#1D2B24]' : 'border border-ink/25')} onClick={() => upd(t.id, { sabzi: x })}>{x}</button>)}</div>
              <input className={cx(field, 'mt-2')} placeholder="Or type a custom sabzi" value={SABZIS.includes(t.sabzi) ? '' : t.sabzi} onChange={(e) => upd(t.id, { sabzi: e.target.value || SABZIS[0] })} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">Portion cap</span>
            <input className={cx(field, 'w-24')} type="number" min="0" value={t.total} onChange={(e) => upd(t.id, { total: Number(e.target.value) || 0, left: Number(e.target.value) || 0 })} />
            <span>plates ({t.left} left)</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {t.img && t.img.startsWith('data:') && <img src={t.img} alt="Current dish" className="h-14 w-14 rounded-lg object-cover" />}
            <label className={cx(btnO, 'cursor-pointer')}><Upload size={14} className="mr-1 inline" />{t.img && t.img.startsWith('data:') ? 'Change photo' : 'Upload photo'}<input type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files[0], (d) => upd(t.id, { img: d }))} /></label>
            {t.img && <button className={btnO} onClick={() => upd(t.id, { img: null })}>Remove photo</button>}
          </div>
        </section>
      ))}
      <section>
        <h2 className="mb-2 font-display text-xl font-bold">WhatsApp group post</h2>
        <pre className="whitespace-pre-wrap rounded-xl bg-card p-3 text-sm">{msg}</pre>
        <button className={cx(btnP, 'mt-2')} onClick={() => { navigator.clipboard?.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy size={14} className="mr-1 inline" />{copied ? 'Copied' : 'Copy post'}</button>
      </section>
    </div>
  );
}

function StockTab({ menu, setMenu, cfg, setCfg }) {
  const [add, setAdd] = useState(false);
  const [d, setD] = useState({ name: '', category: CATEGORIES[0], price: '', veg: true, desc: '' });
  const upd = (id, patch) => setMenu((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const save = () => { if (!d.name.trim() || !Number(d.price)) return; setMenu((m) => [...m, { id: `mk-custom-${Date.now()}`, name: d.name.trim(), category: d.category, price: Number(d.price), veg: d.veg, desc: d.desc, inStock: true }]); setAdd(false); setD({ name: '', category: CATEGORIES[0], price: '', veg: true, desc: '' }); };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button className={btnP} onClick={() => setAdd(true)}><Plus size={14} className="mr-1 inline" />Add new dish</button>
        <label className={cx(btnO, 'cursor-pointer')}><Upload size={14} className="mr-1 inline" />Upload menu pamphlet<input type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files[0], (img) => setCfg({ ...cfg, menuImg: img }), 1400)} /></label>
      </div>
      {menu.map((m) => (
        <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-card p-3 text-sm">
          <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-ink/30" title="Upload photo">
            {m.img ? <img src={m.img} alt="" className="h-full w-full object-cover" /> : <Upload size={16} />}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files[0], (d) => upd(m.id, { img: d }), 420, 0.6)} />
          </label>
          <VegDot veg={m.veg} /><span className="min-w-0 flex-1 truncate">{m.name}<span className="ml-2 text-xs text-ink/50">{m.category}</span></span>
          {m.img && <button className="text-xs underline" onClick={() => upd(m.id, { img: null })}>Remove photo</button>}<span>₹</span><input className={cx(field, 'w-20')} type="number" min="0" value={m.price} onChange={(e) => upd(m.id, { price: Number(e.target.value) || 0 })} />
          <button className={cx(btn, m.inStock ? 'bg-leaf text-white' : 'bg-chili text-white')} onClick={() => upd(m.id, { inStock: !m.inStock })}>{m.inStock ? 'In stock' : 'Sold out'}</button>
        </div>
      ))}
      {add && (
        <Modal title="Add new dish" onClose={() => setAdd(false)}>
          <div className="space-y-3">
            <input className={field} placeholder="Dish name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
            <select className={field} value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input className={field} type="number" placeholder="Price (₹)" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} />
            <input className={field} placeholder="Short description" value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.veg} onChange={() => setD({ ...d, veg: !d.veg })} />Vegetarian</label>
            <button className={cx(btnP, 'w-full')} onClick={save}>Save dish</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Admin({ ctx }) {
  const { staff, setStaff, orders, thalis, setThalis, menu, setMenu, cfg, setCfg, setStatus, cancelOrder } = ctx;
  const [tab, setTab] = useState('orders');
  if (!staff) return <StaffLogin onOk={() => setStaff(true)} />;
  const tabs = [['orders', 'Live orders'], ['prep', 'Prep and towers'], ['publish', "Tonight's dinner"], ['stock', 'Menu and stock']];
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <div className="mt-4 flex items-center gap-2 overflow-x-auto">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx(btn, 'shrink-0', tab === k ? 'bg-ink text-paper' : 'border border-ink/25')}>{l}</button>)}
        <button className={cx(btnO, 'ml-auto shrink-0')} onClick={() => setStaff(false)}><LogOut size={14} className="mr-1 inline" />Log out</button>
      </div>
      <div className="mt-5">
        {tab === 'orders' && <OrdersTab orders={orders} setStatus={setStatus} cancelOrder={cancelOrder} />}
        {tab === 'prep' && <PrepTab orders={orders} thalis={thalis} setStatus={setStatus} />}
        {tab === 'publish' && <PublishTab thalis={thalis} setThalis={setThalis} cfg={cfg} setCfg={setCfg} />}
        {tab === 'stock' && <StockTab menu={menu} setMenu={setMenu} cfg={cfg} setCfg={setCfg} />}
      </div>
    </div>
  );
}

/* --------------------------------- ROOT -------------------------------- */
export default function App() {
  const [view, setView] = useState('resident');
  const [resident, setResident] = useLS('mk_migsun_resident', null);
  const [menu, setMenu] = useLS('mk_menu', MENU0);
  const [thalis, setThalis] = useLS('mk_thalis', THALIS0);
  const [cfgRaw, setCfg] = useLS('mk_cfg', CFG_DEFAULTS);
  const cfg = useMemo(() => ({ ...CFG_DEFAULTS, ...cfgRaw }), [cfgRaw]);
  const [orders, setOrders] = useLS('mk_orders', []);
  const [staff, setStaff] = useLS('mk_staff', false);
  const [theme, setTheme] = useLS('mk_theme', 'dark');
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  const [health, setHealth] = useState(null);
  useEffect(() => { if (API) fetch(`${API}/api/health`).then((r) => r.json()).then(setHealth).catch(() => setHealth(null)); }, []);

  // Shared live data: when Supabase keys exist, orders + tonight's thalis + menu + settings sync across every device.
  const [ready, setReady] = useState(!supabase);
  const seen = useRef({});

  useEffect(() => {
    if (!supabase) return undefined;
    let alive = true;
    const setters = { thalis: setThalis, menu: setMenu, cfg: setCfg };
    const pullOrders = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (alive && data) setOrders(data.map(fromRow));
    };
    const pullState = async () => {
      const { data } = await supabase.from('app_state').select('*');
      (data || []).forEach((row) => {
        const j = JSON.stringify(row.value);
        if (seen.current[row.key] === j) return;
        seen.current[row.key] = j;
        setters[row.key]?.(row.value);
      });
    };
    (async () => { await pullState(); await pullOrders(); if (alive) setReady(true); })();
    const ch = supabase.channel('mk-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, pullOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, pullState)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const push = (key, value) => {
    if (!supabase || !ready) return;
    const j = JSON.stringify(value);
    if (seen.current[key] === j) return;
    seen.current[key] = j;
    supabase.from('app_state').upsert({ key, value, updated_at: new Date().toISOString() }).then(() => {});
  };
  useEffect(() => { push('thalis', thalis); }, [thalis, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { push('menu', menu); }, [menu, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { push('cfg', cfg); }, [cfg, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeOrder = async ({ cart, total, slot, payMethod, payInfo }) => {
    const num = Math.max(100, ...orders.map((x) => parseInt(String(x.token).replace(/\D/g, ''), 10) || 0)) + 1;
    let o = {
      id: `o_${Date.now()}`, token: `#MK-${num}`, name: resident.name, phone: resident.phone, tower: resident.tower, flat: resident.flat, slot, payMethod,
      payStatus: payMethod === 'Cash on Delivery' ? 'Pending (COD)' : 'Paid', rzpOrderId: payInfo?.razorpay_order_id || null, rzpPaymentId: payInfo?.razorpay_payment_id || null,
      total, status: 'Order Accepted', at: Date.now(), items: cart.map(({ key, id, type, name, price, qty, opts }) => ({ key, id, type, name, price, qty, opts }))
    };
    if (supabase) {
      const { data, error } = await supabase.from('orders').insert([toRow(o)]).select().single();
      if (error) { console.error('Supabase insert error:', error); alert(`Could not save your order online: ${error.message}.${payInfo?.razorpay_payment_id ? ` Your payment ID is ${payInfo.razorpay_payment_id}; quote it to the kitchen.` : ''}`); return null; }
      o = { ...o, ...fromRow(data) };
    } else if (API) {
      api('/api/orders', 'POST', toRow(o)).then((d) => { if (d && d.id) setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, dbId: d.id } : x))); }).catch(() => {});
    }
    setThalis((ts) => ts.map((t) => { const used = cart.filter((c) => c.id === t.id).reduce((s, c) => s + c.qty, 0); return used ? { ...t, left: Math.max(0, t.left - used) } : t; }));
    setOrders((os) => [o, ...os.filter((x) => x.token !== o.token)]);
    return o;
  };
  const setStatus = (ids, status) => {
    setOrders((os) => os.map((o) => (ids.includes(o.id) ? { ...o, status } : o)));
    if (supabase) supabase.from('orders').update({ status }).in('id', ids).then(() => {});
    if (API) orders.filter((o) => ids.includes(o.id)).forEach((o) => api(`/api/orders/${o.dbId || o.id}/status`, 'PATCH', { status, phone: o.phone, residentName: o.name, token: o.token, tower: o.tower, flat: o.flat }).catch(() => {}));
  };
  const cancelOrder = async (o) => {
    let payStatus = 'Cancelled (COD)';
    if (o.payMethod === 'Razorpay Online' && String(o.payStatus).startsWith('Paid')) {
      const real = o.rzpPaymentId && !String(o.rzpPaymentId).includes('DEMO');
      if (real && API && health?.razorpayConnected) {
        try {
          const r = await api('/api/payment/refund', 'POST', { paymentId: o.rzpPaymentId, amountInr: o.total });
          if (!r.refunded) return { ok: false, msg: `Refund failed: ${r.error || 'unknown error'}. The order was NOT cancelled; try again or refund from the Razorpay Dashboard.` };
          payStatus = 'Refunded';
        } catch { return { ok: false, msg: 'Could not reach the payment server. The order was NOT cancelled.' }; }
      } else payStatus = 'Refunded (demo)';
    }
    if (supabase) {
      const { error } = await supabase.from('orders').update({ status: 'Cancelled', payment_status: payStatus }).eq('id', o.id);
      if (error) return { ok: false, msg: `Could not save the cancellation: ${error.message}. ${payStatus === 'Refunded' ? 'The refund WAS processed.' : ''} Run the Cancelled status SQL in Supabase, then try again.` };
    } else if (API) api(`/api/orders/${o.dbId || o.id}/status`, 'PATCH', { status: 'Cancelled', phone: o.phone, residentName: o.name, token: o.token, tower: o.tower, flat: o.flat }).catch(() => {});
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: 'Cancelled', payStatus } : x)));
    setThalis((ts) => ts.map((t) => { const back = o.items.filter((i) => i.id === t.id).reduce((n, i) => n + i.qty, 0); return back ? { ...t, left: Math.min(t.total, t.left + back) } : t; }));
    return { ok: true };
  };
  const ctx = { cancelOrder, resident, setResident, menu, setMenu, thalis, setThalis, cfg, setCfg, orders, setOrders, placeOrder, setStatus, staff, setStaff, health };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-bar text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Molly's Kitchen logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="h-10 w-10 rounded-full border-2 border-haldi object-cover" />
            <div>
              <p className="font-display text-xl font-extrabold leading-none text-haldi">Molly's Kitchen</p>
              <p className="text-xs text-white/70">Cloud kitchen · Migsun Twiinz, ETA 2</p>
            </div>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="ml-auto rounded-full bg-white/10 p-2 hover:bg-white/20">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          <div className="flex gap-1 rounded-full bg-white/10 p-1">
            <button onClick={() => setView('resident')} className={cx('rounded-full px-3 py-1 text-sm font-semibold', view === 'resident' && 'bg-haldi text-[#1D2B24]')}><Utensils size={14} className="mr-1 inline" />Resident</button>
            <button onClick={() => setView('admin')} className={cx('rounded-full px-3 py-1 text-sm font-semibold', view === 'admin' && 'bg-haldi text-[#1D2B24]')}><ChefHat size={14} className="mr-1 inline" />Kitchen</button>
          </div>
        </div>
      </header>
      {view === 'resident' ? <Resident ctx={ctx} /> : <Admin ctx={ctx} />}
    </div>
  );
}
