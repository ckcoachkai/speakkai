const SLOT_KEY = "speakkai.slots.v1";
const BOOKING_KEY = "speakkai.bookings.v1";
const PROFILE_KEY = "speakkai.profile.v1";

const seedSlots = [
  {
    id: "seed-1",
    startsAt: nextDate("09:30", 2),
    duration: 30,
    mode: "online",
    note: "Parent consultation",
    status: "open"
  },
  {
    id: "seed-2",
    startsAt: nextDate("16:00", 4),
    duration: 45,
    mode: "online",
    note: "Speech coaching",
    status: "open"
  },
  {
    id: "seed-3",
    startsAt: nextDate("10:30", 7),
    duration: 60,
    mode: "in-person",
    note: "Practice session",
    status: "open"
  }
];

function nextDate(time, daysAhead) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function readJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeedSlots() {
  const current = readJson(SLOT_KEY, null);
  if (!Array.isArray(current)) {
    writeJson(SLOT_KEY, seedSlots);
  }
}

export function getProfile() {
  return readJson(PROFILE_KEY, { name: "", email: "" });
}

export function saveProfile(profile) {
  writeJson(PROFILE_KEY, profile);
  return profile;
}

export function listSlots() {
  ensureSeedSlots();
  return readJson(SLOT_KEY, [])
    .filter((slot) => new Date(slot.startsAt).getTime() > Date.now() - 86400000)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export function listBookings() {
  return readJson(BOOKING_KEY, []);
}

export function addSlot(slot) {
  const slots = listSlots();
  const nextSlot = {
    id: `slot-${Date.now()}`,
    status: "open",
    ...slot
  };
  writeJson(SLOT_KEY, [...slots, nextSlot]);
  return nextSlot;
}

export function removeSlot(slotId) {
  const slots = listSlots().filter((slot) => slot.id !== slotId);
  const bookings = listBookings().filter((booking) => booking.slotId !== slotId);
  writeJson(SLOT_KEY, slots);
  writeJson(BOOKING_KEY, bookings);
}

export function bookSlot(slotId, profile) {
  const slots = listSlots();
  const slot = slots.find((item) => item.id === slotId);
  if (!slot || slot.status !== "open") {
    throw new Error("This time is no longer available.");
  }

  const booking = {
    id: `booking-${Date.now()}`,
    slotId,
    name: profile.name,
    email: profile.email,
    createdAt: new Date().toISOString(),
    status: "requested"
  };

  writeJson(
    SLOT_KEY,
    slots.map((item) => (item.id === slotId ? { ...item, status: "booked" } : item))
  );
  writeJson(BOOKING_KEY, [...listBookings(), booking]);
  return booking;
}

export function formatSlot(slot) {
  const date = new Date(slot.startsAt);
  return {
    date: new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric"
    }).format(date),
    time: new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date),
    full: new Intl.DateTimeFormat("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(date)
  };
}
