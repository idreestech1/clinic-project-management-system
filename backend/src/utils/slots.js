const SLOT_DURATION_MINUTES = 10;
const WORKDAY_START_MINUTES = 16 * 60;
const WORKDAY_END_MINUTES = 20 * 60;

const formatSlotTime = (totalMinutes) => {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
};

export const buildSlots = () =>
  Array.from(
    { length: (WORKDAY_END_MINUTES - WORKDAY_START_MINUTES) / SLOT_DURATION_MINUTES },
    (_value, index) => formatSlotTime(WORKDAY_START_MINUTES + index * SLOT_DURATION_MINUTES)
  );

export const isAllowedSlot = (slot) => buildSlots().includes(slot);

export const assertBookableDate = (date) => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const error = new Error("Please provide a valid date in YYYY-MM-DD format.");
    error.statusCode = 400;
    throw error;
  }

  const selected = new Date(`${date}T00:00:00`);

  if (Number.isNaN(selected.getTime())) {
    const error = new Error("Please provide a valid date.");
    error.statusCode = 400;
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selected < today) {
    const error = new Error("Please choose today or a future date.");
    error.statusCode = 400;
    throw error;
  }

  const day = selected.getDay();

  if (day === 0 || day === 6) {
    const error = new Error("Please select a weekday (Mon-Fri).");
    error.statusCode = 400;
    throw error;
  }
};
