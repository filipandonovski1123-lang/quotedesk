import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Landing } from './Landing';
import { Privacy, Terms } from './Legal';

// The demo works without the network; the real app loads Firebase only when it's needed.
const DemoShell = lazy(() => import('./App'));
const TradieApp = lazy(() => import('./real/TradieApp'));
const EnquiryPage = lazy(() => import('./real/EnquiryPage'));
const QuotePage = lazy(() => import('./real/QuotePage'));

function useHash() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => (setHash(location.hash), window.scrollTo(0, 0));
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return hash.replace(/^#\/?/, '');
}

export function Router() {
  const path = useHash();
  const [first, second] = path.split('/');
  let page;
  if (first === 'demo' || first === 'business') page = <DemoShell page={first} />;
  else if (first === 'app') page = <TradieApp />;
  else if (first === 'q' && second) page = <EnquiryPage slug={decodeURIComponent(second)} />;
  else if (first === 'quote' && second) page = <QuotePage token={second} />;
  else if (first === 'privacy') page = <Privacy />;
  else if (first === 'terms') page = <Terms />;
  else page = <Landing />;
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center text-ink-3">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      {page}
    </Suspense>
  );
}
