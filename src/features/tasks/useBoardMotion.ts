import { useLayoutEffect, useRef } from 'react';

// Motion reference: Lucian UX/UI Prompt #251 and #317. Original React implementation.
const BOARD_MOTION = { duration: 260, stagger: 22, maxDelay: 110, rise: 8, easing: 'cubic-bezier(.2,.8,.2,1)' };

export function useBoardMotion(layoutKey: string, reduceMotion: boolean) {
  const board = useRef<HTMLDivElement>(null);
  const previous = useRef(new Map<string, { x: number; y: number }>());
  useLayoutEffect(() => {
    const cards = Array.from(board.current?.querySelectorAll<HTMLElement>('[data-task-id]') ?? []);
    const next = new Map<string, { x: number; y: number }>();
    const animations: Animation[] = [];
    const reduced = reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Read layout in one batch; transforms never affect these natural positions.
    const positions = cards.map(card => ({ x: card.offsetLeft, y: card.offsetTop }));
    cards.forEach((card, index) => {
      const id = card.dataset.taskId!;
      const position = positions[index];
      const old = previous.current.get(id);
      next.set(id, position);
      if (reduced) return;
      const x = old ? old.x - position.x : 0;
      const y = old ? old.y - position.y : BOARD_MOTION.rise;
      if (old && !x && !y) return;
      animations.push(card.animate([
        { transform: `translate(${x}px, ${y}px)`, opacity: old ? 1 : 0 },
        { transform: 'translate(0, 0)', opacity: 1 },
      ], { duration: BOARD_MOTION.duration, easing: BOARD_MOTION.easing, delay: old ? 0 : Math.min(index * BOARD_MOTION.stagger, BOARD_MOTION.maxDelay), fill: 'backwards' }));
    });
    previous.current = next;
    return () => animations.forEach(animation => animation.cancel());
  }, [layoutKey, reduceMotion]);
  return board;
}
