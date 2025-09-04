import React from 'react'

export default function Steps({ current=1 }){
  const items = ['Details', 'Zahlung & Start', 'Check & Senden']
  return (
    <div className="flex items-center gap-3 text-xs">
      {items.map((t, i) => {
        const n = i+1
        const active = n <= current
        return (
          <div key={t} className="flex items-center gap-2">
            <span className={`h-5 w-5 grid place-items-center rounded-full text-[10px] font-bold ${active ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600'}`}>{n}</span>
            <span className={`${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{t}</span>
            {n < items.length && <span className="mx-1 text-zinc-400">—</span>}
          </div>
        )
      })}
    </div>
  )
}
