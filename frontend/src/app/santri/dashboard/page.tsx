'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SantriDashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/santri/overview');
  }, [router]);

  return null;
}
