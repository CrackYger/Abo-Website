// --- HOTFIX: corrected ternary + logical AND in AccountDialog heading and SubCard access section ---
/* Replace in your AboPortal.jsx:

<h3 className="text-lg font-bold">{mode === 'profile' ? 'Mein Konto' : 'Registrieren' if mode === 'register' else 'Einloggen'}</h3>

with ↓ */

<h3 className="text-lg font-bold">
  {mode === 'profile' ? 'Mein Konto' : (mode === 'register' ? 'Registrieren' : 'Einloggen')}
</h3>

/* And replace the access box condition:

{access && (!needsProof || sub.proof) and ( ... )}

with ↓ */

{access && (!needsProof || sub.proof) && (
  /* ... unchanged inner content ... */
)}
