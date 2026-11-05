import type { ReactNode } from 'react';

type SlotPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'left'
  | 'right';

const POSITION_CLASSES: Record<SlotPosition, string> = {
  'top-left': 'top-[3%] left-[2%] items-start',
  'top-center': 'top-[3%] left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-[3%] right-[2%] items-end',
  'bottom-left': 'bottom-[3.5%] left-[2.5%] items-start',
  'bottom-center': 'bottom-[3.5%] left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-[3.5%] right-[2.5%] items-end',
  left: 'top-1/2 left-[2.5%] -translate-y-1/2 items-start',
  right: 'top-1/2 right-[2%] -translate-y-1/2 items-end',
};

type Props = {
  position: SlotPosition;
  children: ReactNode;
  className?: string;
};

export function HUDSlot({ position, children, className }: Props) {
  return (
    <div
      className={`pointer-events-none absolute flex flex-col gap-3 ${POSITION_CLASSES[position]} ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
