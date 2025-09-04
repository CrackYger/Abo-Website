# Patch 015d – Zugang strikt erst nach Freigabe

**Änderungen**
- **Zugang-Link wird NIE vor Annahme angezeigt.**
- Bei `status = aktiv` + `Zahlung = Überweisung`:
  1) Nutzer lädt **Nachweis** (Bild) hoch → Status: *wartet auf Freigabe*.
  2) **Admin** prüft im Antrags-Grid/Detail und klickt **„Freigeben“** → `proof.verified = true`.
  3) Erst dann wird der **Zugang-Link** im Konto sichtbar.
- Admin kann Nachweis **Zurückweisen** (setzt `proof=null`) – Nutzer kann neu hochladen.
- Spalte „Zugang“ zeigt Hinweis *„wird nach Prüfung freigegeben“*, solange nicht verifiziert.

**Installation**
1. ZIP entpacken.
2. `src/components/AboPortal.jsx` ins Projekt kopieren (überschreiben).
3. Dev-Server neu starten (`npm run dev`).

**Test**
- Nutzer Antrag stellen (Zahlung: Überweisung).
- Admin → *Annehmen* → Nutzer-Account zeigt **Upload-Karte**.
- Nutzer lädt Bild hoch → Admin sieht **„Freigeben / Zurückweisen“**.
- Nach **Freigeben**: Nutzer sieht **Zugang**-Box.
