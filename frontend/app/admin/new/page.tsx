import { requireAdmin } from '@/lib/auth/rbac';
import NewAdminClient from './client';

export const dynamic = 'force-dynamic';

export default async function NewAdminPage() {
  // This page is strictly for the Super Admin (Developer role)
  await requireAdmin(['Developer']);

  return (
    <div className="py-8">
      <NewAdminClient />
    </div>
  );
}
