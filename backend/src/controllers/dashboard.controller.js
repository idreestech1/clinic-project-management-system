import { Appointment } from "../models/Appointment.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { Doctor } from "../models/Doctor.js";
import { Review } from "../models/Review.js";
import { Service } from "../models/Service.js";
import { User } from "../models/User.js";

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseDateKey = (dateKey) => new Date(`${dateKey}T00:00:00`);

const toActivityDateKey = (value) => {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return toDateKey(date);
};

const getRangeDays = (value) => {
  const requestedRange = Number(value);

  if ([7, 14, 30].includes(requestedRange)) {
    return requestedRange;
  }

  return 7;
};

const buildActivityReport = (appointments, rangeDays) => {
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(end.getDate() - (rangeDays - 1));

  const countsByDate = new Map();

  appointments.forEach((appointment) => {
    const createdDateKey = toActivityDateKey(appointment.createdAt);

    if (!createdDateKey) {
      return;
    }

    countsByDate.set(createdDateKey, (countsByDate.get(createdDateKey) || 0) + 1);
  });

  const chartData = Array.from({ length: rangeDays }, (_item, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const dateKey = toDateKey(current);

    return {
      date: dateKey,
      day: rangeDays <= 14 ? dayNames[current.getDay()] : `${monthNames[current.getMonth()]} ${current.getDate()}`,
      patients: countsByDate.get(dateKey) || 0,
    };
  });

  return {
    rangeDays,
    label: `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`,
    chartData,
  };
};

const summarizeByStatus = (items) =>
  items.reduce((acc, item) => {
    const status = item.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

const toPercent = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

export const getDashboard = async (req, res, next) => {
  try {
    const rangeDays = getRangeDays(req.query.range);
    const [
      registeredPatients,
      totalAppointments,
      pendingReviews,
      services,
      allAppointments,
      allReviews,
      doctors,
      patientStatuses,
      contactStats,
      latestContactMessages,
    ] = await Promise.all([
      User.countDocuments({ role: "patient" }),
      Appointment.countDocuments(),
      Review.countDocuments({ status: "Pending" }),
      Service.countDocuments({ status: "Live" }),
      Appointment.find().sort({ createdAt: -1 }).lean(),
      Review.find().lean(),
      Doctor.find().sort({ createdAt: -1 }).lean(),
      User.find({ role: "patient" }).select("status").lean(),
      ContactMessage.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      ContactMessage.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const today = todayKey();
    const uniqueAppointmentPatients = new Set(
      allAppointments
        .map((appointment) => appointment.email || appointment.phone || appointment.name)
        .filter(Boolean)
    ).size;
    const totalPatients = Math.max(registeredPatients, uniqueAppointmentPatients);
    const todaysAppointments = allAppointments.filter((appointment) => appointment.date === today).length;
    const completedAppointments = allAppointments.filter((a) => a.status === "completed").length;
    const confirmedAppointments = allAppointments.filter((a) => a.status === "confirmed").length;
    const cancelledAppointments = allAppointments.filter((a) => a.status === "cancelled").length;
    const patientStatusCounts = summarizeByStatus(patientStatuses);
    const contactStatusCounts = contactStats.reduce((acc, item) => {
      acc[item._id || "Unknown"] = item.count;
      return acc;
    }, {});
    
    // Calculate average rating from all reviews
    const avgRating = allReviews.length
      ? (allReviews.reduce((sum, review) => sum + Number(review.stars || 0), 0) / allReviews.length).toFixed(1)
      : "0.0";

    // Calculate clinic efficiency metrics
    const checkInSpeed = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;
    const patientSatisfaction = allReviews.length > 0 
      ? Math.round((allReviews.reduce((sum, r) => sum + (Number(r.stars) >= 4 ? 1 : 0), 0) / allReviews.length) * 100)
      : 0;

    const activityReport = buildActivityReport(allAppointments, rangeDays);

    const recentAppointments = allAppointments
      .sort((a, b) => new Date(b.createdAt || parseDateKey(b.date)) - new Date(a.createdAt || parseDateKey(a.date)))
      .slice(0, 12);

    res.json({
      stats: {
        totalPatients,
        totalAppointments,
        todaysAppointments,
        pendingReviews,
        services,
        averageRating: avgRating,
        newContactMessages: contactStatusCounts.New || 0,
        totalContactMessages: Object.values(contactStatusCounts).reduce((sum, count) => sum + count, 0),
      },
      recentAppointments,
      latestContactMessages: latestContactMessages.map((message) => ({
        id: message._id?.toString(),
        name: message.name,
        subject: message.subject,
        status: message.status,
        createdAt: message.createdAt,
      })),
      doctors,
      chartData: activityReport.chartData,
      activityReport: {
        rangeDays: activityReport.rangeDays,
        label: activityReport.label,
      },
      efficiency: {
        checkInSpeed,
        patientSatisfaction,
      },
      demographics: {
        patientStatus: [
          { label: "Active", value: patientStatusCounts.Active || 0, color: "#1a6fd4" },
          { label: "Pending", value: patientStatusCounts.Pending || 0, color: "#f59e0b" },
          { label: "Inactive", value: patientStatusCounts.Inactive || 0, color: "#94a3b8" },
        ],
        appointmentStatus: [
          { label: "Confirmed", value: confirmedAppointments, percent: toPercent(confirmedAppointments, totalAppointments), color: "#1a6fd4" },
          { label: "Completed", value: completedAppointments, percent: toPercent(completedAppointments, totalAppointments), color: "#22c55e" },
          { label: "Cancelled", value: cancelledAppointments, percent: toPercent(cancelledAppointments, totalAppointments), color: "#ef4444" },
        ],
      },
      reviewStats: {
        total: allReviews.length,
        approved: allReviews.filter((r) => r.status === "Approved").length,
        pending: pendingReviews,
        hidden: allReviews.filter((r) => r.status === "Hidden").length,
      },
    });
  } catch (err) {
    next(err);
  }
};
