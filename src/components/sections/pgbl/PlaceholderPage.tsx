type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="min-h-screen bg-[radial-gradient(120%_80%_at_50%_-10%,#16342B_0%,#0D2620_46%,#081712_100%)] px-6 pb-28 pt-10 text-[var(--pgbl-text)]">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col justify-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--pgbl-accent)]">
          PGBL Next FE
        </p>
        <h1 className="text-4xl font-extrabold tracking-normal md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--pgbl-text-muted)] md:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}
