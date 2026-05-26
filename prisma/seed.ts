/**
 * prisma/seed.ts — Datos de prueba para desarrollo
 *
 * Equipo: Las Pibas FC
 *   • 3 usuarias con cuenta  (capitana + 2 jugadoras registradas)
 *   • 10 TeamMembers          (3 vinculadas a User, 7 sin cuenta aún)
 *   • 2 Eventos               (Cuota Mayo + Amistoso vs San Lorenzo)
 *   • Participaciones variadas (PAGO / PENDIENTE / EXIMIDA)
 *   • 2 Gastos                (entrenador + cancha)
 *
 * Uso:
 *   npx prisma db seed          → corre el seed
 *   npx prisma migrate reset    → resetea la BD y corre el seed automáticamente
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  EventType,
  ParticipantStatus,
  PrismaClient,
  TeamMemberStatus,
  UserRole,
} from "../src/generated/prisma/client";

// ── Cliente ──────────────────────────────────────────────────────────────────

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fecha en zona horaria Argentina (UTC-3) para evitar corrimientos de un día */
function ar(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00-03:00`);
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

async function cleanup() {
  console.log("  🗑️  Limpiando datos anteriores...");
  // Orden: hijos antes que padres para respetar FKs
  await prisma.payment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.event.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Iniciando seed de TeamPay.ar...\n");

  await cleanup();

  // ── Usuarios ────────────────────────────────────────────────────────────────

  console.log("  👤 Creando usuarias...");

  const valentina = await prisma.user.create({
    data: {
      email: "valentina.garcia@gmail.com",
      name: "Valentina García",
      role: UserRole.CAPITANA,
      image: "https://i.pravatar.cc/150?u=valentina.garcia",
    },
  });

  const camila = await prisma.user.create({
    data: {
      email: "camila.rodriguez@gmail.com",
      name: "Camila Rodríguez",
      role: UserRole.JUGADORA,
      image: "https://i.pravatar.cc/150?u=camila.rodriguez",
    },
  });

  const sofia = await prisma.user.create({
    data: {
      email: "sofia.martinez@gmail.com",
      name: "Sofía Martínez",
      role: UserRole.JUGADORA,
      image: "https://i.pravatar.cc/150?u=sofia.martinez",
    },
  });

  // ── Equipo ──────────────────────────────────────────────────────────────────

  console.log("  🏟️  Creando equipo Las Pibas FC...");

  const team = await prisma.team.create({
    data: {
      name: "Las Pibas FC",
      description:
        "Equipo de fútbol femenino amateur del barrio de Almagro, CABA. " +
        "Entrenamos martes y jueves de 19 a 21 hs. ¡Todas bienvenidas!",
      ownerId: valentina.id,
    },
  });

  // ── Jugadoras (TeamMembers) ─────────────────────────────────────────────────
  //
  //  Las primeras 3 tienen cuenta en la app (userId vinculado).
  //  Las restantes 7 las cargó la capitana manualmente — sin cuenta aún.

  console.log("  👥 Creando 10 jugadoras...");

  const [
    mVale, // 1 — Valentina García    (capitana, tiene cuenta)
    mCami, // 2 — Camila Rodríguez    (tiene cuenta)
    mSofi, // 3 — Sofía Martínez      (tiene cuenta)
    mLuci, // 4 — Lucía Fernández     (sin cuenta)
    mFlor, // 5 — Florencia López     (sin cuenta)
    mAgus, // 6 — Agustina González   (sin cuenta)
    mMila, // 7 — Milagros Pérez      (sin cuenta)
    mRomi, // 8 — Romina Díaz         (sin cuenta, lesionada → EXIMIDA)
    mNata, // 9 — Natalia Torres      (sin cuenta)
    mMice, // 10 — Micaela Sánchez    (sin cuenta)
  ] = await Promise.all([
    prisma.teamMember.create({
      data: { teamId: team.id, name: "Valentina García", userId: valentina.id },
    }),
    prisma.teamMember.create({
      data: { teamId: team.id, name: "Camila Rodríguez", userId: camila.id },
    }),
    prisma.teamMember.create({
      data: { teamId: team.id, name: "Sofía Martínez", userId: sofia.id },
    }),
    prisma.teamMember.create({
      data: { teamId: team.id, name: "Lucía Fernández" },
    }),
    prisma.teamMember.create({
      data: { teamId: team.id, name: "Florencia López" },
    }),
    prisma.teamMember.create({
      data: { teamId: team.id, name: "Agustina González" },
    }),
    prisma.teamMember.create({
      data: { teamId: team.id, name: "Milagros Pérez" },
    }),
    prisma.teamMember.create({
      // Romina está lesionada este mes → la capitana la eximirá de los pagos
      data: {
        teamId: team.id,
        name: "Romina Díaz",
        status: TeamMemberStatus.ACTIVA,
      },
    }),
    prisma.teamMember.create({
      data: { teamId: team.id, name: "Natalia Torres" },
    }),
    prisma.teamMember.create({
      data: { teamId: team.id, name: "Micaela Sánchez" },
    }),
  ]);

  const todasLasJugadoras = [
    mVale, mCami, mSofi, mLuci, mFlor,
    mAgus, mMila, mRomi, mNata, mMice,
  ];

  // ── Eventos ─────────────────────────────────────────────────────────────────

  console.log("  📅 Creando eventos...");

  const cuotaMayo = await prisma.event.create({
    data: {
      teamId: team.id,
      name: "Cuota Mayo 2026",
      type: EventType.CUOTA,
      amountPerPlayer: "5000.00",
      dueDate: ar("2026-05-31"),
    },
  });

  const amistoso = await prisma.event.create({
    data: {
      teamId: team.id,
      name: "Amistoso vs. San Lorenzo Femenino",
      type: EventType.AMISTOSO,
      amountPerPlayer: "3000.00",
      dueDate: ar("2026-05-18"),
    },
  });

  // ── Participaciones y pagos ─────────────────────────────────────────────────
  //
  //  Cuota Mayo   →  PAGO: Vale, Cami, Sofi, Luci, Mice (5)
  //                  PENDIENTE: Flor, Agus, Mila, Nata  (4)
  //                  EXIMIDA: Romi                       (1)
  //
  //  Amistoso     →  PAGO: Vale, Cami, Flor, Agus, Mice (5)
  //                  PENDIENTE: Sofi, Luci, Mila, Nata  (4)
  //                  EXIMIDA: Romi                       (1)

  console.log("  📋 Creando participaciones...");

  type StatusMap = Record<string, ParticipantStatus>;

  const cuotaStatusMap: StatusMap = {
    [mVale.id]: ParticipantStatus.PAGO,
    [mCami.id]: ParticipantStatus.PAGO,
    [mSofi.id]: ParticipantStatus.PAGO,
    [mLuci.id]: ParticipantStatus.PAGO,
    [mFlor.id]: ParticipantStatus.PENDIENTE,
    [mAgus.id]: ParticipantStatus.PENDIENTE,
    [mMila.id]: ParticipantStatus.PENDIENTE,
    [mRomi.id]: ParticipantStatus.EXIMIDA,   // lesionada
    [mNata.id]: ParticipantStatus.PENDIENTE,
    [mMice.id]: ParticipantStatus.PAGO,
  };

  const amistosoStatusMap: StatusMap = {
    [mVale.id]: ParticipantStatus.PAGO,
    [mCami.id]: ParticipantStatus.PAGO,
    [mSofi.id]: ParticipantStatus.PENDIENTE,
    [mLuci.id]: ParticipantStatus.PENDIENTE,
    [mFlor.id]: ParticipantStatus.PAGO,
    [mAgus.id]: ParticipantStatus.PAGO,
    [mMila.id]: ParticipantStatus.PENDIENTE,
    [mRomi.id]: ParticipantStatus.EXIMIDA,   // lesionada
    [mNata.id]: ParticipantStatus.PENDIENTE,
    [mMice.id]: ParticipantStatus.PAGO,
  };

  const participsCuota = await Promise.all(
    todasLasJugadoras.map((m) =>
      prisma.eventParticipant.create({
        data: {
          eventId: cuotaMayo.id,
          teamMemberId: m.id,
          status: cuotaStatusMap[m.id],
        },
      })
    )
  );

  const participsAmistoso = await Promise.all(
    todasLasJugadoras.map((m) =>
      prisma.eventParticipant.create({
        data: {
          eventId: amistoso.id,
          teamMemberId: m.id,
          status: amistosoStatusMap[m.id],
        },
      })
    )
  );

  // ── Pagos ───────────────────────────────────────────────────────────────────
  //
  //  Valentina confirma todos los pagos como capitana.
  //  Camila siempre adjunta comprobante de transferencia.
  //  El resto paga en efectivo → sin receiptUrl.

  console.log("  💰 Registrando pagos...");

  // Fechas de pago para la Cuota Mayo
  const cuotaPaidAt: Record<string, Date> = {
    [mVale.id]: ar("2026-05-02"),
    [mCami.id]: ar("2026-05-03"),
    [mSofi.id]: ar("2026-05-05"),
    [mLuci.id]: ar("2026-05-08"),
    [mMice.id]: ar("2026-05-10"),
  };

  // Fechas de pago para el Amistoso
  const amistosoPaidAt: Record<string, Date> = {
    [mVale.id]: ar("2026-05-15"),
    [mCami.id]: ar("2026-05-15"),
    [mFlor.id]: ar("2026-05-16"),
    [mAgus.id]: ar("2026-05-16"),
    [mMice.id]: ar("2026-05-17"),
  };

  // Comprobante de transferencia solo para Camila
  const camiReceiptCuota =
    "https://res.cloudinary.com/teampay-demo/image/upload/comprobante_cuota_mayo_camila.jpg";
  const camiReceiptAmistoso =
    "https://res.cloudinary.com/teampay-demo/image/upload/comprobante_amistoso_camila.jpg";

  // Pagos de Cuota Mayo
  for (const p of participsCuota) {
    if (p.status !== ParticipantStatus.PAGO) continue;
    await prisma.payment.create({
      data: {
        eventParticipantId: p.id,
        amount: "5000.00",
        paidAt: cuotaPaidAt[p.teamMemberId],
        confirmedById: valentina.id,
        receiptUrl:
          p.teamMemberId === mCami.id ? camiReceiptCuota : null,
      },
    });
  }

  // Pagos del Amistoso
  for (const p of participsAmistoso) {
    if (p.status !== ParticipantStatus.PAGO) continue;
    await prisma.payment.create({
      data: {
        eventParticipantId: p.id,
        amount: "3000.00",
        paidAt: amistosoPaidAt[p.teamMemberId],
        confirmedById: valentina.id,
        receiptUrl:
          p.teamMemberId === mCami.id ? camiReceiptAmistoso : null,
      },
    });
  }

  // ── Gastos ──────────────────────────────────────────────────────────────────

  console.log("  💸 Registrando gastos del equipo...");

  await prisma.expense.createMany({
    data: [
      {
        teamId: team.id,
        concept: "Pago entrenador — Mayo 2026",
        amount: "20000.00",
        paidTo: "Carlos Suárez",
        paidAt: ar("2026-05-05"),
      },
      {
        teamId: team.id,
        concept: "Alquiler cancha — Amistoso vs. San Lorenzo",
        amount: "12000.00",
        paidTo: "Club Atlético Parque",
        paidAt: ar("2026-05-18"),
      },
    ],
  });

  // ── Resumen ──────────────────────────────────────────────────────────────────

  const [users, members, events, participants, payments, expenses] =
    await Promise.all([
      prisma.user.count(),
      prisma.teamMember.count(),
      prisma.event.count(),
      prisma.eventParticipant.count(),
      prisma.payment.count(),
      prisma.expense.count(),
    ]);

  // Cálculo de lo recaudado
  const totalRecaudado = await prisma.payment.aggregate({
    _sum: { amount: true },
  });

  console.log(`
╔══════════════════════════════════════════╗
║        ✅ Seed completado con éxito       ║
╠══════════════════════════════════════════╣
║  👤 Usuarias registradas  : ${String(users).padStart(2)}           ║
║  👥 Jugadoras (TeamMember): ${String(members).padStart(2)}           ║
║  📅 Eventos               : ${String(events).padStart(2)}           ║
║  📋 Participaciones       : ${String(participants).padStart(2)}           ║
║  💰 Pagos registrados     : ${String(payments).padStart(2)}           ║
║  💸 Gastos                : ${String(expenses).padStart(2)}           ║
╠══════════════════════════════════════════╣
║  💵 Total recaudado: $${String(totalRecaudado._sum.amount ?? 0).padEnd(19)}║
╚══════════════════════════════════════════╝

  Capitana:  valentina.garcia@gmail.com
  Jugadoras: camila.rodriguez@gmail.com
             sofia.martinez@gmail.com
  `);
}

// ── Ejecución ─────────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error("\n❌ Error durante el seed:\n", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
