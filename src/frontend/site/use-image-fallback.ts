"use client";

import { useCallback, useState } from "react";

/**
 * Tracks whether an `<img>` failed, including failures that happen before
 * React is listening.
 *
 * `onError` alone is not enough here. These images are rendered on the server,
 * so the browser starts fetching them from the raw HTML and a 404 can resolve
 * well before hydration — by which time the error event has already been
 * dispatched and missed, leaving a broken-image icon on screen forever. The
 * ref callback closes that window: on mount it asks the element whether it has
 * already finished loading with no intrinsic width, which is exactly the state
 * a failed image is left in.
 *
 * It matters because the site's photographs are files dropped into `public/`
 * by hand, so "not there yet" is a normal state rather than an error case.
 *
 * Spread the result onto the image:
 *
 *   const image = useImageFallback();
 *   return image.failed ? <Placeholder /> : <img src={src} {...image.props} />;
 */
export function useImageFallback() {
  const [failed, setFailed] = useState(false);

  const ref = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  return {
    failed,
    props: { ref, onError: () => setFailed(true) },
  };
}
