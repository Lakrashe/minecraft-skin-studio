import { useEffect, useRef } from 'react';
import { useT } from '@/i18n';
import { usePersistenceStatus } from '@/state';
import { toast } from '@/ui';

/** Warns once per session when preferences stop reaching durable storage. */
export function PersistenceNotice() {
  const persistent = usePersistenceStatus((s) => s.persistent);
  const t = useT();
  const warned = useRef(false);

  useEffect(() => {
    if (persistent || warned.current) return;
    warned.current = true;
    toast.warning(t('settings.notSaved'), { duration: 8000 });
  }, [persistent, t]);

  return null;
}
