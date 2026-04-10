import type { ArachneXEvent } from "@/features/arachne-x/event-system/eventTypes";

export type ArachneXEventHandler = (event: ArachneXEvent) => void;

export function createArachneXEventBus() {
  const handlers = new Set<ArachneXEventHandler>();

  return {
    publish(event: ArachneXEvent) {
      handlers.forEach((h) => h(event));
    },
    subscribe(handler: ArachneXEventHandler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}

