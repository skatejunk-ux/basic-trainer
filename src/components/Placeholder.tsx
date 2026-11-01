import { Link } from 'react-router-dom';

interface Props {
  title: string;
  text: string;
  backTo?: string;
  backLabel?: string;
}

export function Placeholder({ title, text, backTo, backLabel }: Props) {
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      {text && <p className="mt-2 text-muted">{text}</p>}
      {backTo && (
        <Link to={backTo} className="btn-primary mt-4">
          {backLabel}
        </Link>
      )}
    </section>
  );
}
