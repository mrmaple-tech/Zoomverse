import { useEffect, useRef, useState } from 'react';

const UPDATED = 'November 17, 2026';

const PAGES = {
  privacy: {
    title: 'Privacy Policy',
    body: (
      <>
        <p>Zoomverse has no accounts, no ads and no analytics. We don't collect, sell or share personal information.</p>
        <h3>What stays on your device</h3>
        <p>If you set a home location, it's saved in your browser's local storage so passes and the sky view work next time. It never leaves your device; clear your site data to remove it.</p>
        <h3>Third-party requests</h3>
        <p>To show live satellite positions your browser may request public orbit data from CelesTrak (celestrak.org) and Where the ISS at? (wheretheiss.at). Like any web request, those services and our host (GitHub Pages) can see your IP address and browser type. Their own privacy policies apply.</p>
        <h3>Children</h3>
        <p>Zoomverse is safe for all ages because it collects nothing from anyone.</p>
        <h3>Contact</h3>
        <p>Questions about privacy? Email <a href="mailto:support@marketrush.org">support@marketrush.org</a>.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms of Service',
    body: (
      <>
        <p>By using Zoomverse you agree to these terms.</p>
        <h3>Use</h3>
        <p>Zoomverse is free for personal and educational use. Don't try to disrupt the site or misuse its data sources.</p>
        <h3>Accuracy</h3>
        <p>Distances, sizes, orbits and pass times are approximations for learning and exploring. Don't rely on them for navigation, safety or scientific work.</p>
        <h3>No warranty</h3>
        <p>The site is provided “as is”, without warranties of any kind. To the extent the law allows, we aren't liable for any damages from using it.</p>
        <h3>Governing law</h3>
        <p>These terms are governed by the laws of the State of Texas, USA.</p>
        <h3>Contact</h3>
        <p>Email <a href="mailto:support@marketrush.org">support@marketrush.org</a>.</p>
        <h3>Changes</h3>
        <p>We may update these terms; the date below shows the latest version.</p>
      </>
    ),
  },
  cookies: {
    title: 'Cookie Policy',
    body: (
      <>
        <p>Zoomverse does not use cookies, tracking pixels or advertising identifiers.</p>
        <h3>Local storage</h3>
        <p>One entry, <code>zoomverse-home</code>, stores the home location you choose. It's strictly functional, never sent to us, and only exists if you set a location.</p>
        <p>Because nothing optional is stored, there's no cookie banner to accept.</p>
      </>
    ),
  },
} as const;

type Page = keyof typeof PAGES;
let openLegal: (p: Page) => void = () => {};
export const showLegal = (p: Page = 'privacy') => openLegal(p);

export function Legal() {
  const ref = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState<Page>('privacy');
  useEffect(() => {
    openLegal = (p) => { setPage(p); ref.current?.showModal(); };
  }, []);
  return (
    <>
      <button className="legal-btn" onClick={() => showLegal()}>Privacy &amp; Terms</button>
      <dialog ref={ref} className="legal glass" aria-label="Legal" onClick={(e) => e.target === ref.current && ref.current.close()}>
        <div className="legal-head">
          <div className="seg" role="tablist">
            {(Object.keys(PAGES) as Page[]).map((k) => (
              <button key={k} role="tab" aria-selected={page === k} aria-pressed={page === k} onClick={() => setPage(k)}>
                {PAGES[k].title.split(' ')[0]}
              </button>
            ))}
          </div>
          <button className="icon" aria-label="Close" onClick={() => ref.current?.close()}>✕</button>
        </div>
        <article key={page} role="tabpanel">
          <h2>{PAGES[page].title}</h2>
          {PAGES[page].body}
          <p className="legal-date">Last updated {UPDATED}</p>
        </article>
      </dialog>
    </>
  );
}
