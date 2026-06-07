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
      <Odyssey imageRight />
      <hr />
      <Vault />
      <hr />
      <WorkoutTracker imageRight />
      <hr />
      <PitchingTheory />
      <hr />
      <InvoiceGenerator imageRight />
      <hr />
      <ContractGenerator />
      <hr />
      <MaxManicure imageRight />
      <hr />
      <NightingaleNails />
      <hr />
      <Nadia imageRight />
      <hr />
      <HobsonElectric />
      <hr />
      <Lumina imageRight />
      <hr />
      <KnechtInsurance />
      <hr />
      <LoaderGallery imageRight />
      <hr />
      <BlindsTracker />
      {/* <PortfolioPage />
      <hr /> */}
    </div>
  );
};

export default Portfolio;
