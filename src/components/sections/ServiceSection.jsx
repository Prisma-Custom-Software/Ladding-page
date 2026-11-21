// STUB (T01). T04 implementa a secao de servico generica.
// Props: `service` (item de content.js) ou `id` ('software' | 'motion' | 'landing').
import { services } from '../../data/content.js';

export default function ServiceSection({ service, id = 'software' }) {
  const s = service || services.find((x) => x.id === id) || services[0];
  return (
    <section
      id={s.id}
      data-sec="1"
      {...(s.light ? { 'data-light': '1' } : {})}
      data-ags={JSON.stringify(s.agents)}
      data-screen-label={`${s.index} ${s.label}`}
    />
  );
}
