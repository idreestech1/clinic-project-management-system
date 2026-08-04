import Reviews from "./reviews/Reviews";
import Services from "./services/Services";
import About from "./about/About";
import Home from "./home/Home";
import Contact from "./contact/Contact";
import Appointment from "./appointment/Appointment";
import Register from "./auth/Register";
import SignIn from "./auth/SignIn";
import Admin from "./admin/Admin";

function Pages({
  activeSection,
  isSignedIn,
  isAdminSignedIn,
  isRegistered,
  onRegister,
  onOpenSignIn,
  onOpenRegister,
  onSignIn,
  currentUser,
  onLogout,
  onBookAppointmentFromHome,
  onContactFromHome,
  onVirtualTourFromHome,
  onOpenServices,
}) {
  if (activeSection === "Services") {
    return <Services />;
  }

  if (activeSection === "Reviews") {
    return <Reviews onBookAppointment={onBookAppointmentFromHome} onViewServices={onOpenServices} />;
  }

  if (activeSection === "About") {
    return <About />;
  }

  if (activeSection === "Home") {
    return (
      <Home
        onBookAppointment={onBookAppointmentFromHome}
        onContact={onContactFromHome}
        onVirtualTour={onVirtualTourFromHome}
      />
    );
  }

  if (activeSection === "Contact") {
    return <Contact />;
  }

  if (activeSection === "Appointment") {
    return isSignedIn ? (
      <Appointment currentUser={currentUser} />
    ) : (
      <Home
        onBookAppointment={onBookAppointmentFromHome}
        onContact={onContactFromHome}
        onVirtualTour={onVirtualTourFromHome}
      />
    );
  }

  if (activeSection === "Dashboard") {
    return isAdminSignedIn ? (
      <Admin onAdminLogout={onLogout} />
    ) : (
      <Home
        onBookAppointment={onBookAppointmentFromHome}
        onContact={onContactFromHome}
        onVirtualTour={onVirtualTourFromHome}
      />
    );
  }

  if (activeSection === "Register") {
    return <Register isRegistered={isRegistered} onRegister={onRegister} onOpenSignIn={onOpenSignIn} />;
  }

  if (activeSection === "SignIn") {
    return <SignIn isRegistered={isRegistered} onOpenRegister={onOpenRegister} onSignIn={onSignIn} />;
  }

  return (
    <Home
      onBookAppointment={onBookAppointmentFromHome}
      onContact={onContactFromHome}
      onVirtualTour={onVirtualTourFromHome}
    />
  );
}

export default Pages;
