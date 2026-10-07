import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminService } from '../services';

export default function AdminPage() {
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.users(),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.stats,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['admin-depts'],
    queryFn: adminService.departmentsAdmin,
  });

  const [dept, setDept] = useState({ name: '', code: '' });

  const createDept = useMutation({
    mutationFn: () => adminService.createDepartment(dept),
    onSuccess: () => {
      setDept({ name: '', code: '' });
      qc.invalidateQueries({ queryKey: ['admin-depts'] });
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Administration</h1>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-5">
          {['users', 'projects', 'pending', 'teams', 'reports'].map((k) => (
            <div key={k} className="card p-4">
              <p className="text-xs uppercase text-stone-500">{k}</p>
              <p className="font-display text-3xl">{stats[k]}</p>
            </div>
          ))}
        </div>
      )}

      <section className="card p-5">
        <h2 className="font-display text-xl">Departments</h2>

        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            createDept.mutate();
          }}
        >
          <input
            className="input max-w-xs"
            placeholder="Name"
            value={dept.name}
            onChange={(e) =>
              setDept((d) => ({ ...d, name: e.target.value }))
            }
          />

          <input
            className="input max-w-[120px]"
            placeholder="Code"
            value={dept.code}
            onChange={(e) =>
              setDept((d) => ({ ...d, code: e.target.value }))
            }
          />

          <button className="btn-primary">Add</button>
        </form>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {departments.map((d) => (
            <li
              key={d.id}
              className="rounded-xl bg-stone-50 px-3 py-2 text-sm"
            >
              {d.name} ({d.code})
            </li>
          ))}
        </ul>
      </section>

      <section className="card overflow-x-auto p-5">
        <h2 className="font-display text-xl">Users</h2>

        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-stone-500">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Industry</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.name}</td>

                <td>{u.email}</td>

                <td>
                  <select
                    className="input py-1"
                    value={u.role}
                    onChange={(e) =>
                      adminService
                        .setRole(u.id, e.target.value)
                        .then(() =>
                          qc.invalidateQueries({
                            queryKey: ['admin-users'],
                          })
                        )
                    }
                  >
                    {['STUDENT', 'INSTRUCTOR', 'INDUSTRY', 'ADMIN'].map(
                      (r) => (
                        <option key={r}>{r}</option>
                      )
                    )}
                  </select>
                </td>

                <td>
                  {u.role === 'INDUSTRY' && (
                    <button
                      className="text-dbu-600"
                      onClick={() =>
                        adminService
                          .approveIndustry(
                            u.id,
                            !u.industry_approved
                          )
                          .then(() =>
                            qc.invalidateQueries({
                              queryKey: ['admin-users'],
                            })
                          )
                      }
                    >
                      {u.industry_approved ? 'Revoke' : 'Approve'}
                    </button>
                  )}
                </td>

                <td className="space-x-2">
  {u.is_active ? (
    <button
      className="text-amber-700"
      onClick={async () => {
        try {
          await adminService.deactivate(u.id);

          await qc.invalidateQueries({
            queryKey: ['admin-users'],
          });

          alert('User deactivated successfully');
        } catch (error) {
          console.error('Deactivate failed:', error);

          alert(
            'Deactivate failed: ' +
              (error.response?.data?.message ||
                error.message)
          );
        }
      }}
    >
      Deactivate
    </button>
  ) : (
    <button
      className="text-green-700"
      onClick={async () => {
        try {
          await adminService.activate(u.id);

          await qc.invalidateQueries({
            queryKey: ['admin-users'],
          });

          alert('User activated successfully');
        } catch (error) {
          console.error('Activate failed:', error);

          alert(
            'Activate failed: ' +
              (error.response?.data?.message ||
                error.message)
          );
        }
      }}
    >
      Activate
    </button>
  )}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}