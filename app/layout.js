import './globals.css';
import './landing.css';
import Shell from './Shell';

export const metadata = {
  title: 'Partner Outreach',
  robots: { index: false, follow: false }, // keep this tool and its pages out of Google
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}