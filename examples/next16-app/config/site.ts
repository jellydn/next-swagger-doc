export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'Next16 Swagger Demo App',
  description:
    'Demo App for Next.js 16 Swagger UI. next-swagger-doc renders OpenAPI docs in your Next.js app.',
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
