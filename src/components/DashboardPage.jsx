import { useCallback, useState } from "react";
import About from "./About";
import Contact from "./Contact";
import ContactModal from "./ContactModal";
import Footer from "./Footer";
import Hero from "./Hero";
import NavBar from "./NavBar";
import Work from "./Work";
import Writing from "./Writing";

const DashboardPage = () => {
  // The element that opened the contact dialog, or null while it is closed.
  const [contactOpener, setContactOpener] = useState(null);

  // The CTAs keep their `mailto:` href as the no-JS fallback.
  const openContact = (event) => {
    event.preventDefault();
    setContactOpener(event.currentTarget);
  };
  const closeContact = useCallback(() => setContactOpener(null), []);

  return (
    <>
      <NavBar />
      <main>
        <Hero onContact={openContact} />
        <About />
        <Writing />
        <Work />
        <Contact onContact={openContact} />
      </main>
      <Footer />
      <ContactModal opener={contactOpener} onClose={closeContact} />
    </>
  );
};

export default DashboardPage;
