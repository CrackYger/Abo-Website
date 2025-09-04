import React from 'react'
import { motion } from 'framer-motion'
import { pop, spring } from '../../lib/motion.js'
import { GIANNI_EMAIL } from '../../constants.js'

function Section({ title, children }){
  return (
    <div className="grid gap-1">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="prose prose-zinc dark:prose-invert max-w-none text-sm">{children}</div>
    </div>
  )
}

export default function LegalDialog({ kind='impressum', onClose }){
  const isImpressum = kind === 'impressum'
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="dialog" aria-modal="true" variants={pop} initial="hidden" animate="show" exit="exit">
      <motion.div className="w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl"
        initial={{ opacity:0, y: 12, scale: 0.99 }} animate={{ opacity:1, y:0, scale: 1 }} exit={{ opacity:0, y: 8 }} transition={spring}>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold">{isImpressum ? 'Impressum' : 'Datenschutz'}</h3>
          <button onClick={onClose} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-sm">✕</button>
        </div>

        {isImpressum ? (
          <div className="mt-4 grid gap-4 text-sm">
            <Section title="Anbieter">
              <p><strong>Name:</strong> Gianni Harre</p>
              <p><strong>Adresse:</strong> Heinrich-Hertz-Straße 42897 Remscheid</p>
              <p><strong>E-Mail:</strong> <a className="underline" href={`mailto:${GIANNI_EMAIL}`}>{GIANNI_EMAIL}</a></p>
            </Section>
            <Section title="Verantwortlich i.S.d. § 18 Abs. 2 MStV">
              <p>Gianni Harre · Heinrich-Hertz-Straße 42897 Remscheid</p>
            </Section>
            <Section title="Haftung für Inhalte">
              <p>Dies ist ein privates Abo-Portal. Inhalte wurden mit größter Sorgfalt erstellt; für die Richtigkeit, Vollständigkeit und Aktualität wird keine Gewähr übernommen.</p>
            </Section>
            <Section title="Haftung für Links">
              <p>Externe Links wurden zum Zeitpunkt der Verlinkung geprüft. Auf deren Inhalte habe ich keinen Einfluss; für diese Inhalte sind die jeweiligen Anbieter verantwortlich.</p>
            </Section>
            <div className="flex justify-end gap-2">
              <button onClick={()=>window.print()} className="rounded-xl border px-3 py-1.5 text-sm">Als PDF drucken</button>
              <button onClick={onClose} className="rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-1.5 text-sm">Schließen</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 text-sm">
            <Section title="Kurzfassung">
              <ul>
                <li>Dieses Portal speichert Einträge <strong>lokal</strong> im Browser (LocalStorage).</li>
                <li>Bei „Abo anfragen“ / „Vormerken“ wird eine E-Mail über dein Mailprogramm vorbereitet (mailto:), es erfolgt <strong>kein Server-Versand</strong>.</li>
                <li>Du kannst die lokal gespeicherten Daten jederzeit über „Admin → Alles löschen“ entfernen.</li>
              </ul>
            </Section>
            <Section title="Verantwortlicher">
              <p><strong>Name:</strong> Gianni Harre</p>
              <p><strong>Adresse:</strong> Heinrich-Hertz-Straße 42897 Remscheid</p>
              <p><strong>E-Mail:</strong> <a className="underline" href={`mailto:${GIANNI_EMAIL}`}>{GIANNI_EMAIL}</a></p>
            </Section>
            <Section title="Datenverarbeitung">
              <ul>
                <li><strong>Kundendaten:</strong> Name, E-Mail, optional Telefon/Adresse/Notizen – nur lokal.</li>
                <li><strong>Nutzerdaten (Konto):</strong> E-Mail + Passwort-Hash (mit Salt) – lokal.</li>
                <li><strong>Keine Cookies von Drittanbietern.</strong></li>
              </ul>
            </Section>
            <Section title="Rechte">
              <p>Du kannst jederzeit Auskunft, Berichtigung oder Löschung verlangen. Kontaktiere mich per E-Mail.</p>
            </Section>
            <Section title="Stand">
              <p>{new Date().toISOString().slice(0,10)}</p>
            </Section>
            <div className="flex justify-end gap-2">
              <button onClick={()=>window.print()} className="rounded-xl border px-3 py-1.5 text-sm">Als PDF drucken</button>
              <button onClick={onClose} className="rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-1.5 text-sm">Schließen</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
