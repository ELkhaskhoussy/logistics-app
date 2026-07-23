import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * Web-only HTML shell for every page of the static export.
 * - Correct mobile viewport (viewport-fit=cover enables safe-area insets)
 * - Uses dynamic viewport height (100dvh) so iOS Safari's address bar no longer
 *   pushes bottom action bars below the fold
 * - Centers the app in a phone-width column on desktop so it presents like a real app
 */
const shellCss = `
  html, body { margin: 0; padding: 0; height: 100%; }

  body {
    background-color: #E5E7EB;
    overflow: hidden;
  }

  #root {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    height: 100vh;
    height: 100dvh;
    box-sizing: border-box;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background-color: #F9FAFB;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* On desktop, hint the phone-width frame with subtle side borders */
  @media (min-width: 481px) {
    #root {
      border-left: 1px solid rgba(0, 0, 0, 0.06);
      border-right: 1px solid rgba(0, 0, 0, 0.06);
    }
  }

  /* Prevent iOS auto-zoom when focusing inputs (font-size >= 16px) */
  input, textarea, select {
    font-size: 16px;
  }
  input:focus, textarea:focus, select:focus {
    outline: none;
  }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: shellCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
