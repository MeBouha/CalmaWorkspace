import { PrismaClient, type ClientType, type Role, type RoomType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const USERS: { email: string; password: string; fullName: string; role: Role; clientType?: ClientType }[] = [
  { email: "manager@calma.tn", password: "Manager123!", fullName: "Gérant Calma", role: "MANAGER" },
  { email: "suivi@calma.tn", password: "Agent123!", fullName: "Sami Suivi", role: "FOLLOW_UP_AGENT" },
  { email: "paiement@calma.tn", password: "Agent123!", fullName: "Paula Paiement", role: "PAYMENT_AGENT" },
  { email: "etudiant@calma.tn", password: "Client123!", fullName: "Emna Étudiante", role: "CLIENT", clientType: "STUDENT" },
  { email: "eleve@calma.tn", password: "Client123!", fullName: "Elyes Élève", role: "CLIENT", clientType: "HIGH_SCHOOL_STUDENT" },
  { email: "dev@calma.tn", password: "Client123!", fullName: "Dora Développeuse", role: "CLIENT", clientType: "DEVELOPER" },
  { email: "entrepreneur@calma.tn", password: "Client123!", fullName: "Eya Entrepreneure", role: "CLIENT", clientType: "ENTREPRENEUR" },
];

const ROOMS: { name: string; type: RoomType; capacity: number; equipment: string[] }[] = [
  { name: "Salle Solo 1", type: "INDIVIDUAL", capacity: 1, equipment: ["table", "prise", "Wi-Fi"] },
  { name: "Salle Duo", type: "MULTI_PERSON", capacity: 2, equipment: ["table", "prise", "Wi-Fi"] },
  { name: "Salle Réunion A", type: "MEETING", capacity: 8, equipment: ["projecteur", "tableau blanc", "visio"] },
  { name: "Salle Formation", type: "TRAINING", capacity: 20, equipment: ["projecteur", "sonorisation"] },
];

/** Date relative to today at the given local time. */
function at(daysFromToday: number, hour: number, minute = 0) {
  return setMinutes(setHours(addDays(startOfDay(new Date()), daysFromToday), hour), minute);
}

async function main() {
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, role: u.role, clientType: u.clientType ?? null, active: true, passwordHash },
      create: { email: u.email, fullName: u.fullName, role: u.role, clientType: u.clientType, passwordHash },
    });
  }

  const roomIds: Record<string, string> = {};
  for (const r of ROOMS) {
    const existing = await prisma.room.findFirst({ where: { name: r.name } });
    const data = { type: r.type, capacity: r.capacity, equipment: JSON.stringify(r.equipment), active: true };
    const room = existing
      ? await prisma.room.update({ where: { id: existing.id }, data })
      : await prisma.room.create({ data: { name: r.name, ...data } });
    roomIds[r.name] = room.id;
  }

  await prisma.centerSettings.upsert({
    where: { id: "singleton" },
    update: { openingTime: "08:00", closingTime: "20:00", maxDurationMinutes: 240, bufferMinutes: 15 },
    create: { id: "singleton", openingTime: "08:00", closingTime: "20:00", maxDurationMinutes: 240, bufferMinutes: 15 },
  });

  // Demo bookings, relative to today. Search tomorrow 10:00–11:00 for 5 people:
  // "Salle Réunion A" is taken, only "Salle Formation" shows up.
  await prisma.booking.deleteMany();
  await prisma.booking.createMany({
    data: [
      { roomId: roomIds["Salle Réunion A"], startAt: at(1, 10), endAt: at(1, 12), participants: 6 },
      { roomId: roomIds["Salle Solo 1"], startAt: at(1, 14), endAt: at(1, 16), participants: 1 },
      { roomId: roomIds["Salle Formation"], startAt: at(2, 9), endAt: at(2, 13), participants: 15 },
      { roomId: roomIds["Salle Duo"], startAt: at(0, 18), endAt: at(0, 20), participants: 2 },
    ],
  });

  console.log(`Seed OK: ${USERS.length} utilisateurs, ${ROOMS.length} salles, 4 réservations de démo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
