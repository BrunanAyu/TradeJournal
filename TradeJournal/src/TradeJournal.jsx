import { useState } from "react";
import "./TradeJournal.css";

const PAIRS = ["EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","USD/CAD","NZD/USD","EUR/GBP","EUR/JPY"];
const SETUPS = ["Reversal","Continuation","Int to Ext","Ext to Int"];
const TIMEFRAMES = ["M1","M5","M15","M30","H1","H4","D1"];
const EMOTIONS = ["Calm","Confident","Anxious","Greedy","Fearful","Neutral"];

function calcPnL(trade) {
  const pip = trade.pair.includes("JPY") ? 0.01 : 0.0001;
  const diff = trade.direction === "Buy"
    ? trade.exit - trade.entry
    : trade.entry - trade.exit;
  return parseFloat((diff / pip * trade.lot * 10).toFixed(2));
}

export default function TradeJournal() {
  const [tab, setTab] = useState("dashboard");
  const [trades, setTrades] = useState([]);

  const addTrade = (trade) => setTrades(prev => [trade, ...prev]);

  return (
    <div className="tj-app">
      <header className="tj-header">
        <div className="tj-logo">
          <span className="tj-logo-mark">FX</span>
          <div>
            <div className="tj-title">Trade journal</div>
            <div className="tj-subtitle">Forex · Personal log</div>
          </div>
        </div>
        <nav className="tj-nav">
          {["dashboard","log","history"].map(t => (
            <button
              key={t}
              className={`tj-nav-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "dashboard" ? "Dashboard" : t === "log" ? "Log trade" : "History"}
            </button>
          ))}
        </nav>
      </header>

      <main className="tj-main">
        {tab === "dashboard" && <Dashboard trades={trades} />}
        {tab === "log" && <LogTrade onSave={addTrade} onDone={() => setTab("dashboard")} />}
        {tab === "history" && <History trades={trades} />}
      </main>
    </div>
  );
}

function Dashboard({ trades }) {
  const total = trades.length;
  const wins = trades.filter(t => t.result === "Win").length;
  const losses = trades.filter(t => t.result === "Loss").length;
  const totalPnL = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const avgPnL = total ? parseFloat((totalPnL / total).toFixed(2)) : 0;
  const bestTrade = trades.length ? Math.max(...trades.map(t => t.pnl)) : null;

  return (
    <div>
      <div className="tj-stats-grid">
        <StatCard label="Total trades" value={total} />
        <StatCard label="Win rate" value={`${winRate}%`} type={winRate >= 50 ? "pos" : total > 0 ? "neg" : ""} />
        <StatCard label="Total P&L" value={totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`} type={totalPnL >= 0 ? "pos" : "neg"} show={total > 0} />
        <StatCard label="Avg P&L" value={avgPnL >= 0 ? `+$${avgPnL}` : `-$${Math.abs(avgPnL)}`} type={avgPnL >= 0 ? "pos" : "neg"} show={total > 0} />
        <StatCard label="Wins" value={wins} type="pos" />
        <StatCard label="Losses" value={losses} type="neg" />
      </div>

      <div className="tj-card">
        <div className="tj-card-title">Recent trades</div>
        {trades.length === 0
          ? <div className="tj-empty">No trades yet — go log your first trade.</div>
          : trades.slice(0, 6).map(t => <TradeRow key={t.id} trade={t} />)
        }
      </div>
    </div>
  );
}

function StatCard({ label, value, type, show = true }) {
  if (!show && value === "$0.00") return (
    <div className="tj-stat-card">
      <div className="tj-stat-label">{label}</div>
      <div className="tj-stat-val">—</div>
    </div>
  );
  return (
    <div className="tj-stat-card">
      <div className="tj-stat-label">{label}</div>
      <div className={`tj-stat-val ${type || ""}`}>{value}</div>
    </div>
  );
}

function LogTrade({ onSave, onDone }) {
  const now = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState({
    pair: "EUR/USD", direction: "Buy", entry: "", exit: "",
    lot: "", sl: "", tp: "", setup: "Breakout", timeframe: "H1",
    emotion: "Calm", result: "Win",pic:"", notes: "", date: now,
  });
  const [msg, setMsg] = useState({ text: "", type: "" });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.entry || !form.exit || !form.lot) {
      setMsg({ text: "Entry price, exit price and lot size are required.", type: "err" });
      return;
    }
    const trade = {
      ...form,
      id: Date.now(),
      entry: parseFloat(form.entry),
      exit: parseFloat(form.exit),
      lot: parseFloat(form.lot),
      sl: form.sl ? parseFloat(form.sl) : null,
      tp: form.tp ? parseFloat(form.tp) : null,
    };
    trade.pnl = calcPnL(trade);
    onSave(trade);
    setMsg({ text: "Trade saved successfully!", type: "ok" });
    setTimeout(() => { onDone(); }, 1000);
  };

  const handleClear = () => {
    setForm(f => ({ ...f, entry: "", exit: "", lot: "", sl: "", tp: "", notes: "" }));
    setMsg({ text: "", type: "" });
  };

  return (
    <div>
      <div className="tj-card">
        <div className="tj-section-label">Basic info</div>
        <div className="tj-form-grid">
          <Field label="Currency pair">
            <select value={form.pair} onChange={e => set("pair", e.target.value)}>
              {PAIRS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Direction">
            <select value={form.direction} onChange={e => set("direction", e.target.value)}>
              <option>Buy</option><option>Sell</option>
            </select>
          </Field>
          <Field label="Entry price">
            <input type="number" step="0.00001" placeholder="1.08500" value={form.entry} onChange={e => set("entry", e.target.value)} />
          </Field>
          <Field label="Exit price">
            <input type="number" step="0.00001" placeholder="1.09200" value={form.exit} onChange={e => set("exit", e.target.value)} />
          </Field>
          <Field label="Lot size">
            <input type="number" step="0.01" placeholder="0.10" value={form.lot} onChange={e => set("lot", e.target.value)} />
          </Field>
          <Field label="Date & time">
            <input type="datetime-local" value={form.date} onChange={e => set("date", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="tj-card">
        <div className="tj-section-label">Detailed info</div>
        <div className="tj-form-grid">
          <Field label="Setup / strategy">
            <select value={form.setup} onChange={e => set("setup", e.target.value)}>
              {SETUPS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Timeframe">
            <select value={form.timeframe} onChange={e => set("timeframe", e.target.value)}>
              {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Stop loss">
            <input type="number" step="0.00001" placeholder="1.08000" value={form.sl} onChange={e => set("sl", e.target.value)} />
          </Field>
          <Field label="Take profit">
            <input type="number" step="0.00001" placeholder="1.10000" value={form.tp} onChange={e => set("tp", e.target.value)} />
          </Field>
          <Field label="Emotion">
            <select value={form.emotion} onChange={e => set("emotion", e.target.value)}>
              {EMOTIONS.map(em => <option key={em}>{em}</option>)}
            </select>
          </Field>
          <Field label="Result">
            <select value={form.result} onChange={e => set("result", e.target.value)}>
              <option>Win</option><option>Loss</option><option>Break even</option>
            </select>
          </Field>
          <Field label="Picture">
            <input type="text" placeholder="http" value={form.pic} onChange={e => set("pic", e.target.value)} />
          </Field>
          <Field label="Notes" full>
            <textarea placeholder="What happened? What did you learn?" value={form.notes} onChange={e => set("notes", e.target.value)} />
          </Field>
        </div>

        <div className="tj-btn-row">
          <button className="tj-btn-primary" onClick={handleSave}>Save trade</button>
          <button className="tj-btn-secondary" onClick={handleClear}>Clear</button>
        </div>
        {msg.text && <div className={`tj-msg ${msg.type}`}>{msg.text}</div>}
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={`tj-field ${full ? "full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function History({ trades }) {
  return (
    <div className="tj-card">
      <div className="tj-card-header">
        <div className="tj-card-title">All trades</div>
        <span className="tj-count">{trades.length} total</span>
      </div>
      {trades.length === 0
        ? <div className="tj-empty">No trades logged yet.</div>
        : trades.map(t => <TradeRow key={t.id} trade={t} detailed />)
      }
    </div>
  );
}

function TradeRow({ trade: t, detailed }) {
  const pnlPos = t.pnl >= 0;
  return (
    <div className="tj-trade-row">
      <div className="tj-trade-left">
        <div className="tj-trade-top">
          <span className="tj-trade-pair">{t.pair}</span>
          <span className={`tj-badge ${t.direction === "Buy" ? "buy" : "sell"}`}>{t.direction}</span>
          <span className={`tj-badge ${t.result === "Win" ? "win" : t.result === "Loss" ? "loss" : "be"}`}>{t.result}</span>
        </div>
        <div className="tj-trade-meta">
          {t.date?.replace("T", " ")} · {t.setup} · {t.timeframe} · {t.emotion}
          {detailed && t.notes && <span className="tj-trade-notes"> · {t.notes}</span>}
        </div>
      </div>
      <div className="tj-trade-right">
        <div className={`tj-pnl ${pnlPos ? "pos" : "neg"}`}>
          {pnlPos ? "+" : ""}${t.pnl.toFixed(2)}
        </div>
        <div className="tj-trade-prices">{t.entry} → {t.exit}</div>
      </div>
    </div>
  );
}
