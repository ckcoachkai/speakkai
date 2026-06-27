import { bookSlot, formatSlot, getProfile, listSlots, saveProfile } from "./booking-store.js";

const profileForm = document.querySelector("#booking-profile-form");
const nameInput = document.querySelector("#booking-name");
const emailInput = document.querySelector("#booking-email");
const slotList = document.querySelector("#slot-list");
const summary = document.querySelector("#booking-summary");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

let activeFilter = "all";

const profile = getProfile();
nameInput.value = profile.name || "";
emailInput.value = profile.email || "";

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const saved = saveProfile({
    name: nameInput.value.trim(),
    email: emailInput.value.trim()
  });
  summary.innerHTML = `<p>Saved for ${saved.name}.</p>`;
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderSlots();
  });
});

function renderSlots() {
  const slots = listSlots().filter((slot) => {
    if (slot.status !== "open") return false;
    return activeFilter === "all" || slot.mode === activeFilter;
  });

  if (!slots.length) {
    slotList.innerHTML = `<div class="empty-state">No open times for this view.</div>`;
    return;
  }

  slotList.innerHTML = slots
    .map((slot) => {
      const formatted = formatSlot(slot);
      return `
        <article class="slot-card">
          <div>
            <span>${formatted.date}</span>
            <h3>${formatted.time}</h3>
            <p>${slot.duration} minutes · ${slot.mode.replace("-", " ")}</p>
            <small>${slot.note || "Speaking support session"}</small>
          </div>
          <button type="button" data-book="${slot.id}">Book</button>
        </article>
      `;
    })
    .join("");

  slotList.querySelectorAll("[data-book]").forEach((button) => {
    button.addEventListener("click", () => handleBooking(button.dataset.book));
  });
}

function handleBooking(slotId) {
  const currentProfile = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim()
  };

  if (!currentProfile.name || !currentProfile.email) {
    summary.innerHTML = `<p>Please add your name and email first.</p>`;
    return;
  }

  try {
    saveProfile(currentProfile);
    const booking = bookSlot(slotId, currentProfile);
    summary.innerHTML = `
      <p><strong>Requested.</strong></p>
      <p>${currentProfile.name}, Kai will follow up at ${currentProfile.email}.</p>
      <small>Booking ID: ${booking.id}</small>
    `;
    renderSlots();
  } catch (error) {
    summary.innerHTML = `<p>${error.message}</p>`;
  }
}

renderSlots();
