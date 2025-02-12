
import Book from "./Book";

const Writing = () => {
  return (
    <div className="writing-contentContainer">
      <div>
        <h1 className="section-title">My Writing</h1>
        <p className="section-subtitle">
          Below are some of my software-related writing projects:
        </p>
      </div>
      <Book />
      <hr />
    </div>
  );
};

export default Writing;
