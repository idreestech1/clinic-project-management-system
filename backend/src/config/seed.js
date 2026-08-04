import { GalleryItem } from "../models/GalleryItem.js";
import { Doctor } from "../models/Doctor.js";
import { Review } from "../models/Review.js";
import { Service } from "../models/Service.js";

const defaultServices = [
  { name: "General Consultation", category: "Primary Care", duration: "10 min", price: "$60", description: "Diagnosis, treatment guidance, prescriptions, and follow-up planning.", status: "Live", featured: true },
  { name: "Diabetes Follow-up", category: "Chronic Care", duration: "20 min", price: "$85", description: "Ongoing monitoring and care planning for diabetic patients.", status: "Live", featured: true },
  { name: "Cardiac Screening", category: "Diagnostics", duration: "30 min", price: "$140", description: "Preventive screening and early risk review for heart health.", status: "Live", featured: true },
  { name: "Preventive Health Plan", category: "Wellness", duration: "45 min", price: "$180", description: "Personalized preventive care and wellness planning.", status: "Draft", featured: false },
];

const defaultReviews = [
  { name: "Sarah Jenkins", email: "sarah@example.com", category: "Surgery", stars: 5, text: "Dr. Hammad's attention to detail is remarkable. The staff made me feel welcome from the moment I stepped into the clinic.", avatar: "https://i.pravatar.cc/48?img=47", featured: false, status: "Approved" },
  { name: "Michael Richardson", email: "michael@example.com", category: "Consultation", stars: 5, text: "Highly professional and thorough. Dr. Hammad and the team provided me with clear findings before my procedure.", avatar: "https://i.pravatar.cc/48?img=12", featured: true, status: "Approved" },
  { name: "Emily Davenport", email: "emily@example.com", category: "Consultation", stars: 4, text: "The clinic is spotless and equipped with the latest technology. It gave me a lot of confidence in my treatment plan.", avatar: "https://i.pravatar.cc/48?img=32", featured: false, status: "Approved" },
];

const defaultGallery = [
  { title: "Consultation Room", tag: "Clinic Interior", status: "Active", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80" },
  { title: "Reception Desk", tag: "Front Office", status: "Active", image: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=600&q=80" },
  { title: "Diagnostic Suite", tag: "Equipment", status: "Pending", image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80" },
];

const defaultDoctors = [
  {
    name: "Dr. Hammad",
    email: "admin@gmail.com",
    specialty: "Specialist Physician",
    status: "Active",
    avatar: "https://ui-avatars.com/api/?name=Dr.%20Hammad&background=1a6fd4&color=fff",
  },
];

export const seedDatabase = async () => {
  const [serviceCount, reviewCount, galleryCount, doctorCount] = await Promise.all([
    Service.countDocuments(),
    Review.countDocuments(),
    GalleryItem.countDocuments(),
    Doctor.countDocuments(),
  ]);

  if (!serviceCount) await Service.insertMany(defaultServices);
  if (!reviewCount) await Review.insertMany(defaultReviews);
  if (!galleryCount) await GalleryItem.insertMany(defaultGallery);
  if (!doctorCount) await Doctor.insertMany(defaultDoctors);
};
