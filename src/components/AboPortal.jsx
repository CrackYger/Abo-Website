import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { GIANNI_EMAIL, ADMIN_PIN, ACCESS_LINKS } from '../constants.js'
import { EUR, fmtDate, uid } from '../lib/utils.js'
import { labelPayment, calcNextBilling, buildInquiryMailBody } from '../lib/payment.js'
import { loadSubs, saveSubs } from '../lib/storage.js'
import { getCurrentUser, registerUser, loginUser, logoutUser, listUsers, adminSetPassword, deleteUser } from '../lib/auth.js'
import Steps from './ui/Steps.jsx'
import { Input, Textarea, RadioGroup } from './ui/Inputs.jsx'
import SummaryRow from './ui/SummaryRow.jsx'
import { Th, Td } from './ui/Table.jsx'
import Tilt from './ui/Tilt.jsx'
import AnimatedButton from './ui/AnimatedButton.jsx'
import { fadeUp, pop, spring } from '../lib/motion.js'
import ToastHost from './ui/ToastHost.jsx'
import { toast } from '../lib/toast.js'
import { isEmail, isNonEmpty } from '../lib/validate.js'
import LegalDialog from './ui/LegalDialog.jsx'


// ---------------- Messages Store (local) ----------------
function loadMsgs(){ try { return JSON.parse(localStorage.getItem('gianni_msgs_v1')||'[]') } catch(e){ return [] } }
function saveMsgs(list){ localStorage.setItem('gianni_msgs_v1', JSON.stringify(list)) }
function sendMsg({to, subject, body}){
  if(!to) return
  const msgs = loadMsgs()
  msgs.push({ id: uid(), to: String(to).toLowerCase(), subject, body, read:false, t:new Date().toISOString() })
  saveMsgs(msgs)
  window.dispatchEvent(new CustomEvent('gianni_msgs_changed'))
}
function listMsgsFor(email){
  if(!email) return []
  return loadMsgs().filter(m => m.to === String(email).toLowerCase()).sort((a,b)=>a.t<b.t?1:-1)
}
function unreadCount(email){ return listMsgsFor(email).filter(m => !m.read).length }
function markAllRead(email){
  if(!email) return
  const lower = String(email).toLowerCase()
  const msgs = loadMsgs()
  let changed = false
  for(const m of msgs){ if(m.to===lower && !m.read){ m.read = true; changed = true } }
  if(changed){ saveMsgs(msgs); window.dispatchEvent(new CustomEvent('gianni_msgs_changed')) }
}
// --------------------------------------------------------

const STATUS = ['vormerkung','angefragt','aktiv','pausiert','gekündigt','abgelehnt','zurückgezogen']

function addHistory(entry, action, by='admin'){
  const ev = { t: new Date().toISOString(), by, action }
  const hist = Array.isArray(entry.history) ? entry.history.slice() : []
  hist.push(ev)
  return { ...entry, history: hist }
}

