import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head lang="en">Next13 Swagger Doc Example</head>
      <body>{children}</body>
    </html>
  );
}
