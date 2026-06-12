import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#7c3aed',
}

export const metadata: Metadata = {
  title: {
    default: 'Minerales de la Tierra — Tu Colección de Minerales',
    template: '%s | Minerales de la Tierra',
  },
  description: 'Gestiona tu colección de minerales con datos completos de Mindat.org, modelos 3D de hábitos cristalinos y galería de fotografías.',
  keywords: ['minerales', 'colección', 'mineralogía', 'cristalografía', 'coleccionismo'],
  authors: [{ name: 'Minerales de la Tierra' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Minerales de la Tierra',
  },
  openGraph: {
    title: 'Minerales de la Tierra',
    description: 'Tu colección de minerales con datos científicos y visualización 3D',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Minerales de la Tierra" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Minerales de la Tierra" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#050508" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
