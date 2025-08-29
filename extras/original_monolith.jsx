import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ------------------------------------------------------
// Gianni Abo‑Portal – persönliche Abschlussseite (Frontend‑Only)
// Version: Smooth++ Accounts — "Inner Circle" Zahlungen (nur privat)
// Datum: 29.08.2025
// ------------------------------------------------------
// Update in dieser Version:
// • Zahlungsarten auf „privat“ reduziert: **Überweisung** & **Barzahlung**
// • Entfernt: Stripe/Karte, PayPal‑Checkout/Link, SEPA‑Lastschrift (erfordert i. d. R. gewerbliche Einrichtung)
// • UI/Texte entsprechend angepasst (keine IBAN‑Felder mehr, klarer Hinweis)
// • Zusätzliche Selbsttests für neue Zahlungslogik
//
// Hinweis: Das ist weiterhin ein Frontend‑Demonstrator (LocalStorage). Für echte Logik/Abwicklung wäre ein Backend nötig.

// === Konfiguration ===
const GIANNI_EMAIL = "gianni@example.com"; // <-- deine E‑Mail für die Anfragen
const ADMIN_PIN = "1234"; // <-- simple Admin‑PIN (Frontend)

// === Fake‑Backend (LocalStorage) – Abos ===
const STORAGE_KEY = "gianni_abos_v1";
function loadSubs(): any[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveSubs(list: any[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// === Fake‑Backend (LocalStorage) – Accounts/Session ===
const USERS_KEY = "gianni_users_v1";
const SESSION_KEY = "gianni_session_v1";

function loadUsers(): any[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveUsers(list: any[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}
function saveSession(userId: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
}
function loadSession(): { userId?: string } {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
  } catch {
    return {} as any;
  }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// === Hashing (nur Demo) ===
async function sha256Hex(str: string) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function makeSalt() {
  return Math.random().toString(36).slice(2, 10);
}

// === Hilfsfunktionen ===
const EUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("de-DE");
function labelPayment(p: string) {
  return p === "cash" ? "Barzahlung" : "Überweisung"; // default → bank transfer
}
function calcNextBilling(startISO: string, yearly: boolean) {
  const d = new Date(startISO);
  if (yearly) d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

// Baut den Body‑Text für die Abo‑Anfrage‑Mail
function buildInquiryMailBody({ id, planName, yearly, price, form, comingSoon = false }: any) {
  const lines = [
    `Plan: ${planName} (${yearly ? "jährlich" : "monatlich"})`,
    comingSoon ? "Status: Vormerkung (kommt bald)" : "",
    `Preis: ${EUR(price)} / Monat`,
    `Name: ${form.name}`,
    `E‑Mail: ${form.email}`,
    form.phone ? `Telefon/WhatsApp: ${form.phone}` : "",
    form.address ? `Adresse: ${form.address}` : "",
    `Zahlungsart: ${labelPayment(form.payment)}`,
    `Startdatum: ${fmtDate(form.startDate)}`,
    form.notes ? `Hinweise: ${form.notes}` : "",
    "—",
    `ID: ${id}`,
    `Erstellt: ${new Date().toLocaleString("de-DE")}`,
  ].filter(Boolean);
  return lines.join(" ");
}

// === Animations‑Presets ===
const dur = 0.6; // Standard‑Dauer
const ease = [0.16, 1, 0.3, 1]; // Quint‑Out Style
const spring = { type: "spring", stiffness: 300, damping: 30, mass: 0.8 } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: dur, ease } }),
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: dur, ease } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.25, ease } },
};

