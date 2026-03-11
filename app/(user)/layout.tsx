import UserShell from "@/src/components/layout/UserShell";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserShell>{children}</UserShell>;
}