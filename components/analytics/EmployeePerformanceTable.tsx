import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const cardSurface = "border-neutral-800 bg-neutral-950/50 text-neutral-200 shadow-none ring-0";

/** Placeholder rows — replace via BFF later. */
const ROWS = [
  {
    name: "Anna Vantage",
    sessions: "142",
    success: "98.2%",
    latency: "1.2s",
  },
  {
    name: "Marcus Vantage",
    sessions: "98",
    success: "96.4%",
    latency: "1.4s",
  },
  {
    name: "Sofia Vantage",
    sessions: "201",
    success: "99.1%",
    latency: "0.9s",
  },
  {
    name: "James Vantage",
    sessions: "76",
    success: "94.0%",
    latency: "1.6s",
  },
] as const;

export function EmployeePerformanceTable() {
  return (
    <Card size="sm" className={cn(cardSurface)}>
      <CardHeader>
        <CardTitle className="text-base text-neutral-100">AI employee performance</CardTitle>
        <CardDescription className="text-neutral-500">
          Throughput and quality signals per agent (placeholder data).
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 hover:bg-transparent">
              <TableHead className="w-[40%] pl-6 text-neutral-500">Name</TableHead>
              <TableHead className="text-neutral-500">Sessions</TableHead>
              <TableHead className="text-neutral-500">Success rate</TableHead>
              <TableHead className="pr-6 text-right text-neutral-500">Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((r) => (
              <TableRow
                key={r.name}
                className="border-neutral-800/80 hover:bg-neutral-900/40"
              >
                <TableCell className="pl-6 font-medium text-neutral-200">{r.name}</TableCell>
                <TableCell className="tabular-nums text-neutral-400">{r.sessions}</TableCell>
                <TableCell className="tabular-nums text-neutral-400">{r.success}</TableCell>
                <TableCell className="pr-6 text-right tabular-nums text-neutral-400">
                  {r.latency}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
