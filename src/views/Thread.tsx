import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import type { Enquiry } from '../lib/types';

/** The text conversation for one enquiry, as either the customer or the tradie sees it. */
export function Thread({ e, side, className }: { e: Enquiry; side: 'customer' | 'tradie'; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  // Scroll only the conversation itself to the newest message, never the whole page.
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [e.messages.length]);
  let lastDay = -1;
  return (
    <div ref={box} className={clsx('scroll-thin flex-1 space-y-2 overflow-y-auto bg-bg/50 px-3 py-3', className)}>
      {e.messages.map((m) => {
        const showDay = m.day !== lastDay;
        lastDay = m.day;
        const mine = (side === 'customer' && m.from === 'customer') || (side === 'tradie' && m.from === 'tradie');
        return (
          <div key={m.id}>
            {showDay && <p className="my-2 text-center text-[11px] font-medium text-ink-3">Day {m.day}</p>}
            {m.from === 'system' ? (
              <p className="mx-auto max-w-[85%] rounded-md bg-surface-2 px-2 py-1 text-center text-[12px] text-ink-2">{m.text}</p>
            ) : (
              <div className={clsx('flex flex-col', mine ? 'items-end' : 'items-start')}>
                <p
                  className={clsx(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-[13.5px] leading-snug whitespace-pre-line',
                    mine ? 'rounded-br-md bg-navy text-white' : 'rounded-bl-md bg-bubble text-ink',
                  )}
                >
                  {m.text}
                </p>
                {side === 'tradie' && m.from === 'tradie' && m.auto && <span className="mt-0.5 text-[10.5px] text-ink-3">Sent automatically</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
