/** Static foundation data — all agents use surname Vantage. No feature-layer imports. */

export type StaticEmployee = {
  id: string;
  firstName: string;
  role: StaticRole;
  verified: boolean;
};

export type StaticRole =
  | "CEO"
  | "Marketing"
  | "Operations"
  | "Product"
  | "Customer Support";

export const ROLE_FILTERS: Array<"All" | StaticRole> = [
  "All",
  "CEO",
  "Marketing",
  "Operations",
  "Product",
  "Customer Support",
];

export const STATIC_EMPLOYEES: StaticEmployee[] = [
  {
    id: "vantage-anna",
    firstName: "Anna",
    role: "Marketing",
    verified: true,
  },
  {
    id: "vantage-omar",
    firstName: "Omar",
    role: "Operations",
    verified: false,
  },
  {
    id: "vantage-talia",
    firstName: "Talia",
    role: "Product",
    verified: true,
  },
  {
    id: "vantage-morgan",
    firstName: "Morgan",
    role: "CEO",
    verified: true,
  },
  {
    id: "vantage-riley",
    firstName: "Riley",
    role: "Customer Support",
    verified: false,
  },
  {
    id: "vantage-elena",
    firstName: "Elena",
    role: "Marketing",
    verified: true,
  },
];

export function displayName(e: StaticEmployee): string {
  return `${e.firstName} Vantage`;
}
