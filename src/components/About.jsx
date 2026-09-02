// Ordered the way the resume groups them — languages, front end, back end,
// data, cloud, testing — so the list reads as a stack rather than a keyword
// dump. Deliberately the core set, not everything: the long tail (Radix,
// Tanstack Query, SQS, API Gateway, Cognito) lives on the resume.
const CORE_TECH = [
  "TypeScript",
  "JavaScript",
  "React",
  "Angular",
  "Next.js",
  "Redux",
  "Tailwind CSS",
  "SCSS",
  "Node.js",
  "Nest.js",
  "Express",
  "GraphQL",
  "PostgreSQL",
  "DynamoDB",
  "Amazon Web Services",
  "AWS Lambda",
  "AWS CDK",
  "Jest",
  "Playwright",
];

const CERTIFICATES = [
  "AWS Certified Solutions Architect",
  "AWS Certified Cloud Practitioner",
];

const About = () => (
  <section className="section about" id="about">
    <div className="shell about-inner">
      <div className="about-aside">
        <p className="eyebrow">01 / About</p>
        {/*
          Two stacked lines beside the prose; one line on a phone, where the
          heading sits on top of it instead and the break is hidden.
        */}
        <h2 className="section-title">
          About{" "}
          <br className="about-title-break" />
          Me
        </h2>
        <figure className="about-portrait">
          <img
            src="/images/shane.webp"
            width="600"
            height="645"
            loading="lazy"
            decoding="async"
            alt="Shane Hobson"
          />
        </figure>
      </div>

      <div className="about-body">
        <p>
          I&rsquo;m a software engineer with a decade of experience building
          applications for the web. My work spans frontend engineering, backend
          engineering, and cloud infrastructure.
        </p>
        <p>
          I currently consult for a Fortune 100 media company, where I&rsquo;m
          helping build an advertising platform responsible for managing more
          than a billion dollars in annual ad revenue. My work focuses on
          building complex, data-intensive applications and making them fast,
          scalable, and intuitive.
        </p>
        <p>
          Outside of work, I build software, experiment with new technologies,
          and write about software engineering and AI. I&rsquo;m particularly
          interested in understanding how the technologies I use actually work
          &mdash; from web browsers and distributed systems to large language
          models &mdash; and explaining those ideas in approachable terms.
        </p>
        <p>
          I took an unconventional path into software engineering. Before
          writing software professionally, I went to law school and spent three
          years as a litigation and trial attorney. I remain a licensed
          attorney, and I&rsquo;m especially interested in the intersection of
          law and technology and in how software and AI can be used to solve
          problems in the legal industry. I regularly contribute to open source
          legal technology and legal AI projects.
        </p>

        <dl className="about-facts">
          <div className="about-fact">
            <dt>Core technologies</dt>
            <dd>
              <ul className="tags">
                {CORE_TECH.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="about-fact">
            <dt>Certificates</dt>
            <dd>
              <ul className="about-list">
                {CERTIFICATES.map((cert) => (
                  <li key={cert}>{cert}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
);

export default About;
