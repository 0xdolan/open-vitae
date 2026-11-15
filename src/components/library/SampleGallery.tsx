import { Button } from '@/components/ui/button';
import { SAMPLES } from '@/samples';
import { useResumeStore } from '@/stores';

/** The five built-in samples. Using one creates an editable copy; the sample itself never changes. */
export function SampleGallery() {
  const createFromSample = useResumeStore((s) => s.createFromSample);

  return (
    <section aria-labelledby="samples-heading" className="flex flex-col gap-3">
      <h2 id="samples-heading" className="text-sm font-bold tracking-wide text-stone-700 uppercase">
        Samples
      </h2>
      <ul className="flex flex-col gap-1.5">
        {SAMPLES.map((sample) => (
          <li key={sample.id} className="rounded-lg border border-stone-200 bg-white p-2.5">
            <p className="text-sm font-semibold">
              {sample.label} <span className="font-normal text-stone-500">· {sample.role}</span>
            </p>
            <p className="mt-0.5 text-xs text-stone-600">{sample.description}</p>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => void createFromSample(sample.id)}
              aria-label={`Use the ${sample.label} sample`}
            >
              Use this sample
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-500">All names, companies and contact details are fictional.</p>
    </section>
  );
}
