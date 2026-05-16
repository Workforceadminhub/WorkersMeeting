import debounce from "lodash/debounce";
import { useEffect, useRef, useState } from "react";
import { DEBOUNCE_MS } from "../utils/constants";

export const useDebouncedSearch = () => {
  const [search, setSearch] = useState("");
  const debouncedRef = useRef(
    debounce((query: string) => setSearch(query), DEBOUNCE_MS)
  );

  useEffect(() => {
    const fn = debouncedRef.current;
    return () => fn.cancel();
  }, []);

  return { debouncedSearch: debouncedRef.current, search };
};
