interface FeaturePlaceholderProps {
  eyebrow: string;
  title: string;
  message: string;
}

export function FeaturePlaceholder({
  eyebrow,
  title,
  message,
}: FeaturePlaceholderProps) {
  return (
    <section className="flex min-h-[520px] items-center justify-center px-4 py-6 text-white">
      <div className="max-w-2xl rounded-[32px] border border-card-bg-border bg-card-bg p-8 text-center backdrop-blur-3xl">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h1 className="chakra-petch mt-3 text-4xl font-semibold text-gray-50">
          {title}
        </h1>
        <p className="mt-4 font-mono text-sm leading-7 text-gray-300">
          {message}
        </p>
      </div>
    </section>
  );
}
