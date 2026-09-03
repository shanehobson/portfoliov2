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
        <p className="section-lede">
          Built for clients, for friends, and for the fun of it &mdash; from
          multi-tenant SaaS platforms to small tools that do one thing well.
        </p>
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