export default function AboPortal() {
  const [dark, setDark] = useState(true);
  const [yearly, setYearly] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [subs, setSubs] = useState<any[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const reduceMotion = useReducedMotion();

  const plans = useMemo(
    () => [
      {
        name: "Spotify Only",
        blurb: "1 Slot Spotify Premium. Einfach & direkt.",
        priceMonthly: 7.99,
        priceYearly: 7.99,
        features: ["Spotify Premium (1 Slot)", "Einfacher Support via Chat", "Monatlich kündbar"],
      },
      {
        name: "Apple Music Only",
        blurb: "1 Slot Apple Music. Vormerkung möglich – kommt bald.",
        priceMonthly: 7.99,
        priceYearly: 7.99,
        features: ["Apple Music (1 Slot)", "Einfacher Support via Chat", "Vormerkung – keine Abbuchung jetzt"],
        comingSoon: true,
      },
      {
        name: "Apple One",
        blurb: "Apple Music, TV+, iCloud – alles in einem.",
        priceMonthly: 14.99,
        priceYearly: 14.99,
        features: ["Apple One Bundle", "Priorisierter Support", "Zahlungserinnerungen inklusive"],
        highlight: true,
      },
      {
        name: "Premium (alles)",
        blurb: "Maximalpaket – Musik & Apple‑Bundle verwaltet.",
        priceMonthly: 19.99,
        priceYearly: 19.99,
        features: ["Spotify + Apple One organisiert", "WhatsApp‑Support", "Flexibles Startdatum"],
      },
    ],
    []
  );

  useEffect(() => {
    setSubs(loadSubs());

    // Session laden
    const { userId } = loadSession();
    if (userId) {
      const all = loadUsers();
      const found = all.find((u: any) => u.id === userId);
      if (found) setUser(found);
    }

    // --- Mini‑Tests / Assertions ---
    try {
      const m = calcNextBilling("2025-01-31", false); // Monatswechsel testen
      console.assert(typeof m === "string" && m.length > 10, "calcNextBilling monthly returns ISO");
      const y = calcNextBilling("2025-01-01", true);
      console.assert(new Date(y).getFullYear() === 2026, "calcNextBilling yearly adds +1y");

      const body = buildInquiryMailBody({
        id: "t",
        planName: "Spotify Only",
        yearly: false,
        price: 7.99,
        form: { name: "T", email: "t@t", payment: "bank", startDate: "2025-01-01" },
      });
      console.assert(!/\n/.test(body), "inquiry body has no newlines by design");
      console.assert(body.includes("Plan:") && body.includes("ID:"), "inquiry body contains key fields");
      console.assert(!/undefined|null/.test(body), "inquiry body has no undefined/null");

      const bodySoon = buildInquiryMailBody({
        id: "t2",
        planName: "Apple Music Only",
        yearly: false,
        price: 7.99,
        comingSoon: true,
        form: { name: "T", email: "t@t", payment: "bank", startDate: "2025-01-01" },
      });
      console.assert(/Vormerkung/.test(bodySoon), "coming soon adds Vormerkung to body");

      console.assert(EUR(0) !== "0", "EUR formatter returns non-empty");
      console.assert(labelPayment("bank") === "Überweisung", "labelPayment bank→Überweisung");
      console.assert(labelPayment("cash") === "Barzahlung", "labelPayment cash→Barzahlung");
      console.assert(typeof Th === "function" && typeof Td === "function", "Th/Td components exist");
      console.assert(plans.length === 4, "four plans available");

      // zusätzliche Checks
      const idA = uid();
      const idB = uid();
      console.assert(idA !== idB, "uid unique");
      const euro = EUR(7.99);
      console.assert(/€/.test(euro) || /EUR/.test(euro), "EUR has currency symbol");
    } catch (e) {
      console.warn("Self‑tests warning:", e);
    }
  }, [plans]);

  const priceSuffix = yearly ? "/Monat (jährlich)" : "/Monat";

  const handleStart = (plan: string) => {
    setSelectedPlan(plan);
    setWizardOpen(true);
  };

  // Animated background blobs (sanft, optional reduziert)
  const blobAnim = reduceMotion
    ? {}
    : {
        animate: { y: [0, -20, 0], x: [0, 10, 0] },
        transition: { duration: 10, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white">
        {/* Animated Blobs */}
        <motion.div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl" {...blobAnim} />
        <motion.div className="pointer-events-none absolute -bottom-24 -right-24 h-[520px] w-[520px] rounded-full bg-emerald-400/20 blur-3xl" {...blobAnim} />

        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur bg-white/50 dark:bg-zinc-950/40 border-b border-zinc-200/70 dark:border-zinc-800/70">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease } }} className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: 8 }} transition={spring} className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500" />
              <span className="font-semibold tracking-tight">Gianni Abo‑Portal</span>
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDark((d) => !d)} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800">{dark ? "☾" : "☀︎"}</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setAdminOpen(true)} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Admin</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setAccountOpen(true)} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">{user ? `👤 ${user.displayName || user.email}` : "Konto"}</motion.button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-50/60 dark:bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Persönliches Abo‑Portal (enger Kreis)
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">Abos direkt bei mir – privat & simpel.</h1>
            <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">
              Wähle ein Paket, trage kurz deine Daten ein und bestätige, wie du **privat** zahlen möchtest: Überweisung oder Barzahlung.
              Keine Zahlungsanbieter, kein Gewerbekonto – nur wir im engen Kreis.
            </p>

            {/* Billing toggle */}
            <div className="mt-6 inline-flex items-center rounded-full border border-zinc-300 dark:border-zinc-700 p-1 relative">
              <motion.div layout className="absolute top-1 bottom-1 rounded-full bg-zinc-900 dark:bg-white" style={{ width: 100 }} animate={{ x: yearly ? 100 : 0 }} transition={spring} />
              <button className={`relative z-[1] w-[100px] text-center py-1.5 text-sm rounded-full ${!yearly ? "text-white dark:text-zinc-900" : "text-zinc-600 dark:text-zinc-300"}`} onClick={() => setYearly(false)}>Monatlich</button>
              <button className={`relative z-[1] w-[100px] text-center py-1.5 text-sm rounded-full ${yearly ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-300"}`} onClick={() => setYearly(true)}>Jährlich</button>
            </div>
          </motion.div>
        </section>

        {/* Plans */}
        <section id="preise" className="mx-auto max-w-6xl px-4 pb-16">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((p, i) => (
              <motion.div key={(p as any).name} variants={fadeUp} custom={i}>
                <PlanCard plan={p} yearly={yearly} priceSuffix={yearly ? "/Monat (jährlich)" : "/Monat"} onSelect={() => handleStart((p as any).name)} />
              </motion.div>
            ))}
          </motion.div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1, transition: { delay: 0.1 } }} viewport={{ once: true }} className="mt-6 text-center text-xs text-zinc-500">
            Alle Preise inkl. USt., falls anwendbar. Privatangebot – Abschluss erfolgt direkt mit mir.
          </motion.p>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ rotate: -6 }} className="h-6 w-6 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500" />
                <span>© {new Date().getFullYear()} Gianni</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Impressum</a>
                <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Datenschutz</a>
                <a href={`mailto:${GIANNI_EMAIL}`} className="hover:text-zinc-900 dark:hover:text-white">Kontakt</a>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-500">Hinweis: Dieses Portal speichert Anfragen und Accounts nur lokal (Demo). Keine Zahlungsabwicklung im System.</p>
          </div>
        </footer>

        {/* Wizard Modal */}
        <AnimatePresence>
          {wizardOpen && selectedPlan && (
            <Wizard key="wizard" planName={selectedPlan} yearly={yearly} user={user} onRequestAccount={() => setAccountOpen(true)} onClose={() => setWizardOpen(false)} onSaved={(entry) => { const next = [entry, ...subs]; setSubs(next); saveSubs(next); }} />
          )}
        </AnimatePresence>

        {/* Admin Modal */}
        <AnimatePresence>
          {adminOpen && (
            <AdminDialog key="admin" subs={subs} setSubs={(next) => { setSubs(next); saveSubs(next); }} onClose={() => setAdminOpen(false)} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
          )}
        </AnimatePresence>

        {/* Account Modal */}
        <AnimatePresence>
          {accountOpen && (
            <AccountDialog key="account" subs={subs} onClose={() => setAccountOpen(false)} user={user} setUser={setUser} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PlanCard({ plan, yearly, priceSuffix, onSelect }: any) {
  const price = yearly ? (plan as any).priceYearly : (plan as any).priceMonthly;
  const comingSoon = !!(plan as any).comingSoon;
  return (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={spring} className={`relative rounded-2xl border ${(plan as any).highlight ? "border-cyan-400" : "border-zinc-200 dark:border-zinc-800"} bg-white/70 dark:bg-zinc-900/70 backdrop-blur p-6 shadow-sm hover:shadow-md`}>
      {/* Badges */}
      <div className="absolute -top-3 right-4 flex gap-2">
        {(plan as any).highlight && (
          <motion.div layout className="select-none rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow">Beliebt</motion.div>
        )}
        {comingSoon && (
          <motion.div layout className="select-none rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow">Kommt bald · Vormerken</motion.div>
        )}
      </div>

      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{(plan as any).name}</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{(plan as any).blurb}</p>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{EUR(price)}</span>
        <span className="text-sm text-zinc-500">{priceSuffix}</span>
      </div>
      <ul className="mt-5 space-y-2">
        {(plan as any).features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-xs font-bold">✓</span>
            <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{f}</span>
          </li>
        ))}
      </ul>
      {comingSoon && <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">Unverbindliche Vormerkung – wir melden uns, sobald verfügbar.</div>}
      <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }} onClick={onSelect} className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold shadow ${comingSoon ? "bg-amber-600 text-white hover:brightness-110" : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"}`}>{comingSoon ? "Vormerken" : "Abo auswählen"}</motion.button>
    </motion.div>
  );
}

