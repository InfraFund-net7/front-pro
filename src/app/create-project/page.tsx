import { Suspense } from 'react';
import CreateProject from '@/components/createproject/CreateProject';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreateProject />
    </Suspense>
  );
}
