import type { ArachineXEvent } from "@/features/arachine-x/event-system/eventTypes";

export type ArachineXEventHandler = (event: ArachineXEvent) => void;

export function createArachineXEventBus() {
  const handlers = new Set<ArachineXEventHandler>();

  return {
    publish(event: ArachineXEvent) {
      handlers.forEach((h) => h(event));
    },
    subscribe(handler: ArachineXEventHandler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}

