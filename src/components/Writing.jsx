import Book from "./Book";
import Medium from "./Medium";

const Writing = () => {
  return (
    <div className="writing-contentContainer">
      <div>
        <h1 className="section-title">Writing</h1>
        <p className="section-subtitle"></p>
      </div>
      <Book />
      <Medium />
      <hr />
    </div>
  );
};

export default Writing;
