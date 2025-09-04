import React from 'react'
export default function SummaryRow({ k, v }){
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{k}</div>
      <div className="text-sm">{v}</div>
    </div>
  )
}
