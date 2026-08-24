import BlindsTracker from "./portfolio-items/BlindsTracker";
import ContractGenerator from "./portfolio-items/ContractGenerator";
import HobsonElectric from "./portfolio-items/HobsonElectric";
import InvoiceGenerator from "./portfolio-items/InvoiceGenerator";
import KnechtInsurance from "./portfolio-items/KnechtInsurance";
import LoaderGallery from "./portfolio-items/LoaderGallery";
import Lumina from "./portfolio-items/Lumina";
import MaxManicure from "./portfolio-items/MaxManicure";
import Nadia from "./portfolio-items/Nadia";
import NightingaleNails from "./portfolio-items/NightingaleNails";
import Odyssey from "./portfolio-items/Odyssey";
import PitchingTheory from "./portfolio-items/PitchingTheory";
import Stella from "./portfolio-items/Stella";
import Vault from "./portfolio-items/Vault";
import WorkoutTracker from "./portfolio-items/WorkoutTracker";
import Zaera from "./portfolio-items/Zaera";

const Portfolio = () => {
  return (
    <div className="portfolio-contentContainer">
      <div>
        <h1 className="section-title">Portfolio</h1>
        {/* <p className="section-subtitle">
          Below are some of the projects I've built for fun, for friends, for
          hire, or as business ideas:
        </p> */}
      </div>
      <Zaera />
      <hr />
      <Stella imageRight />
      <hr />
      <Odyssey />
      <hr />
      <Vault imageRight />
      <hr />
      <WorkoutTracker />
      <hr />
      <PitchingTheory imageRight />
      <hr />
      <InvoiceGenerator />
      <hr />
      <ContractGenerator imageRight />
      <hr />
      <MaxManicure />
      <hr />
      <NightingaleNails imageRight />
      <hr />
      <Nadia />
      <hr />
      <HobsonElectric imageRight />
      <hr />
      <Lumina />
      <hr />
      <KnechtInsurance imageRight />
      <hr />
      <LoaderGallery />
      <hr />
      <BlindsTracker imageRight />
      {/* <PortfolioPage />
      <hr /> */}
    </div>
  );
};

export default Portfolio;
