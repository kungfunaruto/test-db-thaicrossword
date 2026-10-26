import { Fragment } from 'react';
/** Controls Thai line breaks: each part never splits; a part ending in a space renders a normal space after it. */
export default function Th({ parts }: { parts: string[] }) {
  return <>{parts.map((p, i) => <Fragment key={i}><span className="inline-block">{p.trim()}</span>{p.endsWith(' ') && ' '}</Fragment>)}</>;
}
