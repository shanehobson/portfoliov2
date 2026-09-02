import About from "./About";
import Contact from "./Contact";
import Footer from "./Footer";
import Hero from "./Hero";
import NavBar from "./NavBar";
import Work from "./Work";
import Writing from "./Writing";

const DashboardPage = () => (
  <>
    <NavBar />
    <main>
      <Hero />
      <About />
      <Writing />
      <Work />
      <Contact />
    </main>
    <Footer />
  </>
);

export default DashboardPage;
