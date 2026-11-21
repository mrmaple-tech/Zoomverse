import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store.ts';
import { CATALOG, byId } from '../catalog.ts';
import { LAYERS, layerAt } from '../data/layers.ts';
import { scaleBar } from '../lib/scale.ts';
import { Search as SearchIcon } from './icons.tsx';
import { startTour } from './Caption.tsx';
import { Legal, showLegal } from './Legal.tsx';
import { SATELLITES } from '../data/satellites.ts';

const SAT_LABEL = Object.fromEntries(SATELLITES.map((s) => [s.id, s.label]));

const FOV = (50 * Math.PI) / 180;
type Obj = (typeof CATALOG)[number];
const LOWER = CATALOG.map((o) => [o, o.name.toLowerCase()] as const);

/**
 * Best matches first: exact name, then names starting with the query, then a word in the name starting
 * with it ("crab" → Crab Nebula before Acrab), then anywhere; shorter names first within a tier.
 */
export function rank(query: string, limit = 8): Obj[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: [number, Obj][] = [];
  for (const [o, n] of LOWER) {
    const word = n.includes(` ${q}`) || n.includes(`(${q}`) || n.includes(`-${q}`);
    const tier = n === q ? 0 : n.startsWith(q) ? 1 : word ? 2 : n.includes(q) ? 3 : -1;
    if (tier >= 0) scored.push([tier * 1000 + n.length, o]);
  }
  return scored.sort((x, y) => x[0] - y[0]).slice(0, limit).map(([, o]) => o);
}

function go(o: Obj) {
  const s = useStore.getState();
  s.select(o.id);
  s.flyTo(o.id);
}

function Search() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => rank(q), [q]);
  // "/" jumps to the search box, as on most sites
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target as HTMLElement).closest('input, textarea, select')) { e.preventDefault(); input.current?.focus(); }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []);
  const pick = (o: Obj) => {
    go(o);
    setQ(o.name);
    setOpen(false);
    input.current?.blur();
  };
  const shown = open && q.trim() !== '';
  return (
    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); if (results[active]) pick(results[active]); }}>
      <SearchIcon />
      <label htmlFor="search" className="sr-only">Search for an object</label>
      <input
        ref={input}
        id="search"
        role="combobox"
        aria-expanded={shown}
        aria-controls="search-results"
        aria-activedescendant={shown && results[active] ? `result-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder="Search the universe"
        value={q}
        onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onFocus={(e) => { e.target.select(); setOpen(true); }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            const n = results.length || 1;
            setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n);
          } else if (e.key === 'Escape') {
            if (shown) setOpen(false); else { setQ(''); input.current?.blur(); }
          }
        }}
      />
      {q && <button type="button" className="search-clear" aria-label="Clear search" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(''); input.current?.focus(); }}>×</button>}
      {shown && (
        <ul id="search-results" className="search-results glass" role="listbox">
          {results.length ? results.map((o, i) => (
            <li
              key={o.id}
              id={`result-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()} // keep focus so the click lands
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(o)}
            >
              <span className="name">{o.name}</span>
              <span className="type">{o.type}</span>
            </li>
          )) : <li className="empty" role="status">No matches for “{q.trim()}”</li>}
        </ul>
      )}
    </form>
  );
}

function ScaleBar() {
  const logD = useStore((s) => Math.round(s.logD * 100) / 100);
  const { label, px } = scaleBar((2 * 10 ** logD * Math.tan(FOV / 2)) / innerHeight);
  return (
    <div className="scalebar" aria-label={`Scale: ${label}`}>
      <div className="bar" style={{ width: px }} />
      <span>{label}</span>
    </div>
  );
}

function LayerNav() {
  const current = useStore((s) => layerAt(s.logD).id);
  return (
    <nav className="rail" aria-label="Zoom layers">
      <ol>
        {LAYERS.map((l, i) => (
          <li key={l.id}>
            <button data-n={l.id} aria-current={l.id === current ? 'true' : undefined} onClick={() => useStore.getState().jumpToLayer(i)}>
              <span className="tick" aria-hidden />
              <span className="name">{l.name}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ScaleToggle() {
  const readable = useStore((s) => s.readable);
  const set = useStore((s) => s.set);
  return (
    <div className="seg" role="group" aria-label="Body size scale">
      <button aria-pressed={readable} onClick={() => set({ readable: true })}>Readable</button>
      <button aria-pressed={!readable} onClick={() => set({ readable: false })}>True scale</button>
    </div>
  );
}

const FILTERS = [['labels', 'Names'], ['satellites', 'Satellites'], ['orbits', 'Orbits']] as const;

function Filters() {
  const show = useStore((s) => s.show);
  const set = useStore((s) => s.set);
  return (
    <details className="filters">
      <summary>Settings</summary>
      <div className="filters-menu glass">
        {FILTERS.map(([k, name]) => (
          <label key={k}>
            <input type="checkbox" checked={show[k]} onChange={() => set({ show: { ...show, [k]: !show[k] } })} />
            {name}
          </label>
        ))}
        <button className="privacy" onClick={() => showLegal('privacy')}>Privacy &amp; Terms</button>
      </div>
    </details>
  );
}

function Links() {
  const set = useStore((s) => s.set);
  return (
    <nav className="nav-links" aria-label="Explore">
      <button onClick={startTour}>Tour</button>
      <button onClick={() => set({ panel: 'sky', tour: null })}>Sky</button>
      <button onClick={() => set({ panel: 'sizes', tour: null })}>Sizes</button>
    </nav>
  );
}

/** Shown while the camera rides along with a satellite. */
function Following() {
  const sat = useStore((s) => (s.focusId && !s.flight && byId.get(s.focusId)?.earthOrbit ? byId.get(s.focusId)! : null));
  if (!sat) return null;
  return (
    <div className="following glass" role="status">
      <span className="dot" aria-hidden />
      Following {SAT_LABEL[sat.id] ?? sat.name}
      <button onClick={() => useStore.getState().flyTo('earth', 7.55)}>Stop</button>
    </div>
  );
}

export function Hud() {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <p className="wordmark">Zoom<span>verse</span></p>
          <Links />
          <div className="nav-right">
            <Search />
            <Filters />
            <ScaleToggle />
          </div>
        </div>
      </header>
      <LayerNav />
      <Following />
      <ScaleBar />
      <Legal />
    </>
  );
}
