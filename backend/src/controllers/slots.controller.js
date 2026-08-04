import { readAppointments } from "../services/appointmentStore.js";
import { assertBookableDate, buildSlots } from "../utils/slots.js";

export const getSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    assertBookableDate(date);

    const appointments = await readAppointments();
    const bookedTimes = new Set(
      appointments
        .filter((appointment) => appointment.date === date)
        .map((appointment) => appointment.time)
    );

    const slots = buildSlots().map((time) => ({
      time,
      booked: bookedTimes.has(time),
    }));

    res.json({ date, slots });
  } catch (err) {
    next(err);
  }
};
