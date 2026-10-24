"use client";

import { useEffect, useState } from "react";

/** Creates an object URL for a Blob and revokes it when the blob changes or the component unmounts. */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [entry, setEntry] = useState<{ blob: Blob; url: string } | null>(null);
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    // Publishing an external resource created by this effect; it is revoked in the cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntry({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  // Only expose the URL that belongs to the current blob (never a stale or revoked one).
  return entry && blob && entry.blob === blob ? entry.url : null;
}
