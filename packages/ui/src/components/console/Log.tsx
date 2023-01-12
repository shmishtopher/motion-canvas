import styles from './Console.module.scss';

import {LogLevel, LogPayload} from '@motion-canvas/core';
import {useEffect, useMemo, useState} from 'preact/hooks';
import {resolveStackTrace, StackTraceEntry} from '../../utils';
import {useInspection} from '../../contexts';
import {useFormattedNumber} from '../../hooks';
import {IconButton, IconType, Toggle} from '../controls';
import {StackTrace} from './StackTrace';
import {SourceCodeFrame} from './SourceCodeFrame';
import clsx from 'clsx';

export interface LogProps {
  payload: LogPayload;
}

export function Log({payload}: LogProps) {
  const [open, setOpen] = useState(payload.level === LogLevel.Error);
  const [entries, setEntries] = useState<StackTraceEntry[] | null>(null);
  const {setInspectedElement} = useInspection();
  const duration = useFormattedNumber(payload.durationMs, 2);
  const object = useMemo(
    () =>
      payload.object ? JSON.stringify(payload.object, undefined, 2) : null,
    [payload],
  );
  const userEntry = useMemo(() => {
    return entries?.find(entry => !entry.isExternal) ?? null;
  }, [entries]);

  const hasBody = !!object || !!entries || !!payload.remarks;

  useEffect(() => {
    if (payload.stack) {
      resolveStackTrace(payload.stack).then(setEntries);
    }
  }, [payload]);

  return (
    <div
      className={clsx(
        styles.log,
        styles[payload.level],
        !hasBody && styles.empty,
      )}
    >
      <div className={styles.header}>
        {hasBody && <Toggle open={open} onToggle={setOpen} />}
        <div className={styles.message}>{payload.message}</div>
        {duration !== null && (
          <div className={styles.duration}>{duration} ms</div>
        )}
        {payload.inspect && (
          <IconButton
            title="Select related node"
            icon={IconType.locate}
            onClick={() => setInspectedElement(payload.inspect)}
          />
        )}
      </div>
      {hasBody && open && (
        <div>
          {userEntry && <SourceCodeFrame entry={userEntry} />}
          {entries && <StackTrace entries={entries} />}
          {object && <pre className={styles.code}>{object}</pre>}
          {payload.remarks && (
            <div
              className={styles.remarks}
              dangerouslySetInnerHTML={{__html: payload.remarks}}
            />
          )}
        </div>
      )}
    </div>
  );
}
