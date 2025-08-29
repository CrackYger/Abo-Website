import React from 'react'
export default function SummaryRow({ k, v }){
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 py-2">
      <span className="text-zinc-500">{k}</span>
      <span className="font-medium text-right whitespace-pre-wrap">{v}</span>
    </div>
  )
}