export default function AboPortal(){
  const [dark, setDark] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [legalOpen, setLegalOpen] = useState(null)
  const [subs, setSubs] = useState([])
  const [user, setUser] = useState(null)
  const [unread, setUnread] = useState(0)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const yHero = useTransform(scrollYProgress, [0, .25], [0, -40])
  const oHero = useTransform(scrollYProgress, [0, .25], [1, .88])

  const plans = useMemo(()=>[
    { name:'Spotify Only', blurb:'1 Slot Spotify Premium. Einfach & direkt.', priceMonthly:7.99, features:['Spotify Premium (1 Slot)','Einfacher Support via Chat','Monatlich kündbar'] },
    { name:'Apple Music Only', blurb:'1 Slot Apple Music. Einfach & direkt.', priceMonthly:7.99, features:['Apple Music (1 Slot)','Einfacher Support via Chat','Monatlich kündbar'], comingSoon:true },
    { name:'Apple One', blurb:'Apple Music, TV+, iCloud – alles in einem.', priceMonthly:14.99, features:['Apple One Bundle','Priorisierter Support','Zahlungserinnerungen inklusive'], highlight:true },
    { name:'Premium (alles)', blurb:'Maximalpaket – Musik & Apple-Bundle verwaltet.', priceMonthly:19.99, features:['Spotify + Apple One organisiert','WhatsApp-Support','Flexibles Startdatum'] },
  ],[])

  useEffect(()=>{
    setSubs(loadSubs())
    const found = getCurrentUser()
    if (found) setUser(found)
  },[])

  useEffect(()=>{
    const refresh = () => setUnread(unreadCount(user?.email))
    refresh()
    window.addEventListener('gianni_msgs_changed', refresh)
    return () => window.removeEventListener('gianni_msgs_changed', refresh)
  }, [user])


  const blobAnim = reduceMotion ? {} : { animate:{ y:[0,-12,0], x:[0,12,0] }, transition:{ duration:12, repeat:Infinity, ease:'easeInOut' } }

  return (
    <div className={dark ? 'dark' : ''}>
      <ToastHost />
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white">
        <motion.div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl float-slow" {...blobAnim}/>
        <motion.div className="pointer-events-none absolute -bottom-24 -right-24 h-[520px] w-[520px] rounded-full bg-emerald-400/20 blur-3xl float-slow" {...blobAnim}/>

        <header className="sticky top-0 z-40 backdrop-blur bg-white/50 dark:bg-zinc-950/40 border-b border-zinc-200/70 dark:border-zinc-800/70">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }} className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: 8 }} transition={spring} className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 glow" />
              <span className="font-semibold tracking-tight">Gianni Abo-Portal</span>
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={()=>setDark(d=>!d)} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800">{dark ? '☾' : '☀︎'}</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={()=>setAdminOpen(true)} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Admin</motion.button>
              
              <div className="relative">
                <motion.button whileTap={{ scale: 0.97 }} onClick={()=>{ setAccountOpen(true); if(user){ markAllRead(user.email) } }} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  {user ? `👤 ${user.displayName || user.email}` : 'Konto'}
                </motion.button>
                {user && unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[1.1rem] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold grid place-items-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
    
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
          <motion.div style={{ y: yHero, opacity: oHero }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-50/60 dark:bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Persönliches Abo-Portal (enger Kreis)
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">Abos direkt bei mir – privat &amp; simpel.</h1>
            <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">Wähle ein Paket, trage kurz deine Daten ein und bestätige, wie du privat zahlen möchtest.</p>
          </motion.div>
        </section>

        <section id="preise" className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((p,i)=>(
              <motion.div key={p.name} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} custom={i}>
                <PlanCard plan={p} priceSuffix="/Monat" onSelect={()=>{ setSelectedPlan(p.name); setWizardOpen(true) }} />
              </motion.div>
            ))}
          </div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1, transition: { delay: 0.1 } }} viewport={{ once: true }} className="mt-6 text-center text-xs text-zinc-500">
            Privatangebot – Abschluss erfolgt direkt mit mir.
          </motion.p>
        </section>

        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <motion.div className="h-6 w-6 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 glow" />
                <span>© {new Date().getFullYear()} Gianni</span>
              </div>
              <div className="flex items-center gap-6">
                <button onClick={()=>setLegalOpen('impressum')} className="hover:text-zinc-900 dark:hover:text-white underline-offset-4 hover:underline">Impressum</button>
                <button onClick={()=>setLegalOpen('datenschutz')} className="hover:text-zinc-900 dark:hover:text-white underline-offset-4 hover:underline">Datenschutz</button>
                <a href={`mailto:${GIANNI_EMAIL}`} className="hover:text-zinc-900 dark:hover:text-white">Kontakt</a>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-500">Hinweis: Demo – speichert lokal im Browser.</p>
          </div>
        </footer>

        <AnimatePresence>
          {wizardOpen && selectedPlan && (
            <Wizard key="wizard" planName={selectedPlan} user={user}
              onClose={()=>setWizardOpen(false)}
              onSaved={(entry)=>{ const next=[entry, ...subs]; setSubs(next); saveSubs(next) }} />
          )}
        </AnimatePresence>
        <AnimatePresence>{adminOpen && (<AdminDialog key="admin" subs={subs} setSubs={(n)=>{ setSubs(n); saveSubs(n) }} onClose={()=>setAdminOpen(false)} />)}</AnimatePresence>
        <AnimatePresence>{accountOpen && (<AccountDialog key="account" subs={subs} setSubs={(n)=>{ setSubs(n); saveSubs(n) }} onClose={()=>setAccountOpen(false)} user={user} setUser={setUser} />)}</AnimatePresence>
        <AnimatePresence>{legalOpen && (<LegalDialog key="legal" kind={legalOpen} onClose={()=>setLegalOpen(null)} />)}</AnimatePresence>
      </div>
    </div>
  )
}

function PlanCard({ plan, priceSuffix, onSelect }){
  const price = plan.priceMonthly
  const comingSoon = !!plan.comingSoon
  return (
    <Tilt className="card-glow">
      <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={spring}
        className={`relative rounded-2xl border ${plan.highlight ? 'border-cyan-400' : 'border-zinc-200 dark:border-zinc-800'} bg-white/70 dark:bg-zinc-900/70 backdrop-blur p-6 shadow-sm`}>
        <div className="absolute -top-3 right-4 flex gap-2">
          {plan.highlight && <motion.div layout className="select-none rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow">Beliebt</motion.div>}
          {comingSoon && <motion.div layout className="select-none rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow">Kommt bald</motion.div>}
        </div>
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{plan.blurb}</p>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight">{EUR(price)}</span>
          <span className="text-sm text-zinc-500">{priceSuffix}</span>
        </div>
        <ul className="mt-5 space-y-2">
          {plan.features.map((f,i)=>(
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-xs font-bold">✓</span>
              <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{f}</span>
            </li>
          ))}
        </ul>
        <AnimatedButton onClick={onSelect} className={`mt-6 w-full ${comingSoon ? 'bg-amber-600' : 'bg-zinc-900 dark:bg-white dark:text-zinc-900'}`}>
          {comingSoon ? 'Vormerken' : 'Abo auswählen'}
        </AnimatedButton>
      </motion.div>
    </Tilt>
  )
}

