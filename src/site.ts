export const SITE = {
  name: "Zacess",
  url: "https://zacess.com",
  email: "contact@zacess.com",
  github: "https://github.com/zacesshq",
  repo: "https://github.com/zacesshq/zacess",
  app: "https://app.zacess.com",
  discussions: "https://github.com/orgs/zacesshq/discussions",
};

export const MAIN_NAV: { href: string; label: string; external?: boolean }[] = [
  { href: "/features/", label: "Features" },
  { href: "/how-it-works/", label: "How it works" },
  { href: "/roadmap/", label: "Roadmap" },
  { href: "/accessibility/", label: "Accessibility" },
  { href: "/open-source/", label: "Open source" },
  { href: "/about/", label: "About" },
  { href: SITE.app, label: "Open the app", external: true },
];

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: SITE.app, label: "Open the app" },
      { href: "/themes/", label: "Code themes" },
      { href: "/features/", label: "Features" },
      { href: "/how-it-works/", label: "How it works" },
      { href: "/roadmap/", label: "Roadmap" },
      { href: "/faq/", label: "FAQ" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/about/", label: "About" },
      { href: "/open-source/", label: "Open source" },
      { href: SITE.discussions, label: "Discussions" },
      { href: SITE.github, label: "GitHub" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/accessibility/", label: "Accessibility" },
      { href: "/privacy/", label: "Privacy" },
      { href: "/security/", label: "Security" },
      { href: "/credits/", label: "Credits" },
      { href: "/contact/", label: "Contact" },
    ],
  },
];
