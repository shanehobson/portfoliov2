---
title: "You Don’t Need a Framework for Everything"
date: "2026-05-08"
slug: "you-dont-need-a-framework-for-everything"
tags: ["software-engineering", "software-development"]
mediumUrl: "https://medium.com/@shanehobson1/you-dont-need-a-framework-for-everything-ec085f5cc7ea"
excerpt: "I’ve been building Zaera, a multi-tenant SaaS platform for service-based businesses like salons, massage therapists, personal trainers, and studios. The platform handles scheduling, payments, and…"
---
I’ve been building **Zaera**, a multi-tenant SaaS platform for service-based businesses like salons, massage therapists, personal trainers, and studios. The platform handles scheduling, payments, and customer management: staff can set their availability, customers can book appointments online, and businesses can collect payments directly into their own bank accounts.

There are three main pieces:

**Admin app**: where business owners manage staff, services, schedules, and payments.

**Booking app**: the customer-facing interface for scheduling appointments; it works standalone or can be embedded as a widget in a business’s existing website.

**Public site**: for businesses that don’t have their own website, we auto-generate a landing page with their services, staff, hours, and the booking widget i-framed in.

![The booking widget embedded in an auto-generated public site for "Demo Business": a seven-step progress bar — service, professional, date and time, your info, policy, payment, confirm — with step one open, showing category filters for hair, massage and nails above a list of services with their durations and prices.](../images/you-dont-need-a-framework-for-everything/1.webp)
_The Booking App I-Framed Into the Public Site_

The admin and booking apps are built with React and NodeJS. Fairly standard.

At the outset, I could tell that the public site would be the oddball in the group. It would be entirely static — no JavaScript, except for the booking app that I would inject in an i-frame. Each business’s public site would need to contain content unique to that business, sourced from the data entered by the business in the admin app. And importantly, the public site would need to be regenerated each time the business changed that data.

My first instinct when starting to plan out the public facing site was to reach for a framework. I’d used Next.js in past projects, which has good support for static pages and server rendering. But, Next.js felt like a very heavy-handed approach for my purposes here. Plus, I didn’t want to mess around with deploying this app on Vercel; I already had solid infrastructure in place for the rest of the platform using the AWS CDK.

I’d also read about other frameworks like Qwik and Astro that were supposedly great for static site generation. After some research, I initially decided to build with Astro.

**Why Astro Seemed Right**

On the surface, Astro seemed like the right fit. It’s designed around the idea that most web pages are primarily static content, and any JavaScript should be opt-in rather than the default. For pages that do need interactivity, Astro’s islands architecture lets you hydrate only the components that require it, keeping the rest of the page as pure HTML. This aligned well with what I was building: static marketing pages with one interactive element (the booking widget) that could live in its own island. But after more research into how it would fit my specific requirements, I decided against it.

**Where Astro Didn’t Fit**

The first problem was rebuilds. This is a multi-tenant system where each tenant updates independently. When “Acme Nails” adds a new service, I need to regenerate their site, not all N tenants. Astro’s static site generation rebuilds everything by default. You define your dynamic routes in getStaticPaths(), and at build time, Astro generates pages for all of them. To do per-tenant incremental builds, I’d need to filter getStaticPaths() to only include the tenant being updated, trigger builds programmatically when data changes, merge the output with existing files (Astro overwrites the whole dist/ directory), queue builds if multiple tenants update at the same time, and handle deployment and cache invalidation. I could build that, but I’d be building a lot of custom orchestration infrastructure around Astro.

The second problem was value mismatch. Astro’s strengths are component reuse, partial hydration, build optimizations, and content collections. I had no components to reuse (four simple pages, no shared patterns worth abstracting), no hydration needed (zero client-side interactivity), and no complex build to optimize (just HTML and CSS). Astro solved problems I didn’t have. I was using a static site _framework_ when I just needed static site _output._

**What I Built Instead**

I wrote a Lambda function that receives a tenant ID, fetches that tenant’s data from the API, generates four HTML pages using template strings, uploads them to S3, and invalidates the CloudFront cache for that tenant’s paths.

The HTML is served directly from CloudFront’s edge locations, and because there’s no server rendering and no JavaScript bundles to parse, the pages are lightning-fast. Largest Contentful Paint clocks in around 200ms.

