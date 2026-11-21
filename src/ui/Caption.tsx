// Caption card above the time bar, plus the guided-tour autopilot that drives it.
import { useEffect } from 'react';
import { useStore } from '../store.ts';
import { tourById } from '../data/tour.ts';
import { eventById, phaseAt, type EventId } from '../data/events.ts';
import { endEvent } from '../scene/Events.tsx';
import { galDir } from '../lib/coords.ts';
import { Close } from './icons.tsx';

export const startTour = (id = 'universe') => useStore.getState().set({ tour: { id, step: 0 }, event: null, selected: null, panel: null });
/** Go to a step of the current tour; past the end (or null) ends it. */
const goto = (step: number | null) => {
  const { tour, set } = useStore.getState();
  if (!tour || step === null || step >= tourById(tour.id).stops.length) set({ tour: null, caption: null });
  else set({ tour: { id: tour.id, step: Math.max(0, step) } });
};

/** Flies to each stop, waits for arrival, lingers, then moves on. Zooming yourself mid-flight ends the tour. */
function useTourAutopilot(id: string | undefined, step: number | undefined) {
  useEffect(() => {
    if (id === undefined || step === undefined) return;
    const stop = tourById(id).stops[step];
    const s = useStore.getState();
    s.set({ caption: { title: stop.title, text: stop.text } });
    s.flyTo(stop.focus, stop.logD, stop.viewGal && galDir(...stop.viewGal));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useStore.subscribe((st, prev) => {
      if (!prev.flight || st.flight) return;
      unsub();
      if (st.focusId === stop.focus) timer = setTimeout(() => goto(step + 1), stop.hold * 1000);
      else goto(null); // the flight was interrupted by the viewer
    });
    return () => { unsub(); clearTimeout(timer); };
  }, [id, step]);
}

/** The running time-lapse: its clock, what's happening now, and play / scrub controls. */
function EventPanel({ id, t, playing }: { id: EventId; t: number; playing: boolean }) {
  const e = eventById(id), phase = phaseAt(e, t);
  const set = (p: Partial<{ t: number; playing: boolean }>) => useStore.getState().set({ event: { id, t, playing, ...p } });
  return (
    <section className="caption event glass" aria-live="polite">
      <button className="icon close" aria-label="Exit time-lapse" onClick={endEvent}><Close /></button>
      <p className="kicker">{e.name} · {e.clock(t)}</p>
      <h2>{phase.title}</h2>
      <p>{phase.text}</p>
      <div className="row scrub">
        <button className="primary" onClick={() => set(t >= 1 ? { t: 0, playing: true } : { playing: !playing })}>{t >= 1 ? 'Replay' : playing ? 'Pause' : 'Play'}</button>
        <label className="sr-only" htmlFor="event-t">Time-lapse position</label>
        <input id="event-t" type="range" min={0} max={1000} value={Math.round(t * 1000)} onChange={(ev) => set({ t: +ev.target.value / 1000, playing: false })} />
      </div>
    </section>
  );
}

export function Caption() {
  const caption = useStore((s) => s.caption);
  const event = useStore((s) => s.event);
  const tour = useStore((s) => s.tour);
  useTourAutopilot(tour?.id, tour?.step);
  if (event) return <EventPanel {...event} />;
  if (!caption) return null;
  const stops = tour ? tourById(tour.id).stops.length : 0;
  return (
    <section className="caption glass" aria-live="polite">
      <button className="icon close" aria-label={tour === null ? 'Dismiss' : 'Exit tour'} onClick={() => goto(null)}><Close /></button>
      {tour && <p className="kicker">{tourById(tour.id).name} · {tour.step + 1} of {stops}</p>}
      <h2>{caption.title}</h2>
      <p>{caption.text}</p>
      {tour && (
        <div className="row">
          <button disabled={tour.step === 0} onClick={() => goto(tour.step - 1)}>Back</button>
          <button className="primary" onClick={() => goto(tour.step + 1)}>{tour.step === stops - 1 ? 'Finish' : 'Next'}</button>
        </div>
      )}
    </section>
  );
}
