import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getCurrentUser } from "@/lib/auth"
import { getTeamBalance, type FiltroFecha } from "@/services/balanceService"
import { getTeamById } from "@/services/teamService"
import { checkIsCapitana } from "@/services/eventoService"
import { EVENT_TYPE_LABELS } from "@/lib/validations/evento"
import type { EventType } from "@/generated/prisma/client"

type Params = { params: Promise<{ equipoId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "No autenticada" }, { status: 401 })

  const { equipoId } = await params

  const isCapitana = await checkIsCapitana(equipoId, user.id)
  if (!isCapitana) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { searchParams } = req.nextUrl
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  const filtro: FiltroFecha = {}
  if (desde) filtro.desde = new Date(desde + "T00:00:00")
  if (hasta) filtro.hasta = new Date(hasta + "T23:59:59")

  const [teamResult, balanceResult] = await Promise.all([
    getTeamById(equipoId, user.id),
    getTeamBalance(equipoId, user.id, filtro),
  ])

  if (!teamResult.success || !balanceResult.success) {
    return NextResponse.json({ error: "No se pudo obtener el balance" }, { status: 500 })
  }

  const equipo = teamResult.data
  const { totalCobrado, totalGastado, balance, cobradoEfectivo, cobradoTransferencia, eventos, gastos } =
    balanceResult.data

  const wb = XLSX.utils.book_new()

  // ── Hoja 1: Resumen ──────────────────────────────────────────────────────────
  const resumenData = [
    ["TeamPayment.app — Balance financiero"],
    ["Equipo", equipo.name],
    ["Fecha de exportación", new Date().toLocaleDateString("es-AR")],
    [],
    ["Concepto", "Monto (ARS)"],
    ["Total cobrado", totalCobrado],
    ["  Efectivo", cobradoEfectivo],
    ["  Transferencia", cobradoTransferencia],
    ["Total gastado", totalGastado],
    ["Balance neto", balance],
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  wsResumen["!cols"] = [{ wch: 28 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen")

  // ── Hoja 2: Eventos ──────────────────────────────────────────────────────────
  const eventosHeaders = [
    "Evento",
    "Tipo",
    "Fecha",
    "Monto por jugadora",
    "Obligadas",
    "Pagaron",
    "Cobrado",
    "Esperado",
    "Progreso %",
  ]
  const eventosRows = eventos.map((ev) => [
    ev.name,
    EVENT_TYPE_LABELS[ev.type as EventType],
    new Date(ev.dueDate).toLocaleDateString("es-AR"),
    ev.amountPerPlayer,
    ev.obligadas,
    ev.pagaron,
    ev.totalCobrado,
    ev.totalEsperado,
    ev.progreso,
  ])
  const wsEventos = XLSX.utils.aoa_to_sheet([eventosHeaders, ...eventosRows])
  wsEventos["!cols"] = [
    { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
    { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, wsEventos, "Eventos")

  // ── Hoja 3: Gastos ───────────────────────────────────────────────────────────
  const gastosHeaders = ["Concepto", "Pagado a", "Fecha", "Categoría", "Monto"]
  const gastosRows = gastos.map((g) => [
    g.concept,
    g.paidTo,
    new Date(g.paidAt).toLocaleDateString("es-AR"),
    g.category,
    Number(g.amount),
  ])
  const wsGastos = XLSX.utils.aoa_to_sheet([gastosHeaders, ...gastosRows])
  wsGastos["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos")

  // ── Generar buffer y responder ───────────────────────────────────────────────
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const filename = `balance-${equipo.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
