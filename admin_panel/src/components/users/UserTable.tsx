import type { AdminUser } from "@/types/api";

type UserTableProps = {
  users: AdminUser[];
};

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Nema korisnika.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Kreirao</th>
            <th className="px-4 py-3 text-left">Kreiran</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{user.email}</td>
              <td className="px-4 py-3 text-slate-500">{user.createdBy}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(user.createdAt).toLocaleDateString("hr")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
