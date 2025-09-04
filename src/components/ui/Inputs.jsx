import React, { useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function FieldShell({ id, label, hint, error, children }){
  return (
    <div className="grid gap-1.5">
      {label && <label htmlFor={id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</label>}
      {children}
      <div className="min-h-[18px]">
        <AnimatePresence initial={false} mode="wait">
          {error ? (
            <motion.div key="err" initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} className="text-xs text-red-600">
              {error}
            </motion.div>
          ) : hint ? (
            <motion.div key="hint" initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} className="text-[11px] text-zinc-500">
              {hint}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function Input({ label, hint, error, value, onChange, type='text', placeholder='', ...rest }){
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input id={id} type={type} value={value} placeholder={placeholder}
        onChange={e=>onChange?.(e.target.value)}
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none bg-transparent transition-colors
          ${error ? 'border-red-400 focus:ring-2 focus:ring-red-400/50' : 'border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-cyan-500/40'}`}
        {...rest}
      />
    </FieldShell>
  )
}

export function Textarea({ label, hint, error, value, onChange, rows=3, placeholder='', ...rest }){
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea id={id} rows={rows} value={value} placeholder={placeholder}
        onChange={e=>onChange?.(e.target.value)}
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none bg-transparent transition-colors
          ${error ? 'border-red-400 focus:ring-2 focus:ring-red-400/50' : 'border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-cyan-500/40'}`}
        {...rest}
      />
    </FieldShell>
  )
}

export function RadioGroup({ label, value, onChange, options=[] }){
  return (
    <div className="grid gap-2">
      {label && <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <label key={o.value} className={`rounded-xl border px-3 py-2 text-sm cursor-pointer select-none
            ${value===o.value ? 'border-cyan-400 bg-cyan-50/60 dark:bg-cyan-500/10' : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40'}`}>
            <input type="radio" name={label} className="hidden" checked={value===o.value} onChange={()=>onChange?.(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  )
}
