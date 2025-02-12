
import WorkoutTracker from "./portfolio-items/WorkoutTracker";
import PitchingTheory from "./portfolio-items/PitchingTheory";
import ContractGenerator from "./portfolio-items/ContractGenerator";
import LoaderGallery from "./portfolio-items/LoaderGallery";
import HobsonElectric from "./portfolio-items/HobsonElectric";
import KnechtInsurance from "./portfolio-items/KnechtInsurance";
import BlindsTracker from "./portfolio-items/BlindsTracker";
import PortfolioPage from "./portfolio-items/PortfolioPage";
import InvoiceGenerator from "./portfolio-items/InvoiceGenerator";

const Portfolio = () => {
  return (
    <div className="portfolio-contentContainer">
      <div>
        <h1 className="section-title">Portfolio</h1>
        <p className="section-subtitle">
          Below are some of the projects I've built for fun, for friends, for hire, or as business ideas:
        </p>
      </div>
      <WorkoutTracker />
      <hr />
      <PitchingTheory />
      <hr />
      <InvoiceGenerator />
      <hr />
      <ContractGenerator />
      <hr />
      <LoaderGallery />
      <hr />
      <HobsonElectric />
      <hr />
      <KnechtInsurance />
      <hr />
      <BlindsTracker />
      <hr />
      {/* <PortfolioPage />
      <hr /> */}
    </div>
  );
};

export default Portfolio;
