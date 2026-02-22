import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  Archive,
  RotateCcw,
  Receipt,
  Activity,
} from 'lucide-react'
import BalancesSummary from '@/components/BalancesSummary'
import SettleUpVisualization from '@/components/SettleUpVisualization'
import ActivityLogs from '@/components/ActivityLogs'
import PaymentForm from '@/components/PaymentForm'
import type { Doc, Id } from '@convex/_generated/dataModel'

export const Route = createFileRoute('/groups/$groupId/sandbox/$sandboxId')({
  component: SandboxPage,
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function SandboxPage() {
  const { groupId, sandboxId } = Route.useParams()
  const groupIdTyped = groupId as Id<'groups'>
  const sandboxIdTyped = sandboxId as Id<'sandboxes'>
  const [activeTab, setActiveTab] = useState<'payments' | 'logs'>('payments')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<{
    id: Id<'payments'>
    title: string
    amount: number
    paidBy: Id<'members'>
    paidFor: Id<'members'>[]
  } | null>(null)

  const sandbox = useQuery(api.sandboxes.get, { id: sandboxIdTyped })
  const payments = useQuery(api.payments.listBySandbox, { sandboxId: sandboxIdTyped })
  const settlement = useQuery(api.settlement.getSettlement, { sandboxId: sandboxIdTyped })
  const members = useQuery(api.members.listByGroup, { groupId: groupIdTyped })
  const logs = useQuery(api.paymentLogs.listBySandbox, { sandboxId: sandboxIdTyped })

  const setStatus = useMutation(api.sandboxes.setStatus)
  const reopen = useMutation(api.sandboxes.reopen)
  const removePayment = useMutation(api.payments.remove)

  const isEditable = sandbox?.status === 'active'
  const memberMap = new Map(members?.map((m) => [m._id, m.name]) ?? [])

  if (sandbox === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (sandbox === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Sandbox not found</p>
        <Link to="/groups/$groupId" params={{ groupId }} className="text-emerald-600 font-medium">
          Back to group
        </Link>
      </div>
    )
  }

  const handleSettle = () => setStatus({ id: sandboxIdTyped, status: 'settled' })
  const handleArchive = () => setStatus({ id: sandboxIdTyped, status: 'archived' })
  const handleReopen = () => reopen({ id: sandboxIdTyped })

  const openEditForm = (p: Doc<'payments'>) => {
    setEditingPayment({
      id: p._id,
      title: p.title,
      amount: p.amount,
      paidBy: p.paidBy,
      paidFor: p.paidFor,
    })
    setShowPaymentForm(true)
  }

  const closePaymentForm = () => {
    setShowPaymentForm(false)
    setEditingPayment(null)
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Link
          to="/groups/$groupId"
          params={{ groupId }}
          className="p-2 -m-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 truncate flex-1">{sandbox.name}</h1>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            sandbox.status === 'active'
              ? 'bg-emerald-100 text-emerald-800'
              : sandbox.status === 'settled'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          {sandbox.status === 'active' && <Check size={12} />}
          {sandbox.status === 'settled' && <Check size={12} />}
          {sandbox.status === 'archived' && <Archive size={12} />}
          {sandbox.status.charAt(0).toUpperCase() + sandbox.status.slice(1)}
        </span>
        {sandbox.status === 'settled' && isEditable === false && (
          <button
            onClick={handleReopen}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200"
          >
            <RotateCcw size={12} />
            Reopen
          </button>
        )}
        {sandbox.status === 'active' && (
          <>
            <button
              onClick={handleSettle}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              <Check size={12} />
              Mark settled
            </button>
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Archive size={12} />
              Archive
            </button>
          </>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <BalancesSummary
          totalExpense={settlement?.totalExpense ?? 0}
          balances={settlement?.balances ?? []}
        />
        <SettleUpVisualization suggestions={settlement?.suggestions ?? []} />
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Receipt size={18} />
          Payments
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity size={18} />
          Activity
        </button>
      </div>

      {activeTab === 'payments' && (
        <div className="space-y-2">
          {payments === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-600 mb-2">No payments yet</p>
              <p className="text-sm text-gray-500 mb-4">
                {!members?.length
                  ? 'Add members to the group first.'
                  : isEditable
                    ? 'Tap the button below to add one.'
                    : 'This sandbox is read-only.'}
              </p>
              {isEditable && members && members.length > 0 && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-100 text-emerald-700 rounded-lg font-medium"
                >
                  <Plus size={18} />
                  Add payment
                </button>
              )}
            </div>
          ) : (
            payments.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200"
              >
                <div>
                  <p className="font-medium text-gray-900">{p.title}</p>
                  <p className="text-sm text-gray-500">
                    {memberMap.get(p.paidBy)} paid {formatCurrency(p.amount)} • split between{' '}
                    {p.paidFor.map((id) => memberMap.get(id)).filter(Boolean).join(', ')}
                  </p>
                </div>
                {isEditable && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(p)}
                      className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => removePayment({ id: p._id })}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <ActivityLogs logs={logs ?? []} />
      )}

      {isEditable && members && members.length > 0 && (
        <button
          onClick={() => {
            setEditingPayment(null)
            setShowPaymentForm(true)
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label="Add payment"
        >
          <Plus size={24} />
        </button>
      )}

      {showPaymentForm && members && (
        <PaymentForm
          sandboxId={sandboxIdTyped}
          groupId={groupIdTyped}
          members={members}
          onClose={closePaymentForm}
          editPayment={editingPayment ?? undefined}
        />
      )}
    </div>
  )
}
