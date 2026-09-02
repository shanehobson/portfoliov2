/**
 * Every portfolio entry, in the order it appears on the page.
 *
 * These used to be sixteen near-identical components under
 * components/portfolio-items/, each carrying its own copy of the row markup.
 * The redesign renders them all through a single <ProjectRow>, so the markup
 * lives there and only the content lives here. The copy is unchanged.
 *
 *   tags   - the stack, pulled out of the prose it is already described in
 *   media  - { kind: "image" | "video", ... }; videos are preload="none" with
 *            a poster unless `autoplay` marks them as an animated screenshot
 *   links  - rendered as buttons; the first one is the primary action
 */
const projects = [
  {
    id: "zaera",
    title: "Zaera",
    tags: ["React", "NestJS", "PostgreSQL", "Stripe", "AWS"],
    body: [
      "An all-in-one scheduling and payments platform for service businesses. Zaera consolidates booking management, payment processing, and customer communication into a single dashboard, eliminating manual coordination and letting business owners focus on their clients.",
      "The platform features a beautiful branded booking experience for customers, color-coded team scheduling with double-booking prevention, and secure payment collection via Stripe. Built as a multi-tenant SaaS with a React admin dashboard, NestJS API, PostgreSQL database, and AWS infrastructure.",
    ],
    links: [{ label: "View the site", href: "https://zaera.io/" }],
    media: {
      kind: "video",
      src: "/video/zaera.mp4",
      poster: "/images/zaera-poster.webp",
      alt: "A demo of booking an appointment through Zaera",
    },
  },
  {
    id: "stella",
    title: "Stella",
    tags: ["TypeScript", "TanStack Start", "Bun", "PostgreSQL", "Redis"],
    body: [
      "Stella is an open-source legal workspace that pulls matters, documents, review, research, and AI chat into one place. Legal teams work alongside an agent that reads their files, connected registries, and trusted sources, with approvals and source previews so every answer traces back to the underlying text. I'm one of the project's top contributors.",
      "The platform includes tabular review for extracting structured data across document sets, typed clients for national business registries, and an MCP-compatible tool layer. Built in TypeScript on TanStack Start and Bun, with PostgreSQL, Redis, and Docker — fully self-hostable, with no vendor lock-in or per-seat licensing.",
    ],
    links: [{ label: "Explore the project", href: "https://stll.app/" }],
    media: {
      kind: "video",
      src: "/video/Stella_Demo.mp4",
      poster: "/images/stella-poster.webp",
      autoplay: true,
      alt: "The tools and capability catalogue in Stella",
    },
  },
  {
    id: "odyssey",
    title: "Odyssey",
    tags: ["React", "TanStack Query", "AWS Lambda", "DynamoDB", "Streaming AI"],
    body: [
      "Odyssey is an AI-driven travel planning application that turns prompts into structured, day-by-day itineraries in seconds.",
      "Built with streaming AI architecture for live partial responses, usage-aware design with tiered plans and cost-protection guardrails, and a modern React stack using TanStack Query. The serverless backend runs on AWS (Lambda, API Gateway, DynamoDB, S3).",
    ],
    links: [
      { label: "Explore the app", href: "https://www.findmyodyssey.com" },
    ],
    media: {
      kind: "video",
      src: "/video/odyssey.mp4",
      poster: "/images/odyssey-poster.webp",
      alt: "A demo of Odyssey generating a travel itinerary",
    },
  },
  {
    id: "vault",
    title: "Vault",
    tags: ["React", "AWS Cognito", "Lambda", "DynamoDB", "S3"],
    body: [
      "Vault is a web application that allows for quick and easy upload and cloud storage of photos and videos from your phone, tablet, or computer. Vault has a React frontend, and a serverless backend built on AWS Cognito, API Gateway, Lambda, DynamoDB, and S3.",
      "Check out the video to see it in action.",
    ],
    links: [],
    media: {
      kind: "video",
      src: "/video/vault.mp4",
      poster: "/images/vault-poster.webp",
      alt: "A demo of uploading photos to Vault",
    },
  },
  {
    id: "workout-tracker",
    title: "Workout Tracker",
    tags: ["Angular", "D3", "Node.js", "Express", "MongoDB"],
    body: [
      "Workout Tracker allows the user to keep a daily log of their workouts and provides the user with analytics concerning the frequency and intensity of their workouts, along with the relative distribution of exercise types and body part usage. The app uses the D3 data visualization framework to build graphs and charts giving the user real-time and historic information on their workouts and workout patterns. The app features a chart showing the user's activity over the previous 365-day period, which was inspired by the Github annual contributions chart. The front-end of Workout Tracker was built using Angular, and the backend was built using Node.js, Express, and a MongoDB cloud database.",
    ],
    links: [
      {
        label: "Front-end source",
        href: "https://github.com/shanehobson/workout-tracker",
      },
      {
        label: "Backend source",
        href: "https://github.com/shanehobson/workout-tracker-api",
      },
    ],
    media: {
      kind: "video",
      src: "/video/workout-tracker-video.mp4",
      poster: "/images/workout-tracker-poster.webp",
      alt: "A demo of the Workout Tracker analytics charts",
    },
  },
  {
    id: "blog-cms",
    title: "Blog Content Management System",
    tags: ["Angular", "Node.js", "Express", "MongoDB", "AWS"],
    body: [
      "This web application allows content creators to create a multimedia blog post in less than five minutes. Users have the ability to create blog posts containing text, images, and video. The blog posts can be edited or deleted by the author at any time. The app was built using the MEAN stack (MongoDB, Express.js, Angular, and Node.js). The app uses AWS services for file storage and content delivery.",
      "Check out the video to see the system in action and watch me create, edit, and delete a blog post in three minutes.",
    ],
    links: [
      {
        label: "View source",
        href: "https://github.com/shanehobson/pitching-theory-app",
      },
    ],
    media: {
      kind: "video",
      src: "/video/app-demo-1.mp4",
      poster: "/images/pitching-theory-poster.webp",
      alt: "A demo of creating a blog post in the CMS",
    },
  },
  {
    id: "invoice-generator",
    title: "Invoice Generator",
    tags: ["React", "Redux", "Node.js", "Express", "AWS S3"],
    body: [
      "This web applications allows freelance software developers to create highly customized PDF invoices for client projects in just a few minutes. The front-end of the project was built using React and Redux. On the backend, there is a Node.js/Express server that constructs a PDF document and saves the document in the cloud with AWS S3.",
      "Check out the video to see me create an invoice in less than three minutes.",
    ],
    links: [
      {
        label: "Front-end source",
        href: "https://github.com/shanehobson/invoice-generator-fe",
      },
      {
        label: "Backend source",
        href: "https://github.com/shanehobson/invoice-generator",
      },
    ],
    media: {
      kind: "video",
      src: "/video/Invoice_Generator.mp4",
      poster: "/images/invoice-generator-poster.webp",
      alt: "A demo of building a PDF invoice",
    },
  },
  {
    id: "contract-generator",
    title: "Contract Generator",
    tags: ["React", "Redux", "Material-UI"],
    body: [
      "Drawing on my expertise as a licensed attorney and my experience practicing law, I created this web application to help freelance web developers protect themselves in customer/client relationships. The user completes a handful of forms in order to provide the information necessary to generate a contract for web development services, and the app generates a legally binding contract in PDF format. This app was built using React, Redux, and Material-UI.",
    ],
    links: [
      { label: "Explore the app", href: "https://dtame3ylp25go.cloudfront.net" },
      {
        label: "View source",
        href: "https://github.com/shanehobson/contract-generator",
      },
    ],
    media: {
      kind: "image",
      src: "/images/contract-generator.webp",
      width: 1300,
      height: 609,
      href: "https://dtame3ylp25go.cloudfront.net",
      alt: "The Contract Generator web app",
    },
  },
  {
    id: "max-manicure",
    title: "Max Manicure",
    tags: ["Astro", "AWS CDK"],
    body: [
      <>
        A website built for a nail salon, with integrated online scheduling and
        payments powered by{" "}
        <a className="link" href="https://zaera.io/" target="_blank" rel="noreferrer">
          Zaera
        </a>
        . Built with Astro for fast static delivery and deployed on AWS via CDK.
      </>,
    ],
    links: [
      { label: "Explore the site", href: "https://www.maxmanicure.com" },
    ],
    media: {
      kind: "video",
      src: "/video/max-manicure.mp4",
      poster: "/images/max-manicure-poster.webp",
      alt: "A walkthrough of the Max Manicure website",
    },
  },
  {
    id: "nightingale-nails",
    title: "Nightingale Nails",
    tags: ["Next.js", "ISR", "Nodemailer"],
    body: [
      "A website built for a Denver, Colorado nail salon using NextJS. This site contains an email contact form built on top of NextJS Api Routes and Nodemailer. The site uses Incremental Static Regeneration (ISR) to achieve fast page loads while maintaining content freshness.",
    ],
    links: [
      {
        label: "Explore the app",
        href: "https://nails-git-main-shane-hobsons-projects.vercel.app/",
      },
    ],
    media: {
      kind: "video",
      src: "/video/nightingale-nails.mp4",
      poster: "/images/nightingale-nails-poster.webp",
      alt: "A walkthrough of the Nightingale Nails website",
    },
  },
  {
    id: "science-of-dance",
    title: "The Science of Dance",
    tags: ["React", "AWS Lambda", "API Gateway", "SES"],
    body: [
      "A website built for a Naples, Florida dance studio containing a contact form that sends an email to the studio owner. Built using React with AWS Lambda, Api Gateway, and Simple Email Service.",
    ],
    links: [
      {
        label: "Explore the app",
        href: "https://d115owle18y2b1.cloudfront.net/",
      },
      { label: "View source", href: "https://github.com/shanehobson/nadia" },
    ],
    media: {
      kind: "video",
      src: "/video/science-of-dance.mp4",
      poster: "/images/science-of-dance-poster.webp",
      alt: "A walkthrough of The Science of Dance website",
    },
  },
  {
    id: "hobson-electric",
    title: "Hobson Electric, Inc.",
    tags: ["JavaScript", "Bootstrap", "Node.js", "Express"],
    body: [
      'This project is a website for an electrical services company. The website contains information regarding the services provided by the company and information about the people who work for the company. The website has a "Contact Us" feature which allows the user to quickly send a request to the company for a free estimate on electrical services. The "Contact Us" feature relies on a back end that I built using Node.js and Express, which takes in form data and sends an email to the company\'s owner. The front end was built using Bootstrap and vanilla Javascript.',
    ],
    links: [
      { label: "Explore the app", href: "https://d2rovogyqdtmn6.cloudfront.net" },
      {
        label: "Front-end source",
        href: "https://github.com/shanehobson/hobson_electric",
      },
      { label: "Backend source", href: "https://github.com/shanehobson/mailer_api" },
    ],
    media: {
      kind: "video",
      src: "/video/hobson-electric.mp4",
      poster: "/images/hobson-electric-poster.webp",
      alt: "A walkthrough of the Hobson Electric website",
    },
  },
  {
    id: "lumina",
    title: "Lumina Model Academy",
    tags: ["Next.js"],
    body: ["A website built for a Naples, Florida model academy using NextJS."],
    links: [
      { label: "Explore the site", href: "https://www.luminamodelacademy.com" },
    ],
    media: {
      kind: "video",
      src: "/video/lumina.mp4",
      poster: "/images/lumina-poster.webp",
      alt: "A walkthrough of the Lumina Model Academy website",
    },
  },
  {
    id: "knecht-insurance",
    title: "Knecht Insurance",
    tags: ["HTML", "CSS", "JavaScript", "Node.js", "Gmail API"],
    body: [
      "This is a website for an insurance broker built using HTML, CSS, and vanilla JavaScript. The website features a contact form, which allows a prospective customer to contact the business owner to obtain a quote. The contact form is powered by a NodeJS backend that intregrates with Gmail's API.",
    ],
    links: [
      {
        label: "Front-end source",
        href: "https://github.com/miwaro/knecht-insurance",
      },
      { label: "Back-end source", href: "https://github.com/miwaro/emailer-api" },
    ],
    media: {
      kind: "image",
      src: "/images/knecht-insurance.webp",
      width: 1300,
      height: 734,
      alt: "The Knecht Insurance website",
    },
  },
  {
    id: "loader-gallery",
    title: "LoaderGallery.com",
    tags: ["React", "Redux", "Material-UI"],
    body: [
      "This web application allows web developers to quickly and easily add loading animations to their websites and web apps in order to keep users engaged while pages are loading or while the application makes network requests. The user has the ability to select a color from a color picker, or enter a HEX or RGBA value. The application then allows the user to easily copy and paste the necessary HTML and CSS code in order to implement the animation into their application in the user's color of choice. This app was built using React, Redux, and Material-UI.",
    ],
    links: [
      { label: "Explore the app", href: "https://www.loadergallery.com" },
      { label: "View source", href: "https://github.com/shanehobson/loaders" },
    ],
    media: {
      kind: "image",
      src: "/images/loader-gallery.webp",
      width: 1300,
      height: 617,
      href: "https://www.loadergallery.com",
      alt: "The LoaderGallery.com web app",
    },
  },
  {
    id: "poker-blinds-tracker",
    title: "Poker Blinds Tracker",
    tags: ["JavaScript"],
    body: [
      'This web application serves a way to track blinds in a poker game. At the beginning of the game, the user has the ability to set (a) how frequently blinds will increase, (b) the initial value of the small and big blinds, and (c) the value at which blinds will be capped. Once the game starts, the timer functionality lets players know how much time is left until the next blinds increase. When the timer runs out, the timer resets itself and the blinds automatically increase. Additionally, if there are just two players ("heads up" poker), the alternating arrows next to each player\'s name allow the players to alternate who pays the big blind each time blinds increase.',
    ],
    links: [
      { label: "View source", href: "https://github.com/shanehobson/poker-timer" },
    ],
    media: {
      kind: "image",
      src: "/images/blinds-tracker.webp",
      width: 1300,
      height: 603,
      alt: "The Poker Blinds Tracker web app",
    },
  },
];

export default projects;