The Lambda is triggered directly by the API whenever relevant data changes.

Here’s what “no framework” actually looks like:

```jsx

// Omitting helper functions and AWS SDK boilerplate

function renderHomePage(tenant: TenantInfo): string {
  return `
    <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${tenant.businessName}</title>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <header>
            <h1>${tenant.businessName}</h1>
            <nav>
              <a href="/index.html">Home</a>
              <a href="/services.html">Services</a>
              <a href="/staff.html">Staff</a>
              <a href="/book.html">Book</a>
            </nav>
          </header>
          <main>
            <section class="hours">
              <h2>Hours</h2>
              ${renderHours(tenant.businessHours)}
            </section>
          </main>
          <footer>
            <a href="/book.html" class="cta">Book an Appointment</a>
          </footer>
        </body>
      </html>
  `;
}

// Omitting similar HTML rendering functions for the other pages

 const tenant = await fetchFromApi<TenantInfo>(tenantId, '/public/tenant');
 const pages = {
    'index.html': renderHomePage(tenant),
    'services.html': renderServicesPage(tenant),
    'staff.html': renderStaffPage(tenant),
    'book.html': renderBookingPage(tenant),
 };

 await uploadToS3(tenant, pages);
 await invalidateCache(tenant);
```

That’s the entire “templating engine.” Just strings concatenated into HTML.

**How It’s Triggered**

The Lambda doesn’t run on a schedule. It’s invoked by the API when data changes. Each service in the API calls a shared rebuild trigger after mutations:

```typescript
async function createStaffMember(tenantId: string, dto: CreateStaffDto) {
  const staffMember = await prisma.service.create({ ...dto });

  siteGenerator.triggerRegeneration(tenantId).catch((err) => {
    logger.error("Failed to trigger site regeneration", err);
  });

  return staffMember;
}
```

The site generator service invokes the Lambda asynchronously using InvocationType.Event, which returns immediately without waiting for the Lambda to complete. Services, staff, categories, and tenant profile updates (business name, tagline, logo, colors, hours, contact info) all trigger regeneration. The Lambda only runs when something actually changes.

**The Tradeoffs**

**What I gained:**

\- Per-tenant granularity built-in: one Lambda invocation regenerates one tenant, no custom tooling to filter builds or merge outputs

\- A direct trigger path: API mutation to Lambda to S3, no webhook to CI/CD, no build queue

\- No runtime server: HTML files on a CDN, nothing to scale or monitor

\- Lightning-fast page loads: 200ms LCP from pure static HTML

\- Full visibility: when something breaks, I’m debugging my code, not framework internals

\- Minimal dependencies: the Lambda needs the AWS SDK and nothing else

\- Low cost: less than $5 a month total; running Astro in SSR mode or standing up a separate build server would have meant another EC2 instance or container

**What I gave up:**

\- Component abstraction: if I had twenty page types with shared layouts, Astro’s component model would help, but I have four pages with minimal overlap

\- Framework tooling: Astro’s dev server and hot reload are nice, but my “build” is a single function that runs in under a second

\- The ecosystem: no access to Astro integrations or plugins, but I don’t need any

\- Maintenance transfer: I own more code now, and when something breaks it’s my code, but for code this simple, I’ll take the ownership

**When This Makes Sense**

This isn’t a universal pattern. It worked here because of specific constraints: content is static with no personalization or real-time updates on page load, updates are infrequent, pages are uncomplicated (four pages, mostly text and images, where template strings are sufficient), and per-entity granularity matters (each tenant updates independently, so “rebuild the whole site” doesn’t fit).

If any of these changed, the calculus would shift. Frameworks solve real problems. Use Astro, Next.js, or similar when you have complex component hierarchies that benefit from abstraction, when you need partial hydration or islands architecture, when you’re building an interactive application rather than a static document, or when framework tooling will save significant development time. Frameworks are tools, and tools should match problems.

**The Takeaway**

When I started, I assumed that building web pages meant using a web framework. But my requirements were basic: turn data into HTML and put it on a CDN. That’s it. The framework would have added abstractions I’d then need to work around. Once I saw how simple the actual problem was, the answer became obvious.

With the approach I settled on, there’s nothing between the tenant data and the HTML files sitting on S3. Data in, HTML out.
