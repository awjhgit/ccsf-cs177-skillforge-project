
export type UserRole = "Admin" | "Manager" | "Employee";

export type AccountStatus = "Active" | "Inactive";

export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  status: AccountStatus;
}
