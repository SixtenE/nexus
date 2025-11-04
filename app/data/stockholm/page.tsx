
'use client';

import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Row = {
  id: number
  energiklass?: string
  primarenergital?: number
  ventilationskontroll?: string
  byggnadsar?: number
  utförd?: string
  [key: string]: any
}

export default function StockholmDataPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/data/stockholm', { cache: 'no-store' })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setRows(data.rows ?? [])
      } catch (e:any) {
        setErr(e.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(r => JSON.stringify(r).toLowerCase().includes(needle))
  }, [rows, q])

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Stockholm Energy Declarations</h1>
          <p className="text-muted-foreground">Boverket sample (100 rows). Simple read-only view.</p>
        </div>
        <Button asChild>
          <a href="/">Home</a>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b">
          <Input
            placeholder="Search anything…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="max-w-sm"
          />
          <div className="ml-auto text-sm text-muted-foreground">
            {filtered.length} / {rows.length}
          </div>
        </div>
        <CardContent className="p-0">
          <div className="w-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0 z-10">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Energiklass</th>
                  <th className="px-3 py-2 font-medium">Primärenergi</th>
                  <th className="px-3 py-2 font-medium">Ventilation</th>
                  <th className="px-3 py-2 font-medium">Byggnadsår</th>
                  <th className="px-3 py-2 font-medium">Utförd</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td className="px-3 py-3" colSpan={6}>Loading…</td></tr>
                )}
                {err && !loading && (
                  <tr><td className="px-3 py-3 text-destructive" colSpan={6}>{err}</td></tr>
                )}
                {!loading && !err && filtered.map((r: Row) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">{r.energiklass ?? '-'}</td>
                    <td className="px-3 py-2">{r.primarenergital ?? '-'}</td>
                    <td className="px-3 py-2">{r.ventilationskontroll ?? '-'}</td>
                    <td className="px-3 py-2">{r.byggnadsar ?? '-'}</td>
                    <td className="px-3 py-2">{r.utförd ?? '-'}</td>
                  </tr>
                ))}
                {!loading && !err && filtered.length === 0 && (
                  <tr><td className="px-3 py-3" colSpan={6}>No matches.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