function Wizard({ planName, yearly, user, onRequestAccount, onClose, onSaved }: any) {
  const prices: any = {
    "Spotify Only": { m: 7.99, y: 7.99 },
    "Apple Music Only": { m: 7.99, y: 7.99 },
    "Apple One": { m: 14.99, y: 14.99 },
    "Premium (alles)": { m: 19.99, y: 19.99 },
  };
  const price = yearly ? prices[planName].y : prices[planName].m;
  const comingSoon = planName === "Apple Music Only";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    payment: "bank", // bank | cash (inner circle)
    notes: "",
    startDate: new Date().toISOString().slice(0, 10),
  });

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = () => {
    const id = uid();
    const entry = {
      id,
      plan: planName,
      yearly,
      price,
      status: comingSoon ? "vormerkung" : "angefragt",
      createdAt: new Date().toISOString(),
      ...form,
      userId: user?.id || null,
      nextBilling: calcNextBilling(form.startDate, yearly),
    };

    onSaved(entry);

    const subjPrefix = comingSoon ? "Vormerkung: " : "Abo‑Anfrage: ";
    const subj = encodeURIComponent(`${subjPrefix}${planName} (${yearly ? "jährlich" : "monatlich"})`);
    const body = encodeURIComponent(buildInquiryMailBody({ id, planName, yearly, price, form, comingSoon }));

    window.open(`mailto:${GIANNI_EMAIL}?subject=${subj}&body=${body}`, "_blank");
    alert(comingSoon ? "Vormerkung gespeichert. Eine E‑Mail an Gianni wurde vorbereitet." : "Abo‑Anfrage gespeichert. Eine E‑Mail an Gianni wurde vorbereitet.");
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl" variants={scaleIn} initial="hidden" animate="show" exit="exit">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{comingSoon ? "Vormerkung" : "Abo abschließen"} – {planName}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{EUR(price)} / Monat {yearly ? "(jährlich)" : "(monatlich)"}</p>
            {comingSoon && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Hinweis: Jetzt nur vormerken – keine Abbuchung. Ich melde mich, sobald es verfügbar ist.</p>}
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm">✕</motion.button>
        </div>

        <div className="mt-4"><Steps current={step} /></div>

        {step === 1 && (
          <div className="mt-4 grid gap-3">
            {user ? (
              <div className="rounded-xl border border-cyan-300/60 bg-cyan-50/50 dark:bg-cyan-500/10 p-3 text-sm">
                Eingeloggt als <strong>{user.displayName || user.email}</strong> (<span className="font-mono">{user.email}</span>).{" "}
                <button onClick={onRequestAccount} className="underline underline-offset-2 hover:opacity-80">Konto öffnen</button>
              </div>
            ) : null}
            <Input label="Dein Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input type="email" label="E‑Mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Telefon/WhatsApp (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Textarea label="Adresse (optional)" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Textarea label="Hinweise (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 grid gap-3">
            <RadioGroup
              label="Zahlungsart (enger Kreis)"
              value={form.payment}
              onChange={(v) => setForm({ ...form, payment: v })}
              options={[
                { value: "bank", label: "Überweisung" },
                { value: "cash", label: "Barzahlung" },
              ]}
            />
            <Input type="date" label={comingSoon ? "Wunschtermin (unverbindlich)" : "Startdatum"} value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 space-y-2 text-sm">
            <SummaryRow k="Plan" v={`${planName} – ${yearly ? "jährlich" : "monatlich"}${comingSoon ? " (Vormerkung)" : ""}`} />
            <SummaryRow k="Preis" v={`${EUR(price)} / Monat`} />
            <SummaryRow k="Name" v={form.name || "–"} />
            <SummaryRow k="E‑Mail" v={form.email || "–"} />
            {form.phone && <SummaryRow k="Telefon/WhatsApp" v={form.phone} />}
            {form.address && <SummaryRow k="Adresse" v={form.address} />}
            <SummaryRow k="Zahlungsart" v={labelPayment(form.payment)} />
            <SummaryRow k={comingSoon ? "Wunschstart" : "Start"} v={fmtDate(form.startDate)} />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-zinc-500">Deine Daten werden hier nur zur Anfrage genutzt und lokal gespeichert. Zahlung erfolgt **außerhalb** des Portals.</div>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.96 }} onClick={back} disabled={step === 1} className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm disabled:opacity-40">Zurück</motion.button>
            {step < 3 ? (
              <motion.button whileTap={{ scale: 0.96 }} className="rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-semibold" onClick={next}>Weiter</motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.96 }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${comingSoon ? "bg-amber-600 text-white" : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"}`} onClick={handleSubmit}>{comingSoon ? "Vormerkung abschicken" : "Abo anfragen"}</motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Steps({ current }: { current: number }) {
  const list = ["Daten", "Zahlung", "Bestätigen"];
  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {list.map((label, i) => {
        const n = i + 1;
        const active = n <= current;
        return (
          <motion.div key={label} layout className={`relative rounded-full px-3 py-1 text-center border ${active ? "border-cyan-500 text-cyan-600 dark:text-cyan-300" : "border-zinc-300 dark:border-zinc-700 text-zinc-500"}`} transition={spring}>
            {n}. {label}
            {active && <motion.span layoutId="steps-underline" className="absolute left-2 right-2 -bottom-[2px] h-[2px] bg-cyan-500/70" />}
          </motion.div>
        );
      })}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "", disabled = false }: any) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-600 dark:text-zinc-300">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-colors disabled:opacity-60" />
    </label>
  );
}
function Textarea({ label, value, onChange, rows = 3 }: any) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-600 dark:text-zinc-300">{label}</span>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-colors" />
    </label>
  );
}
function RadioGroup({ label, value, onChange, options }: any) {
  return (
    <fieldset>
      <legend className="text-xs text-zinc-600 dark:text-zinc-300 mb-2">{label}</legend>
      <div className="grid gap-2">
        {options.map((o: any) => (
          <label key={o.value} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${value === o.value ? "border-cyan-500 bg-cyan-50/40 dark:bg-cyan-500/10" : "border-zinc-300 dark:border-zinc-700"}`}>
            <span>{o.label}</span>
            <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function SummaryRow({ k, v }: any) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 py-2">
      <span className="text-zinc-500">{k}</span>
      <span className="font-medium text-right whitespace-pre-wrap">{v}</span>
    </div>
  );
}

// Table helpers used in AdminDialog
function Th({ children }: any) {
  return <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">{children}</th>;
}
function Td({ children }: any) {
  return <td className="px-3 py-3 align-top">{children}</td>;
}

function AdminDialog({ subs, setSubs, onClose, isAdmin, setIsAdmin }: any) {
  const [pin, setPin] = useState("");
  const [query, setQuery] = useState("");
  const [importJson, setImportJson] = useState("");

  const filtered = subs.filter((s: any) => {
    const t = `${s.plan} ${s.name} ${s.email} ${s.status}`.toLowerCase();
    return t.includes(query.toLowerCase());
  });

  const update = (id: string, patch: any) => setSubs(subs.map((s: any) => (s.id === id ? { ...s, ...patch } : s)));
  const del = (id: string) => setSubs(subs.filter((s: any) => s.id !== id));

  const doExport = () => {
    const blob = new Blob([JSON.stringify(subs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abo_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = () => {
    try {
      const arr = JSON.parse(importJson);
      if (Array.isArray(arr)) setSubs(arr);
      else alert("Ungültiges JSON");
    } catch (e: any) {
      alert("JSON‑Fehler: " + e.message);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl" variants={scaleIn} initial="hidden" animate="show" exit="exit">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold">Admin</h3>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm">✕</motion.button>
        </div>

        {!isAdmin ? (
          <div className="mt-4 grid gap-3">
            <Input label="PIN" value={pin} onChange={setPin} />
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsAdmin(pin === ADMIN_PIN)} className="rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-semibold">Einloggen</motion.button>
            <p className="text-xs text-zinc-500">Hinweis: Nur simple Frontend‑PIN, kein echter Schutz.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suchen…" className="w-full md:w-72 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500" />
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.96 }} onClick={doExport} className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm">Export</motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { if (confirm("Alle Daten löschen?")) { setSubs([]); saveSubs([]); } }} className="rounded-xl border border-red-300 text-red-600 px-3 py-2 text-sm">Alles löschen</motion.button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <Th>Plan</Th>
                    <Th>Kunde</Th>
                    <Th>Zahlung</Th>
                    <Th>Status</Th>
                    <Th>Nächste Abbuchung</Th>
                    <Th>Aktionen</Th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-zinc-500">Keine Einträge</td>
                      </tr>
                    )}
                    {filtered.map((s: any) => (
                      <motion.tr key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring} className="border-t border-zinc-200/70 dark:border-zinc-800/70">
                        <Td>
                          {s.plan} {s.yearly ? "(jährlich)" : "(monatlich)"}
                          <div className="text-xs text-zinc-500">{EUR(s.price)} / Monat</div>
                        </Td>
                        <Td>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-zinc-500">{s.email}{s.phone ? ` · ${s.phone}` : ""}</div>
                          {s.userId && <div className="text-[10px] text-zinc-400">User‑ID: {s.userId}</div>}
                        </Td>
                        <Td>
                          {labelPayment(s.payment)}
                        </Td>
                        <Td>
                          <select value={s.status} onChange={(e) => update(s.id, { status: e.target.value })} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1">
                            {["angefragt", "aktiv", "pausiert", "gekündigt", "vormerkung"].map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </Td>
                        <Td>
                          <input type="date" value={s.nextBilling?.slice(0, 10)} onChange={(e) => update(s.id, { nextBilling: new Date(e.target.value).toISOString() })} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1" />
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const subject = encodeURIComponent("Abo bestätigt: " + s.plan);
                              const adminBody = encodeURIComponent(`Hi ${s.name},\n\nDein Abo ist aktiv. Nächste Abbuchung: ${fmtDate(s.nextBilling)}`);
                              return (
                                <motion.button whileTap={{ scale: 0.96 }} onClick={() => window.open(`mailto:${s.email}?subject=${subject}&body=${adminBody}`)} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1">Mail</motion.button>
                              );
                            })()}
                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => del(s.id)} className="rounded-lg border border-red-300 text-red-600 px-2 py-1">Löschen</motion.button>
                          </div>
                        </Td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="grid gap-2">
              <span className="text-xs text-zinc-500">Import (JSON einfügen – überschreibt Liste)</span>
              <textarea value={importJson} onChange={(e) => setImportJson(e.target.value)} rows={4} className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.96 }} onClick={doImport} className="rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-semibold">Importieren</motion.button>
              </div>
            </div>

            <p className="text-xs text-zinc-500">Tipp: Da Zahlungen privat erfolgen, halte Absprachen außerhalb des Portals fest.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// === Kundenbereich (Login/Registrierung + eigene Abos) ===
function AccountDialog({ subs, onClose, user, setUser }: any) {
  const [mode, setMode] = useState(user ? "profile" : "login"); // login | register | profile
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [updatingName, setUpdatingName] = useState(user?.displayName || "");

  const allUsers = loadUsers();

  const mine = subs.filter((s: any) => {
    if (!user) return false;
    return (s.userId && s.userId === user.id) || (s.email && s.email.toLowerCase() === user.email.toLowerCase());
  });
  const active = mine.filter((s: any) => s.status === "aktiv");
  const others = mine.filter((s: any) => s.status !== "aktiv");

  async function handleRegister() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return alert("Bitte gültige E‑Mail eingeben.");
    if ((password || "").length < 6) return alert("Passwort mindestens 6 Zeichen.");
    const exists = allUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return alert("Mit dieser E‑Mail existiert bereits ein Account.");
    const salt = makeSalt();
    const passHash = await sha256Hex(salt + password);
    const newUser = { id: uid(), email, displayName: displayName || email.split("@")[0], salt, passHash, createdAt: new Date().toISOString() };
    saveUsers([...(allUsers as any), newUser]);
    saveSession(newUser.id);
    setUser(newUser);
    setMode("profile");
    setEmail("");
    setPassword("");
  }

  async function handleLogin() {
    const found = allUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return alert("Kein Account mit dieser E‑Mail gefunden.");
    const hash = await sha256Hex(found.salt + password);
    if (hash !== found.passHash) return alert("Falsches Passwort.");
    saveSession(found.id);
    setUser(found);
    setMode("profile");
    setEmail("");
    setPassword("");
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setMode("login");
  }

  function handleUpdateName() {
    if (!user) return;
    const users = loadUsers();
    const idx = users.findIndex((u: any) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], displayName: updatingName || users[idx].displayName };
      saveUsers(users);
      setUser(users[idx]);
      alert("Name aktualisiert.");
    }
  }

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl" variants={scaleIn} initial="hidden" animate="show" exit="exit">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold">{mode === "profile" ? "Mein Konto" : mode === "register" ? "Registrieren" : "Einloggen"}</h3>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm">✕</motion.button>
        </div>

        {mode !== "profile" ? (
          <div className="mt-4 grid gap-3">
            <Input type="email" label="E‑Mail" value={email} onChange={setEmail} />
            <Input type="password" label="Passwort" value={password} onChange={setPassword} />
            {mode === "register" && <Input label="Anzeigename (optional)" value={displayName} onChange={setDisplayName} placeholder="z. B. Gianni" />}
            <div className="flex gap-2">
              {mode === "login" ? (
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleLogin} className="rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-semibold">Einloggen</motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleRegister} className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-4 py-2 text-sm font-semibold">Registrieren</motion.button>
              )}
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setMode(mode === "login" ? "register" : "login")} className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm">{mode === "login" ? "Neu hier? Registrieren" : "Ich habe schon ein Konto"}</motion.button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-6">
            <div className="grid gap-3">
              <div className="text-sm text-zinc-500">Eingeloggt als</div>
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                <div>
                  <div className="font-medium">{user.displayName || user.email}</div>
                  <div className="text-xs text-zinc-500 font-mono">{user.email}</div>
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleLogout} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm">Logout</motion.button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <Input label="Anzeigename ändern" value={updatingName} onChange={setUpdatingName} />
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleUpdateName} className="rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-semibold">Speichern</motion.button>
              </div>
            </div>

            <div className="grid gap-3">
              <h4 className="text-sm font-semibold">Meine Abos</h4>
              {mine.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-500">Noch keine Abos hinterlegt. Wähle oben einen Plan und schließe ein Abo ab.</div>
              ) : (
                <div className="grid gap-6">
                  {active.length > 0 && (
                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">Aktiv</div>
                      <div className="grid gap-3">
                        {active.map((s: any) => <SubCard key={s.id} sub={s} highlight />)}
                      </div>
                    </div>
                  )}
                  {others.length > 0 && (
                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">Weitere</div>
                      <div className="grid gap-3">
                        {others.map((s: any) => <SubCard key={s.id} sub={s} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function SubCard({ sub, highlight = false }: any) {
  const statusColor: Record<string, string> = {
    aktiv: "bg-emerald-600",
    angefragt: "bg-cyan-600",
    pausiert: "bg-amber-600",
    gekündigt: "bg-zinc-600",
    vormerkung: "bg-amber-500",
  };
  const s = sub.status || "angefragt";
  const color = statusColor[s] || "bg-zinc-600";
  return (
    <div className={`rounded-xl border ${highlight ? "border-emerald-300" : "border-zinc-200 dark:border-zinc-800"} p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{sub.plan} {sub.yearly ? "(jährlich)" : "(monatlich)"}</div>
          <div className="text-xs text-zinc-500">{EUR(sub.price)} / Monat · Nächste Abbuchung: {sub.nextBilling ? fmtDate(sub.nextBilling) : "–"}</div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${color}`}>{s}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => window.open(`mailto:${GIANNI_EMAIL}?subject=${encodeURIComponent("Frage zu meinem Abo: " + sub.plan)}&body=${encodeURIComponent(`Hallo Gianni,\n\nich habe eine Frage zu meinem Abo (${sub.plan}).\n\nAbo‑ID: ${sub.id}\nAktueller Status: ${sub.status}\n\nDanke!`)}`)} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm">Frage stellen</motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => window.open(`mailto:${GIANNI_EMAIL}?subject=${encodeURIComponent("Kündigung anfragen: " + sub.plan)}&body=${encodeURIComponent(`Hallo Gianni,\n\nich möchte mein Abo kündigen.\n\nAbo‑ID: ${sub.id}\nWunschtermin: ${sub.nextBilling ? fmtDate(sub.nextBilling) : "so schnell wie möglich"}\n\nDanke!`)}`)} className="rounded-lg border border-red-300 text-red-600 px-3 py-1.5 text-sm">Kündigung anfragen</motion.button>
      </div>
    </div>
  );
}
