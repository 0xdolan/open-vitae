import { Button } from '@/components/ui/button';
import { navigate } from '@/hooks/useHashRoute';
import { SAMPLES, type SampleId } from '@/samples';
import { useResumeStore } from '@/stores';

/** The five built-in samples. Using one creates an editable copy; the sample itself never changes. */
export function SampleGallery() {
  const createFromSample = useResumeStore((s) => s.createFromSample);

  const useSample = async (id: SampleId) => {
    const doc = await createFromSample(id);
    if (doc) navigate({ name: 'editor', id: doc.id });
  };

  return (
    <section aria-labelledby="samples-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="samples-heading" className="text-lg font-bold">
          Start from a sample
        </h2>
        <p className="text-sm text-stone-600">
          You get your own copy to edit. All names, companies and contact details are fictional.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SAMPLES.map((sample) => (
          <li
            key={sample.id}
            className="flex flex-col rounded-xl border border-stone-200 bg-white p-4"
          >
            <p className="font-semibold">{sample.label}</p>
            <p className="text-sm text-stone-600" dir="auto">
              {sample.role}
            </p>
            <p className="mt-1 flex-1 text-xs text-stone-500">{sample.description}</p>
            <Button
              size="sm"
              className="mt-3 self-start"
              onClick={() => void useSample(sample.id)}
              aria-label={`Use the ${sample.label} sample`}
            >
              Use this sample
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
