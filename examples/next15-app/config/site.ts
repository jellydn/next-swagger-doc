export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'Next13 Swagger Demo App',
  description:
    'Demo App for Next13 Swagger UI, Next13 Swagger UI is a Next.js component that renders Swagger UI in your Next.js app.',
  mainNav: [
    {
      title: 'Home',
      href: '/',
    },
    {
      title: 'Doc',
      href: '/api-doc',
    },
  ],
  links: {
    twitter: 'https://twitter.com/jellydn',
    github: 'https://github.com/jellydn/next-swagger-doc',
    docs: 'https://next-swagger-doc.productsway.com',
  },
};
