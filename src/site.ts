export const SITE = {
  name: "Zacess",
  url: "https://zacess.com",
  email: "contact@zacess.com",
  // security reports only, so they never sit in the general inbox
  securityEmail: "security@zacess.com",
  github: "https://github.com/zacesshq",
  repo: "https://github.com/zacesshq/zacess",
  app: "https://app.zacess.com",
  discussions: "https://github.com/orgs/zacesshq/discussions",
};

export const MAIN_NAV: { href: string; label: string; external?: boolean }[] = [
  { href: "/features/", label: "Features" },
  { href: "/how-it-works/", label: "How it works" },
  { href: "/docs/", label: "Docs" },
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
      { href: "/profile/", label: "Accessibility profile" },
      { href: "/themes/", label: "Code themes" },
      { href: "/scenes/", label: "Terminal scenes" },
      { href: "/games/", label: "Terminal games" },
      { href: "/features/", label: "Features" },
      { href: "/how-it-works/", label: "How it works" },
      { href: "/roadmap/", label: "Roadmap" },
      { href: "/faq/", label: "FAQ" },
    ],
  },
  {
    title: "Docs",
    links: [
      { href: "/docs/", label: "Documentation" },
      { href: "/docs/install/reader/", label: "Install" },
      { href: "/docs/reader/", label: "Reader" },
      { href: "/docs/profile/", label: "Profile" },
      { href: "/docs/scenes/", label: "Scenes" },
      { href: "/docs/games/", label: "Games" },
      { href: "/docs/themes/", label: "Themes" },
      { href: "/docs/contribute/contributing/", label: "Contribute" },
      { href: "/docs/reference/scenes-cli/", label: "Reference" },
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
