import BlindsTracker from "./portfolio-items/BlindsTracker";
import ContractGenerator from "./portfolio-items/ContractGenerator";
import HobsonElectric from "./portfolio-items/HobsonElectric";
import InvoiceGenerator from "./portfolio-items/InvoiceGenerator";
import KnechtInsurance from "./portfolio-items/KnechtInsurance";
import LoaderGallery from "./portfolio-items/LoaderGallery";
import Nadia from "./portfolio-items/Nadia";
import NightingaleNails from "./portfolio-items/NightingaleNails";
import PitchingTheory from "./portfolio-items/PitchingTheory";
import Vault from "./portfolio-items/Vault";
import WorkoutTracker from "./portfolio-items/WorkoutTracker";

const Portfolio = () => {
  return (
    <div className="portfolio-contentContainer">
      <div>
        <h1 className="section-title">Portfolio</h1>
        <p className="section-subtitle">
          Below are some of the projects I've built for fun, for friends, for
          hire, or as business ideas:
        </p>
      </div>
      <Vault />
      <hr />
      <NightingaleNails />
      <hr />
      <Nadia />
      <hr />
      <InvoiceGenerator />
      <hr />
      <ContractGenerator />
      <hr />
      <WorkoutTracker />
      <hr />
      <PitchingTheory />
      <hr />
      <HobsonElectric />
      <hr />
      <KnechtInsurance />
      <hr />
      <LoaderGallery />
      <hr />
      <BlindsTracker />
      {/* <PortfolioPage />
      <hr /> */}
    </div>
  );
};

export default Portfolio;