function Wizard({ planName, user, onClose, onSaved }){
  const prices = { 'Spotify Only': 7.99, 'Apple Music Only': 7.99, 'Apple One': 14.99, 'Premium (alles)': 19.99 }
  const price = prices[planName]
  const comingSoon = planName === 'Apple Music Only'

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    payment: 'bank',
    notes: '',
    startDate: new Date().toISOString().slice(0,10),
  })
  const validStep1 = isNonEmpty(form.name) && isEmail(form.email)

  const next = () => setStep(s => Math.min(3, s+1))
  const back = () => setStep(s => Math.max(1, s-1))

  const handleSubmit = () => {
    const id = uid()
    let entry = {
      id, plan: planName, yearly: false, price,
      status: comingSoon ? 'vormerkung' : 'angefragt',
      createdAt: new Date().toISOString(),
      ...form,
      userId: user?.id || null,
      nextBilling: calcNextBilling(form.startDate, false),
      zugangLink: ACCESS_LINKS[planName] || '',
      proof: null,
    }
    entry = addHistory(entry, 'antrag erstellt', user ? 'user' : 'gast')
    onSaved(entry)
    const subjPrefix = comingSoon ? 'Vormerkung: ' : 'Abo-Anfrage: '
    const subj = encodeURIComponent(`${subjPrefix}${planName} (monatlich)`)
    const body = encodeURIComponent(buildInquiryMailBody({ id, planName, yearly:false, price, form, comingSoon }))
    window.open(`mailto:${GIANNI_EMAIL}?subject=${subj}&body=${body}`, '_blank')
    toast(comingSoon ? 'Vormerkung gespeichert. E-Mail geöffnet.' : 'Abo-Anfrage gespeichert. E-Mail geöffnet.', 'success')
    onClose()
  }

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="dialog" aria-modal="true" variants={pop} initial="hidden" animate="show" exit="exit">
      <motion.div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl"
        initial={{ opacity:0, y: 12, scale: 0.99 }} animate={{ opacity:1, y:0, scale: 1 }} exit={{ opacity:0, y: 8 }} transition={spring}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{comingSoon ? 'Vormerkung' : 'Abo abschließen'} – {planName}</h3>
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{EUR(price)} / Monat</motion.p>
            {comingSoon && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Jetzt nur vormerken – keine Abbuchung.</p>}
          </div>
          <button onClick={onClose} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm">✕</button>
        </div>

        <div className="mt-4"><Steps current={step} /></div>

        {step === 1 && (
          <motion.div className="mt-4 grid gap-3" variants={fadeUp} initial="hidden" animate="show">
            <Input label="Dein Name" value={form.name} onChange={v=>setForm({ ...form, name: v })} error={!isNonEmpty(form.name) ? 'Bitte Namen eingeben.' : ''} />
            <Input type="email" label="E-Mail" value={form.email} onChange={v=>setForm({ ...form, email: v })} error={!isEmail(form.email) ? 'Bitte gültige E-Mail.' : ''} />
            <Input label="Telefon/WhatsApp (optional)" value={form.phone} onChange={v=>setForm({ ...form, phone: v })} />
            <Textarea label="Adresse (optional)" value={form.address} onChange={v=>setForm({ ...form, address: v })} />
            <Textarea label="Hinweise (optional)" value={form.notes} onChange={v=>setForm({ ...form, notes: v })} />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div className="mt-4 grid gap-3" variants={fadeUp} initial="hidden" animate="show">
            <RadioGroup label="Zahlungsart (enger Kreis)" value={form.payment} onChange={v=>setForm({ ...form, payment: v })}
              options={[{ value:'bank', label:'Überweisung (Dauerauftrag)' }, { value:'cash', label:'Barzahlung' }]} />
            <Input type="date" label={comingSoon ? 'Wunschtermin (unverbindlich)' : 'Startdatum'} value={form.startDate} onChange={v=>setForm({ ...form, startDate: v })} />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div className="mt-4 space-y-2 text-sm" variants={fadeUp} initial="hidden" animate="show">
            <SummaryRow k="Plan" v={`${planName} – monatlich${comingSoon ? ' (Vormerkung)' : ''}`} />
            <SummaryRow k="Preis" v={`${EUR(price)} / Monat`} />
            <SummaryRow k="Name" v={form.name || '–'} />
            <SummaryRow k="E-Mail" v={form.email || '–'} />
            {form.phone && <SummaryRow k="Telefon/WhatsApp" v={form.phone} />}
            {form.address && <SummaryRow k="Adresse" v={form.address} />}
            <SummaryRow k="Zahlungsart" v={labelPayment(form.payment)} />
            <SummaryRow k={comingSoon ? 'Wunschstart' : 'Start'} v={fmtDate(form.startDate)} />
          </motion.div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-zinc-500">Daten werden lokal gespeichert. Zahlung erfolgt außerhalb des Portals.</div>
          <div className="flex gap-2">
            <AnimatedButton onClick={back} className="bg-zinc-800 dark:bg-white dark:text-zinc-900 disabled:opacity-40" disabled={step===1}>Zurück</AnimatedButton>
            {step < 3 ? (
              <AnimatedButton className="bg-zinc-900 dark:bg-white dark:text-zinc-900" onClick={()=> validStep1 ? next() : toast('Bitte Name & E-Mail ausfüllen.', 'warn')}>
                Weiter
              </AnimatedButton>
            ) : (
              <AnimatedButton className={comingSoon ? 'bg-amber-600' : ''} onClick={handleSubmit}>
                {comingSoon ? 'Vormerkung abschicken' : 'Abo anfragen'}
              </AnimatedButton>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatusChip({s}){
  const map = { aktiv:'bg-emerald-600', angefragt:'bg-cyan-600', pausiert:'bg-amber-600', 'gekündigt':'bg-zinc-600', vormerkung:'bg-amber-500', 'abgelehnt':'bg-red-600', 'zurückgezogen':'bg-zinc-500' }
  const color = map[s] || 'bg-zinc-600'
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] text-white ${color}`}>{s}</span>
}

function AdminDialog({ subs, setSubs, onClose }){
  const [pin, setPin] = useState('')
  const [authOK, setAuthOK] = useState(false)
  const [tab, setTab] = useState('subs')
  const [query, setQuery] = useState('')
  const [importJson, setImportJson] = useState('')
  const [detail, setDetail] = useState(null)
  const [filter, setFilter] = useState('offen')
  const [selected, setSelected] = useState({})

  const users = listUsers()

  // helper: notify user
  const notify = (s, type) => {
    if(!s?.email) return
    if(type==='accepted'){
      const msg = s.payment==='bank'
        ? 'Dein Antrag wurde angenommen. Bitte lade im Konto den Screenshot deines Dauerauftrags hoch. Nach Freigabe erhältst du den Zugangslink.'
        : 'Dein Antrag wurde angenommen. Du kannst dein Abo jetzt nutzen.'
      sendMsg({ to:s.email, subject:'Antrag angenommen', body: msg })
    } else if(type==='rejected'){
      sendMsg({ to:s.email, subject:'Antrag abgelehnt', body: 'Dein Antrag wurde leider abgelehnt. Melde dich bei Rückfragen gern bei mir.' })
    } else if(type==='proof_ok'){
      sendMsg({ to:s.email, subject:'Nachweis freigegeben', body: 'Dein Nachweis wurde geprüft und freigegeben. Der Zugangslink ist jetzt in deinem Konto sichtbar.' })
    }
  }

  const ADMIN_PIN_VALUE = String((import.meta.env?.VITE_ADMIN_PIN ?? ADMIN_PIN ?? '')).trim()
  const [errAdmin, setErrAdmin] = useState('')

  const subMatchesFilter = (s) => {
    if (filter==='alle') return true
    if (filter==='offen') return ['angefragt','vormerkung'].includes(s.status)
    return s.status === filter
  }

  const filtered = subs.filter((s)=>{
    const t = `${s.plan} ${s.name} ${s.email} ${s.status}`.toLowerCase()
    return t.includes(query.toLowerCase()) && subMatchesFilter(s)
  })

  const toggleSel = (id, val) => setSelected(prev => ({ ...prev, [id]: val ?? !prev[id] }))
  const clearSel = () => setSelected({})
  const selectedIds = Object.keys(selected).filter(k => selected[k])

  const applyPatchRaw = (id, patch) => setSubs(subs.map(s => s.id === id ? { ...s, ...patch } : s))
  const applyPatch = (id, patch, who='admin', action='bearbeitet') => {
    setSubs(subs.map(s => s.id === id ? addHistory({ ...s, ...patch }, action, who) : s))
  }
  const mergeProof = (id, patchProof, action='proof aktualisiert') => {
    setSubs(subs.map(s => {
      if (s.id !== id) return s
      const nextProof = { ...(s.proof || {}), ...patchProof }
      return addHistory({ ...s, proof: nextProof }, action, 'admin')
    }))
  }
  const bulk = (patch, action) => {
    if (selectedIds.length === 0) return toast('Keine Einträge ausgewählt', 'warn')
    setSubs(subs.map(s => selectedIds.includes(s.id) ? addHistory({ ...s, ...patch }, action, 'admin') : s))
    clearSel(); toast('Aktion angewendet', 'success')
  }
  const del = (id) => setSubs(subs.filter(s => s.id !== id))

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="dialog" aria-modal="true" variants={pop} initial="hidden" animate="show" exit="exit">
      <motion.div className="w-full max-w-6xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl"
        initial={{ opacity:0, y: 12, scale: 0.99 }} animate={{ opacity:1, y:0, scale: 1 }} exit={{ opacity:0, y: 8 }} transition={spring}>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold">Admin</h3>
          <button onClick={onClose} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm">✕</button>
        </div>

        {!authOK ? (
          <div className="mt-4 grid gap-3">
            <Input label="PIN" value={pin} onChange={setPin} />
            {errAdmin && <div className="rounded-lg border border-red-300 bg-red-50/60 dark:bg-red-500/10 p-2 text-sm text-red-700 dark:text-red-300">{errAdmin}</div>}
            <AnimatedButton onClick={()=>{ const ok = pin.trim() === ADMIN_PIN_VALUE; if(!ok){ setErrAdmin('Falsche PIN'); return;} setAuthOK(true); }} className="bg-zinc-900 dark:bg-white dark:text-zinc-900">Einloggen</AnimatedButton>
            <p className="text-xs text-zinc-500">Tipp: PIN kommt aus <code>src/constants.js</code> (ADMIN_PIN){ADMIN_PIN_VALUE === '1234' ? ' – aktuell Standardwert 1234.' : ''}</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={()=>setTab('subs')} className={`rounded-lg px-3 py-1.5 text-sm border ${tab==='subs'?'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-500/10':'border-zinc-300 dark:border-zinc-700'}`}>Anträge</button>
                  <button onClick={()=>setTab('accounts')} className={`rounded-lg px-3 py-1.5 text-sm border ${tab==='accounts'?'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-500/10':'border-zinc-300 dark:border-zinc-700'}`}>Accounts</button>
                </div>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Suchen…" className="w-full md:w-72 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500" />
                <div className="flex gap-2">
                  <AnimatedButton onClick={()=>{
                    const data = tab==='subs' ? subs : users
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = `${tab==='subs'?'abo_export':'users_export'}_${new Date().toISOString().slice(0,10)}.json`; a.click()
                    URL.revokeObjectURL(url)
                  }} className="bg-zinc-900 dark:bg-white dark:text-zinc-900">Export {tab==='subs'?'Anträge':'Accounts'}</AnimatedButton>
                </div>
              </div>

              {tab==='subs' && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {['offen','aktiv','pausiert','gekündigt','abgelehnt','alle'].map(f => (
                      <button key={f} onClick={()=>setFilter(f)} className={`rounded-full px-3 py-1 text-xs border ${filter===f?'border-cyan-400 bg-cyan-50/60 dark:bg-cyan-500/10':'border-zinc-300 dark:border-zinc-700'}`}>{f}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AnimatedButton onClick={()=>bulk({ status:'aktiv' }, 'angenommen')} className="px-3 py-1.5">Annehmen</AnimatedButton>
                    <AnimatedButton onClick={()=>bulk({ status:'abgelehnt' }, 'abgelehnt')} className="bg-red-600 px-3 py-1.5">Ablehnen</AnimatedButton>
                    <AnimatedButton onClick={()=>bulk({ status:'pausiert' }, 'pausiert')} className="px-3 py-1.5">Pausieren</AnimatedButton>
                    <AnimatedButton onClick={()=>bulk({ status:'gekündigt' }, 'gekündigt')} className="bg-zinc-700 px-3 py-1.5">Kündigen</AnimatedButton>
                    <button onClick={clearSel} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm">Auswahl leeren ({selectedIds.length})</button>
                  </div>
                </div>
              )}
            </div>

            {tab==='subs' ? (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <Th><input type="checkbox" onChange={e=>filtered.forEach(s=>toggleSel(s.id, e.target.checked))} /></Th>
                      <Th>Plan</Th><Th>Kunde</Th><Th>Zahlung</Th><Th>Status</Th>
                      <Th>Nachweis</Th><Th>Zugang</Th><Th>Nächste Abbuchung</Th><Th>Aktionen</Th>
                    </tr>
                  </thead>
                  <tbody>
                      {filtered.length === 0 && (<tr><td colSpan={9} className="p-4 text-center text-zinc-500">Keine Einträge</td></tr>)}
                      {filtered.map(s => {
                        const hasProof = !!s.proof
                        const verified = !!s.proof?.verified
                        return (
                        <tr key={s.id} className="border-t border-zinc-200/70 dark:border-zinc-800/70">
                          <Td><input type="checkbox" checked={!!selected[s.id]} onChange={()=>toggleSel(s.id)} /></Td>
                          <Td>{s.plan} {s.yearly ? '(jährlich)' : '(monatlich)'}<div className="text-xs text-zinc-500">{EUR(s.price)} / Monat</div></Td>
                          <Td><div className="font-medium">{s.name}</div><div className="text-xs text-zinc-500">{s.email}{s.phone ? ` · ${s.phone}` : ''}</div>{s.userId && <div className="text-[10px] text-zinc-400">User-ID: {s.userId}</div>}</Td>
                          <Td>{labelPayment(s.payment)}</Td>
                          <Td><StatusChip s={s.status}/></Td>
                          <Td>
                            {hasProof ? (
                              <div className="flex items-center gap-2">
                                <a href={s.proof.dataUrl} download={s.proof.name||'nachweis.png'} className="underline">ansehen</a>
                                {!verified && <AnimatedButton onClick={()=>mergeProof(s.id,{ verified:true }, 'nachweis freigegeben')} className="px-2 py-1">Freigeben</AnimatedButton>}
                                {verified && <span className="text-emerald-600 font-medium text-xs">freigegeben</span>}
                                {hasProof && <AnimatedButton onClick={()=>applyPatch(s.id,{ proof:null }, 'admin', 'nachweis zurückgesetzt')} className="bg-zinc-700 px-2 py-1">Zurückweisen</AnimatedButton>}
                              </div>
                            ) : <span className="text-zinc-400">—</span>}
                          </Td>
                          <Td>
                            <input type="url" value={s.zugangLink||''} onChange={e=>applyPatchRaw(s.id,{ zugangLink: e.target.value })}
                              onBlur={e=>applyPatch(s.id,{ zugangLink: e.target.value }, 'admin', 'zugangslink gesetzt')}
                              placeholder="https://…"
                              className="w-40 md:w-56 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1" />
                            {(s.payment==='bank' && !s.proof?.verified) && <div className="text-[11px] text-amber-600 mt-1">wird nach Prüfung freigegeben</div>}
                          </Td>
                          <Td><input type="date" value={s.nextBilling?.slice(0,10)} onChange={e=>applyPatch(s.id,{ nextBilling: new Date(e.target.value).toISOString() }, 'admin', 'fällig geändert')} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1" /></Td>
                          <Td>
                            <div className="flex flex-wrap gap-2">
                              <AnimatedButton onClick={()=>setDetail(s)} className="px-2 py-1">Details</AnimatedButton>
                              <AnimatedButton onClick={()=>applyPatch(s.id,{ status:'aktiv' }, 'admin', 'angenommen')} className="px-2 py-1">Annehmen</AnimatedButton>
                              <AnimatedButton onClick={()=>applyPatch(s.id,{ status:'abgelehnt' }, 'admin', 'abgelehnt')} className="bg-red-600 px-2 py-1">Ablehnen</AnimatedButton>
                              <AnimatedButton onClick={()=>{ del(s.id); toast('Eintrag gelöscht', 'warn') }} className="bg-zinc-700 px-2 py-1">Löschen</AnimatedButton>
                            </div>
                          </Td>
                        </tr>
                      )})}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr><Th>E-Mail</Th><Th>Name</Th><Th>User-ID</Th><Th>Aktionen</Th></tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (<tr><td colSpan={4} className="p-4 text-center text-zinc-500">Keine Accounts registriert</td></tr>)}
                    {users.filter(u => (u.email + ' ' + (u.displayName||'') + ' ' + u.id).toLowerCase().includes(query.toLowerCase())).map(u => (
                      <tr key={u.id} className="border-t border-zinc-200/70 dark:border-zinc-800/70">
                        <Td><div className="font-mono">{u.email}</div></Td>
                        <Td>{u.displayName || '—'}</Td>
                        <Td className="text-xs text-zinc-500">{u.id}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-2">
                            <AnimatedButton onClick={()=>{
                              const np = prompt('Neues Passwort für ' + u.email + ':')
                              if (!np) return
                              try { adminSetPassword({ userId: u.id, newPassword: np }); toast('Passwort gesetzt', 'success') }
                              catch(e){ toast(e.message || 'Fehler', 'error') }
                            }} className="px-2 py-1">Passwort setzen</AnimatedButton>
                            <AnimatedButton onClick={()=>{
                              if (confirm('Diesen Account löschen?')){ deleteUser(u.id); toast('Account gelöscht', 'warn') }
                            }} className="bg-red-600 px-2 py-1">Löschen</AnimatedButton>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab==='subs' && (
              <div className="grid gap-2">
                <span className="text-xs text-zinc-500">Import Anträge (JSON – überschreibt Liste)</span>
                <textarea value={importJson} onChange={e=>setImportJson(e.target.value)} rows={4} className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <AnimatedButton onClick={()=>{
                    try {
                      const arr = JSON.parse(importJson)
                      if (!Array.isArray(arr)) return toast('Ungültiges JSON (kein Array)', 'error')
                      setSubs(arr); toast('Import erfolgreich', 'success')
                    } catch (e){ toast('JSON-Fehler: ' + e.message, 'error') }
                  }} className="bg-zinc-900 dark:bg-white dark:text-zinc-900">Importieren</AnimatedButton>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {authOK && detail && (
          <motion.div key="detail" className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold">Antrag – {detail.plan}</h4>
                  <div className="text-xs text-zinc-500">Erstellt: {fmtDate(detail.createdAt)}</div>
                </div>
                <button onClick={()=>setDetail(null)} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm">✕</button>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <SummaryRow k="Kunde" v={`${detail.name} · ${detail.email}${detail.phone? ' · '+detail.phone:''}`} />
                {detail.address && <SummaryRow k="Adresse" v={detail.address} />}
                {detail.notes && <SummaryRow k="Hinweise" v={detail.notes} />}
                <SummaryRow k="Zahlungsart" v={labelPayment(detail.payment)} />
                <SummaryRow k="Start" v={fmtDate(detail.startDate)} />
                <SummaryRow k="Nächste Abbuchung" v={detail.nextBilling ? fmtDate(detail.nextBilling) : '—'} />
                <SummaryRow k="Status" v={detail.status} />
                <SummaryRow k="Zugang" v={detail.zugangLink || '—'} />
                {detail.proof && <div className="mt-2"><img src={detail.proof.dataUrl} alt="Nachweis" className="max-h-64 rounded-lg border border-zinc-700" /></div>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.proof && !detail.proof?.verified && (
                  <AnimatedButton onClick={()=>{ setSubs(subs.map(s => s.id===detail.id ? addHistory({ ...s, proof:{...s.proof, verified:true} }, 'nachweis freigegeben', 'admin') : s)); toast('Nachweis freigegeben', 'success') }}>
                    Nachweis freigeben
                  </AnimatedButton>
                )}
                {detail.proof && (
                  <AnimatedButton onClick={()=>{ setSubs(subs.map(s => s.id===detail.id ? addHistory({ ...s, proof:null }, 'nachweis zurückgesetzt', 'admin') : s)); toast('Nachweis zurückgesetzt', 'warn') }} className="bg-zinc-700">
                    Zurückweisen
                  </AnimatedButton>
                )}
                <AnimatedButton onClick={()=>{
                  const subj = encodeURIComponent('Antwort zu deinem Antrag: ' + detail.plan)
                  const body = encodeURIComponent(`Hi ${detail.name},\n\nHier ist die Zusammenfassung:\n\n${JSON.stringify(detail, null, 2)}\n\nLG`)
                  window.open(`mailto:${detail.email}?subject=${subj}&body=${body}`)
                }} className="bg-zinc-900 dark:bg-white dark:text-zinc-900">E-Mail mit Zusammenfassung</AnimatedButton>
                <AnimatedButton onClick={()=>navigator.clipboard?.writeText(JSON.stringify(detail, null, 2)).then(()=>toast('In Zwischenablage kopiert', 'success'))}>JSON kopieren</AnimatedButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AccountDialog({ subs, setSubs, onClose, user, setUser }){
  const [mode, setMode] = useState(user ? 'profile' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [updatingName, setUpdatingName] = useState(user?.displayName || '')
  const [showPass, setShowPass] = useState(false)
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(()=>{
    if (mode === 'profile' && user){
      markAllRead(user.email)
    }
  }, [mode, user])

  async function handleRegister(){
    setErr('')
    try {
      if (password !== password2) throw new Error('Passwörter stimmen nicht überein.')
      if (!isEmail(email)) throw new Error('Bitte gültige E-Mail.')
      const newUser = await registerUser({ email, password, displayName })
      setUser(newUser); setMode('profile'); setEmail(''); setPassword(''); setPassword2('')
      setUpdatingName(newUser.displayName || '')
      toast('Registriert & eingeloggt', 'success')
    } catch(e){ setErr(e.message || 'Fehler bei der Registrierung.'); setShake(true); setTimeout(()=>setShake(false), 420) }
  }

  async function handleLogin(){
    setErr('')
    try {
      const u = await loginUser({ email, password })
      setUser(u); setMode('profile'); setEmail(''); setPassword('')
      setUpdatingName(u.displayName || '')
      toast('Eingeloggt', 'success')
    } catch(e){ setErr(e.message || 'Login fehlgeschlagen.'); setShake(true); setTimeout(()=>setShake(false), 420) }
  }

  function handleLogout(){ logoutUser(); setUser(null); setMode('login'); toast('Ausgeloggt', 'info') }

  function handleUpdateName(){
    if (!user) return
    const usersRaw = localStorage.getItem('gianni_users_v1') || '[]'
    const users = JSON.parse(usersRaw)
    const idx = users.findIndex(u => u.id === user.id)
    if (idx >= 0){
      users[idx] = { ...users[idx], displayName: updatingName || users[idx].displayName }
      localStorage.setItem('gianni_users_v1', JSON.stringify(users))
      setUser(users[idx]); toast('Name aktualisiert', 'success')
    }
  }

  const mine = subs.filter(s => user && ((s.userId && s.userId === user.id) || (s.email && s.email.toLowerCase() === user.email.toLowerCase())))

  const messages = listMsgsFor(user?.email)

  function setSubById(id, patch, action='bearbeitet'){
    setSubs(subs.map(s => s.id === id ? addHistory({ ...s, ...patch }, action, 'user') : s))
  }

  function withdraw(id){
    const s = subs.find(x => x.id === id)
    if (!s) return
    if (!['angefragt','vormerkung'].includes(s.status)) return toast('Nur offene Anfragen können zurückgezogen werden.', 'warn')
    setSubById(id, { status: 'zurückgezogen' }, 'anfrage zurückgezogen')
    toast('Anfrage zurückgezogen', 'success')
  }

  function exportMine(){
    const blob = new Blob([JSON.stringify(mine, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `meine_abos_${new Date().toISOString().slice(0,10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleProofUpload(id, file){
    if (!file) return
    const ok = /image\/(png|jpeg|jpg|heic|webp)/i.test(file.type) || /\.(png|jpe?g|heic|webp)$/i.test(file.name)
    if (!ok) return toast('Bitte ein Bild (PNG/JPG/WEBP/HEIC) hochladen.', 'warn')
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setSubById(id, { proof: { name: file.name, size: file.size, type: file.type, dataUrl, verified:false } }, 'nachweis hochgeladen')
      toast('Nachweis hochgeladen – wartet auf Freigabe', 'success')
    }
    reader.readAsDataURL(file)
  }

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="dialog" aria-modal="true" variants={pop} initial="hidden" animate="show" exit="exit">
      <motion.div className={`w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl ${shake ? 'shake' : ''}`}
        initial={{ opacity:0, y: 12, scale: 0.99 }} animate={{ opacity:1, y:0, scale: 1 }} exit={{ opacity:0, y: 8 }} transition={spring}>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold">
            {mode === 'profile' ? 'Mein Konto' : (mode === 'register' ? 'Registrieren' : 'Einloggen')}
          </h3>
          <button onClick={onClose} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm">✕</button>
        </div>

        {mode !== 'profile' ? (
          <div className="mt-4 grid gap-3">
            {err && <div className="rounded-lg border border-red-300 bg-red-50/60 dark:bg-red-500/10 p-2 text-sm text-red-700 dark:text-red-300">{err}</div>}
            <Input type="email" label="E-Mail" value={email} onChange={setEmail} error={email && !isEmail(email) ? 'E-Mail ungültig' : ''} />
            <div className="grid gap-2">
              <Input type={showPass ? 'text' : 'password'} label="Passwort" value={password} onChange={setPassword} hint="mind. 6 Zeichen" />
              {mode === 'register' && <Input type={showPass ? 'text' : 'password'} label="Passwort wiederholen" value={password2} onChange={setPassword2} error={password2 && password2 !== password ? 'Stimmt nicht überein' : ''} />}
              <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <input type="checkbox" checked={showPass} onChange={e=>setShowPass(e.target.checked)} /> Passwort anzeigen
              </label>
            </div>
            {mode === 'register' && <Input label="Anzeigename (optional)" value={displayName} onChange={setDisplayName} placeholder="z. B. Gianni" />}
            <div className="flex gap-2">
              {mode === 'login' ? (
                <AnimatedButton onClick={handleLogin} className="bg-zinc-900 dark:bg-white dark:text-zinc-900">Einloggen</AnimatedButton>
              ) : (
                <AnimatedButton onClick={handleRegister} className="bg-gradient-to-r from-cyan-500 to-emerald-500">Registrieren</AnimatedButton>
              )}
              <motion.button whileTap={{ scale: 0.96 }} onClick={()=>{ setMode(mode === 'login' ? 'register' : 'login'); setErr('') }} className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm">
                {mode === 'login' ? 'Neu hier? Registrieren' : 'Ich habe schon ein Konto'}
              </motion.button>
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
                  <button onClick={handleLogout} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm">Logout</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <Input label="Anzeigename ändern" value={updatingName} onChange={setUpdatingName} />
                <AnimatedButton onClick={handleUpdateName} className="bg-zinc-900 dark:bg-white dark:text-zinc-900">Speichern</AnimatedButton>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatedButton onClick={exportMine}>Meine Daten exportieren</AnimatedButton>
              </div>
            </div>

            {/* Messages */}
            <div className="grid gap-2">
              <div className="text-sm font-semibold">Meine Nachrichten</div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 max-h-60 overflow-auto bg-white/60 dark:bg-zinc-900/60">
                {messages.length === 0 ? (
                  <div className="text-sm text-zinc-500">Keine Nachrichten.</div>
                ) : (
                  <ul className="space-y-2">
                    {messages.slice(0,12).map(m => (
                      <li key={m.id} className="text-sm">
                        <div className="font-medium">{m.subject}</div>
                        <div className="text-xs text-zinc-500">{new Date(m.t).toLocaleString('de-DE')}</div>
                        <div className="text-zinc-700 dark:text-zinc-300">{m.body}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2">
                <AnimatedButton onClick={()=>{ markAllRead(user.email) }}>Alle gelesen markieren</AnimatedButton>
              </div>
            </div>

            <MySubs subs={mine} onWithdraw={withdraw} onUploadProof={handleProofUpload} />
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function MySubs({ subs, onWithdraw, onUploadProof }){
  if (!subs) return null
  const active = subs.filter(s => s.status === 'aktiv')
  const pending = subs.filter(s => ['angefragt','vormerkung'].includes(s.status))
  const others = subs.filter(s => !['aktiv','angefragt','vormerkung'].includes(s.status))

  return (
    <div className="grid gap-3">
      <h4 className="text-sm font-semibold">Meine Abos & Anfragen</h4>
      {subs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-500">Noch keine Einträge.</div>
      ) : (
        <div className="grid gap-6">
          {pending.length > 0 && (<div className="grid gap-2">
            <div className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">Offene Anfragen</div>
            <div className="grid gap-3">{pending.map(s => <SubCard key={s.id} sub={s} onWithdraw={onWithdraw} />)}</div>
          </div>)}
          {active.length > 0 && (<div className="grid gap-2">
            <div className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">Aktiv</div>
            <div className="grid gap-3">{active.map(s => <SubCard key={s.id} sub={s} onUploadProof={onUploadProof} highlight />)}</div>
          </div>)}
          {others.length > 0 && (<div className="grid gap-2">
            <div className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">Weitere</div>
            <div className="grid gap-3">{others.map(s => <SubCard key={s.id} sub={s} />)}</div>
          </div>)}
        </div>
      )}
    </div>
  )
}

function SubCard({ sub, highlight=false, onWithdraw, onUploadProof }){
  const statusColor = { aktiv:'bg-emerald-600', angefragt:'bg-cyan-600', pausiert:'bg-amber-600', 'gekündigt':'bg-zinc-600', vormerkung:'bg-amber-500', 'abgelehnt':'bg-red-600', 'zurückgezogen':'bg-zinc-500' }
  const s = sub.status || 'angefragt'
  const color = statusColor[s] || 'bg-zinc-600'

  // Sichtbarkeit / Upload-Logik
  const isActive = s === 'aktiv'
  const isBank = sub.payment === 'bank'
  const hasProof = !!sub.proof
  const proofVerified = !!sub.proof?.verified
  const needsProof = isActive && isBank && !proofVerified

  // Zugang erst bei aktiv + (keine Bank) oder (Bank + verified)
  const access = (isActive && ( !isBank || proofVerified )) ? sub.zugangLink : ''

  return (
    <motion.div whileHover={{ y: -2 }} transition={spring}
      className={`rounded-xl border ${highlight ? 'border-emerald-300' : 'border-zinc-200 dark:border-zinc-800'} p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{sub.plan} {sub.yearly ? '(jährlich)' : '(monatlich)'}</div>
          <div className="text-xs text-zinc-500">{EUR(sub.price)} / Monat · Nächste Abbuchung: {sub.nextBilling ? fmtDate(sub.nextBilling) : '–'}</div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${color}`}>{s}</span>
      </div>

      {needsProof && (
        <div className="mt-3 rounded-lg border border-amber-400/60 bg-amber-50/50 dark:bg-amber-500/10 p-3">
          <div className="text-xs font-semibold mb-1 text-amber-700 dark:text-amber-300">Schritt nötig: Dauerauftrag-Nachweis</div>
          {hasProof && !proofVerified ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">Nachweis wurde hochgeladen und <b>wartet auf Freigabe</b>. Du kannst bei Bedarf ein neues Bild hochladen.</p>
          ) : (
            <p className="text-sm text-amber-800 dark:text-amber-200">Bitte lade ein Screenshot/Foto vom eingerichteten Dauerauftrag hoch. Danach prüfe ich es und gebe den Zugang frei.</p>
          )}
          <div className="mt-2">
            <input type="file" accept="image/*" onChange={e=>onUploadProof?.(sub.id, e.target.files?.[0])} />
          </div>
        </div>
      )}

      {hasProof && (
        <div className="mt-3 flex items-center gap-3">
          <img src={sub.proof.dataUrl} alt="Nachweis" className="h-20 w-20 object-cover rounded-lg border border-zinc-300 dark:border-zinc-700" />
          <div className="text-xs text-zinc-500">
            {sub.proof.name || 'nachweis'} {proofVerified ? '· freigegeben' : '· wartet auf Freigabe'}
          </div>
        </div>
      )}

      {access && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-400/60 bg-emerald-50/50 dark:bg-emerald-500/10 p-3">
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Zugang:</div>
          <a href={access} className="underline break-all" target="_blank">Jetzt öffnen</a>
          <button onClick={()=>navigator.clipboard?.writeText(access).then(()=>toast('Link kopiert', 'success'))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs">Kopieren</button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {['angefragt','vormerkung'].includes(s) ? (
          <AnimatedButton onClick={()=>onWithdraw?.(sub.id)} className="bg-zinc-700">Anfrage zurückziehen</AnimatedButton>
        ) : s==='aktiv' ? (
          <AnimatedButton onClick={()=>window.open(`mailto:${GIANNI_EMAIL}?subject=${encodeURIComponent('Kündigung anfragen: ' + sub.plan)}&body=${encodeURIComponent(`Hallo,\n\nich möchte mein Abo kündigen.\n\nAbo-ID: ${sub.id}\nWunschtermin: ${sub.nextBilling ? fmtDate(sub.nextBilling) : 'so schnell wie möglich'}\n\nDanke!`)}`)} className="bg-red-600">Kündigung anfragen</AnimatedButton>
        ) : null}
        <AnimatedButton onClick={()=>window.open(`mailto:${GIANNI_EMAIL}?subject=${encodeURIComponent('Frage zu meinem Abo: ' + sub.plan)}&body=${encodeURIComponent(`Hallo,\n\nich habe eine Frage zu meinem Abo (${sub.plan}).\n\nAbo-ID: ${sub.id}\nAktueller Status: ${sub.status}\n\nDanke!`)}`)} className="bg-zinc-900 dark:bg-white dark:text-zinc-900">Frage stellen</AnimatedButton>
      </div>
      {Array.isArray(sub.history) && sub.history.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500 font-semibold mb-1">Verlauf</div>
          <ul className="text-xs space-y-0.5">
            {sub.history.slice().reverse().slice(0,4).map((h,i)=>(<li key={i} className="text-zinc-600 dark:text-zinc-300">{new Date(h.t).toLocaleString('de-DE')} – {h.by}: {h.action}</li>))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
