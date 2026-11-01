const MAX_WIDTH = 768;

export function smallScreen() {
  let matches = $state(false);

  $effect(() => {
    if (typeof globalThis.matchMedia !== "function") {
      return;
    }

    const media = globalThis.matchMedia(`(max-width: ${MAX_WIDTH}px)`);

    ({ matches } = media);

    const update = ({ matches: isMatching }: MediaQueryListEvent) => {
      matches = isMatching;
    };

    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  });

  return {
    get matches() {
      return matches;
    },
  };
}
