import projects from "../data/projects";
import ProjectRow from "./ProjectRow";

const Work = () => (
  <section className="section work" id="work" aria-labelledby="work-title">
    <div className="shell">
      <header className="work-head">
        <div>
          <p className="eyebrow">03 / Selected work</p>
          <h2 className="section-title" id="work-title">
            Work
          </h2>
        </div>
      </header>

      <div className="work-list">
        {projects.map((project, index) => (
          <ProjectRow
            key={project.id}
            project={project}
            index={index}
            imageRight={index % 2 === 1}
          />
        ))}
      </div>
    </div>
  </section>
);

export default Work;
