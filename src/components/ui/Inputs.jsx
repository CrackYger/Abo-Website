import React from 'react'

export function Input({ label, value, onChange, type='text', placeholder='', disabled=false }){
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-600 dark:text-zinc-300">{label}</span>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-colors disabled:opacity-60"/>
    </label>
  )
}

export function Textarea({ label, value, onChange, rows=3 }){
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-600 dark:text-zinc-300">{label}</span>
      <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"/>
    </label>
  )
}

export function RadioGroup({ label, value, onChange, options }){
  return (
    <fieldset>
      <legend className="text-xs text-zinc-600 dark:text-zinc-300 mb-2">{label}</legend>
      <div className="grid gap-2">
        {options.map(o => (
          <label key={o.value} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${value===o.value ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-500/10' : 'border-zinc-300 dark:border-zinc-700'}`}>
            <span>{o.label}</span>
            <input type="radio" checked={value===o.value} onChange={()=>onChange(o.value)} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
