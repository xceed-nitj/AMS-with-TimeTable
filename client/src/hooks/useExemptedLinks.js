import { useEffect, useState } from 'react';
import axios from 'axios';
import getEnvironment from '../getenvironment';

const normalize = (p) => {
  if (!p) return '';
  let s = String(p).trim();
  if (!s.startsWith('/')) s = '/' + s;
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s;
};

export default function useExemptedLinks(localDefaults = []) {
  const apiUrl = getEnvironment();
  const [exemptedLinks, setExemptedLinks] = useState(
    (localDefaults || []).map(normalize)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchLinks = async () => {
      try {
        const res = await axios.get(`${apiUrl}/platform/get-exempted-links`);
        const serverLinks = (res.data || []).map(normalize);
        const merged = Array.from(
          new Set([...(localDefaults || []).map(normalize), ...serverLinks])
        );
        if (mounted) setExemptedLinks(merged);
      } catch (err) {
        console.debug('useExemptedLinks: failed to fetch', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLinks();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  return { exemptedLinks, loading };
}
