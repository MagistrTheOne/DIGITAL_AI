import { AppHeader } from "@/components/app/AppHeader";
import EmployeeGridView from "@/features/employees/components/EmployeeGridView";
import type {
  EmployeeListQuery,
  EmployeeRoleCategory,
} from "@/features/employees/types";
import { FilterTabs } from "@/components/shared/FilterTabs";

const ROLE_FILTERS: Array<"All" | EmployeeRoleCategory> = [
  "All",
  "CFO",
  "Marketing",
  "Operations",
  "Product",
  "Customer Support",
];

export default async function AiDigitalPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const qRaw = searchParams.q;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;

  const roleRaw = searchParams.role;
  const role = (Array.isArray(roleRaw) ? roleRaw[0] : roleRaw) ?? "All";

  const normalizedRole: EmployeeListQuery["role"] =
    ROLE_FILTERS.includes(role as any) ? (role as any) : "All";

  const query: EmployeeListQuery = {
    q: q || undefined,
    role: normalizedRole,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <AppHeader
        title="AI Digital"
        subtitle="Manage your digital workforce"
        searchQuery={q}
      />

      <div className="rounded-xl border bg-card p-4">
        <FilterTabs
          basePath="/ai-digital"
          items={ROLE_FILTERS.map((r) => ({ value: r, label: r }))}
          activeValue={query.role ?? "All"}
        />
      </div>

      <EmployeeGridView query={query} />
    </div>
  );
}

