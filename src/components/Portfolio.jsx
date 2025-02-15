
import WorkoutTracker from "./portfolio-items/WorkoutTracker";
import PitchingTheory from "./portfolio-items/PitchingTheory";
import ContractGenerator from "./portfolio-items/ContractGenerator";
import LoaderGallery from "./portfolio-items/LoaderGallery";
import HobsonElectric from "./portfolio-items/HobsonElectric";
import KnechtInsurance from "./portfolio-items/KnechtInsurance";
import BlindsTracker from "./portfolio-items/BlindsTracker";
import Nadia from "./portfolio-items/Nadia";
import InvoiceGenerator from "./portfolio-items/InvoiceGenerator";
import Vault from "./portfolio-items/Vault";

const Portfolio = () => {
  return (
    <div className="portfolio-contentContainer">
      <div>
        <h1 className="section-title">Portfolio</h1>
        <p className="section-subtitle">
          Below are some of the projects I've built for fun, for friends, for hire, or as business ideas:
        </p>
      </div>
      <Vault />
      <hr />
      <InvoiceGenerator />
      <hr />
      <ContractGenerator />
      <hr />
      <WorkoutTracker />
      <hr />
      <PitchingTheory />
      <hr />
      <LoaderGallery />
      <hr />
      <Nadia />
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
