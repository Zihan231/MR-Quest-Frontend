export function roleLabel(role?: string | null): string {
  switch (role?.toLowerCase()) {
    case "user":
      return "Mr";
    case "employee":
      return "Trainer";
    case "admin":
      return "Admin";
    default:
      return role ?? "";
  }
}
