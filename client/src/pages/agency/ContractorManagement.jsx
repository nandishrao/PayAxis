import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AppShell from '@/components/shared/AppShell'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorMessage from '@/components/shared/ErrorMessage'
import { useAuthStore } from '@/store/authStore'
import { useOrganisation, useAddMember, useLinkContractor } from '@/hooks/useOrganisations'
import { formatDate } from '@/utils/formatter'

const memberSchema = z.object({
  userId: z.string().uuid('Must be a valid user ID'),
  role:   z.enum(['CONTRACTOR', 'AGENCY_ADMIN', 'AGENCY_CONSULTANT']),
})

const linkSchema = z.object({
  contractorId:      z.string().uuid('Must be a valid user ID'),
  agencyId:          z.string().uuid('Must be a valid org ID'),
  umbrellaId:        z.string().uuid('Must be a valid org ID'),
  agreedRatePerHour: z.number({ invalid_type_error: 'Must be a number' }).positive('Must be positive'),
  currency:          z.string().length(3).default('GBP'),
})

const Panel = ({ title, description, children }) => (
  <div className="border rounded-xl p-6">
    <h2 className="text-sm font-semibold mb-0.5">{title}</h2>
    {description && <p className="text-xs text-muted-foreground mb-5">{description}</p>}
    <div className="mt-4">{children}</div>
  </div>
)

const ContractorManagement = () => {
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState('members')

  const agencyMembership = user?.memberships?.find(
    (m) => m.organisation?.type === 'AGENCY'
  )
  const agencyId = agencyMembership?.organisation?.id

  const { data: org, isLoading } = useOrganisation(agencyId)
  const { mutate: addMember,    isPending: addingMember,  error: memberError,  reset: resetMember  } = useAddMember(agencyId)
  const { mutate: linkContractor, isPending: linking,     error: linkError,    reset: resetLink    } = useLinkContractor()

  const memberForm = useForm({ resolver: zodResolver(memberSchema) })
  const linkForm   = useForm({
    resolver: zodResolver(linkSchema),
    defaultValues: { agencyId, currency: 'GBP' },
  })

  const onAddMember = (values) => {
    addMember(values, {
      onSuccess: () => { memberForm.reset(); resetMember() },
    })
  }

  const onLinkContractor = (values) => {
    linkContractor(values, {
      onSuccess: () => { linkForm.reset({ agencyId, currency: 'GBP' }); resetLink() },
    })
  }

  const TABS = [
    { id: 'members', label: 'Members' },
    { id: 'add',     label: 'Add member' },
    { id: 'link',    label: 'Link contractor' },
  ]

  return (
    <AppShell>
      <PageHeader
        title="Contractor management"
        description={org ? `Managing ${org.name}` : 'Manage members and contractor assignments'}
      />

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <>
          {activeTab === 'members' && (
            <Panel title="Organisation members" description="All active members of your agency">
              {!org?.memberships?.length
                ? <p className="text-sm text-muted-foreground text-center py-6">No members found</p>
                : (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {org.memberships.map((m) => (
                          <tr key={m.user.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">
                              {m.user.firstName} {m.user.lastName}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{m.user.email}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className="bg-muted px-2 py-0.5 rounded-full">
                                {m.role.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {formatDate(m.user.createdAt ?? new Date())}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </Panel>
          )}

          {activeTab === 'add' && (
            <Panel title="Add member" description="Add an existing user to this organisation with a role">
              <form onSubmit={memberForm.handleSubmit(onAddMember)} className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-medium block mb-1.5">User ID</label>
                  <input
                    {...memberForm.register('userId')}
                    placeholder="UUID of the user to add"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {memberForm.formState.errors.userId && (
                    <p className="text-xs text-destructive mt-1">{memberForm.formState.errors.userId.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Role</label>
                  <select
                    {...memberForm.register('role')}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select role...</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="AGENCY_CONSULTANT">Agency consultant</option>
                    <option value="AGENCY_ADMIN">Agency admin</option>
                  </select>
                  {memberForm.formState.errors.role && (
                    <p className="text-xs text-destructive mt-1">{memberForm.formState.errors.role.message}</p>
                  )}
                </div>
                {memberError && <ErrorMessage error={memberError} />}
                <button
                  type="submit"
                  disabled={addingMember}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {addingMember ? 'Adding...' : 'Add member'}
                </button>
              </form>
            </Panel>
          )}

          {activeTab === 'link' && (
            <Panel title="Link contractor" description="Assign a contractor to this agency and an umbrella company with an agreed rate">
              <form onSubmit={linkForm.handleSubmit(onLinkContractor)} className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Contractor user ID</label>
                  <input
                    {...linkForm.register('contractorId')}
                    placeholder="UUID of the contractor"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {linkForm.formState.errors.contractorId && (
                    <p className="text-xs text-destructive mt-1">{linkForm.formState.errors.contractorId.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Umbrella company ID</label>
                  <input
                    {...linkForm.register('umbrellaId')}
                    placeholder="UUID of the umbrella organisation"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {linkForm.formState.errors.umbrellaId && (
                    <p className="text-xs text-destructive mt-1">{linkForm.formState.errors.umbrellaId.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Rate per hour (£)</label>
                    <input
                      {...linkForm.register('agreedRatePerHour', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 45.00"
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {linkForm.formState.errors.agreedRatePerHour && (
                      <p className="text-xs text-destructive mt-1">{linkForm.formState.errors.agreedRatePerHour.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Currency</label>
                    <select
                      {...linkForm.register('currency')}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                {linkError && <ErrorMessage error={linkError} />}
                <button
                  type="submit"
                  disabled={linking}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {linking ? 'Linking...' : 'Link contractor'}
                </button>
              </form>
            </Panel>
          )}
        </>
      )}
    </AppShell>
  )
}

export default ContractorManagement