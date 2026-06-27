import { addSlot, formatSlot, listBookings, listSlots, removeSlot } from "./booking-store.js";

const accessForm = document.querySelector("#admin-access-form");
const passcodeInput = document.querySelector("#admin-passcode");
const adminTools = document.querySelector("#admin-tools");
const adminListPanel = document.querySelector("#admin-list-panel");
const availabilityForm = document.querySelector("#availability-form");
const slotList = document.querySelector("#admin-slot-list");

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const unlocked = passcodeInput.value === "kai-admin";
  adminTools.classList.toggle("is-locked", !unlocked);
  adminListPanel.classList.toggle("is-locked", !unlocked);
  if (unlocked) {
    renderAdminSlots();
  }
});

availabilityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const date = document.querySelector("#slot-date").value;
  const time = document.querySelector("#slot-time").value;
  const duration = Number(document.querySelector("#slot-duration").value);
  const mode = document.querySelector("#slot-mode").value;
  const note = document.querySelector("#slot-note").value.trim();
  const startsAt = new Date(`${date}T${time}:00`).toISOString();

  addSlot({ startsAt, duration, mode, note });
  availabilityForm.reset();
  renderAdminSlots();
});

function renderAdminSlots() {
  const bookings = listBookings();
  const slots = listSlots();

  if (!slots.length) {
    slotList.innerHTML = `<div class="empty-state">No slots yet.</div>`;
    return;
  }

  slotList.innerHTML = slots
    .map((slot) => {
      const formatted = formatSlot(slot);
      const booking = bookings.find((item) => item.slotId === slot.id);
      const status = booking
        ? `${booking.name} · ${booking.email}`
        : slot.status === "booked"
          ? "Booked"
          : "Open";

      return `
        <article class="admin-slot-card">
          <div>
            <span>${formatted.full}</span>
            <h3>${slot.note || "Speaking support"}</h3>
            <p>${slot.duration} minutes · ${slot.mode.replace("-", " ")} · ${status}</p>
          </div>
          <button type="button" data-remove="${slot.id}" aria-label="Remove slot">Remove</button>
        </article>
      `;
    })
    .join("");

  slotList.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeSlot(button.dataset.remove);
      renderAdminSlots();
    });
  });
}
