import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useAuthStore } from '@/store/authStore'
import { useOrganisation } from '@/hooks/useOrganisations'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { organisationsApi } from '@/api/organisation.api'
import { formatDate } from '@/utils/formatter'

const createOrgSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['AGENCY', 'UMBRELLA']),
})

const OrganisationList = () => {
  const user  = useAuthStore((s) => s.user)
  const qc    = useQueryClient()
  const [activeTab, setActiveTab] = useState('view')

  const primaryMembership = user?.memberships?.[0]
  const orgId = primaryMembership?.organisation?.id

  const { data: org, isLoading } = useOrganisation(orgId)

  const { mutate: createOrg, isPending, error } = useMutation({
    mutationFn: (data) => organisationsApi.create(data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['organisations'] })
      reset()
      setActiveTab('view')
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(createOrgSchema),
  })

  const TABS = [
    { id: 'view',   label: 'Current organisation' },
    { id: 'create', label: 'Create organisation'  },
  ]

  return (
    <AppShell>
      <PageHeader title="Organisations" description="Manage organisations on the platform" />

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'view' && (
        isLoading ? <LoadingSpinner /> : !org ? (
          <p className="text-sm text-muted-foreground">No organisation data available.</p>
        ) : (
          <div className="space-y-6 max-w-2xl">
            <div className="border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{org.name}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                    {org.type}
                  </span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${org.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Created {formatDate(org.createdAt)}</p>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/30">
                <h3 className="text-sm font-medium">Members ({org.memberships?.length ?? 0})</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(org.memberships ?? []).map((m) => (
                    <tr key={m.user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{m.user.firstName} {m.user.lastName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{m.user.email}</td>
                      <td className="px-4 py-3">
                        <span className="bg-muted px-2 py-0.5 rounded-full text-xs">
                          {m.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {activeTab === 'create' && (
        <div className="max-w-md">
          <div className="border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Create a new organisation</h2>
            <form onSubmit={handleSubmit(createOrg)} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Organisation name</label>
                <input
                  {...register('name')}
                  placeholder="e.g. Acme Recruitment Ltd"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Type</label>
                <select
                  {...register('type')}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select type...</option>
                  <option value="AGENCY">Agency</option>
                  <option value="UMBRELLA">Umbrella company</option>
                </select>
                {errors.type && <p className="text-xs text-destructive mt-1">{errors.type.message}</p>}
              </div>
              {error && <ErrorMessage error={error} />}
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Creating...' : 'Create organisation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default OrganisationList

// time sheet id - 23ffcc50-aadf-43db-97af-de0dd39ea288