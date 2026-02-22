import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  ArrowLeft,
  Plus,
  Check,
  Archive,
  RotateCcw,
  Receipt,
  Activity,
  History,
} from 'lucide-react'
import BalancesSummary from '@/components/BalancesSummary'
import SettleUpVisualization from '@/components/SettleUpVisualization'
import ActivityLogs from '@/components/ActivityLogs'
import PaymentForm from '@/components/PaymentForm'
import PaymentRow from '@/components/PaymentRow'
import ImageUpload from '@/components/ImageUpload'
import { useFormatCurrency } from '@/hooks/useFormatCurrency'
import type { Doc, Id } from '@convex/_generated/dataModel'

const PAGE_SIZE = 20

export const Route = createFileRoute('/groups/$groupId/sandbox/$sandboxId')({
  component: SandboxPage,
})

function SandboxPage() {
  const { groupId, sandboxId } = Route.useParams()
  const groupIdTyped = groupId as Id<'groups'>
  const sandboxIdTyped = sandboxId as Id<'sandboxes'>
  const [activeTab, setActiveTab] = useState<'payments' | 'logs' | 'history'>('payments')
  const [search, setSearch] = useState('')
  const [filterPaidBy, setFilterPaidBy] = useState<Id<'members'> | ''>('')
  const [filterTag, setFilterTag] = useState('')
  const [sortBy, setSortBy] = useState<'amount' | 'date'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<{
    id: Id<'payments'>
    title: string
    amount: number
    paidBy: Id<'members'>
    paidFor: Id<'members'>[]
    tags?: string[]
  } | null>(null)

  const sandbox = useQuery(api.sandboxes.get, { id: sandboxIdTyped })
  const payments = useQuery(api.payments.listBySandbox, { sandboxId: sandboxIdTyped })
  const settlement = useQuery(api.settlement.getSettlement, { sandboxId: sandboxIdTyped })
  const members = useQuery(api.members.listByGroup, { groupId: groupIdTyped })
  const logs = useQuery(api.paymentLogs.listBySandbox, { sandboxId: sandboxIdTyped })
  const snapshots = useQuery(api.settlementSnapshots.listBySandbox, { sandboxId: sandboxIdTyped })
  const formatCurrency = useFormatCurrency(sandbox?.currency ?? 'USD')

  const setStatus = useMutation(api.sandboxes.setStatus)
  const reopen = useMutation(api.sandboxes.reopen)
  const updateSandboxImage = useMutation(api.sandboxes.updateImage)
  const updateCurrency = useMutation(api.sandboxes.updateCurrency)
  const removePayment = useMutation(api.payments.remove)
  const revertFromLog = useMutation(api.payments.revertFromLog)

  const isEditable = sandbox?.status === 'active'
  const memberMap = new Map(members?.map((m) => [m._id, m.name]) ?? [])

  const filteredSortedPayments = useMemo(() => {
    if (!payments) return []
    let result = [...payments]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.title.toLowerCase().includes(q))
    }
    if (filterPaidBy) {
      result = result.filter((p) => p.paidBy === filterPaidBy)
    }
    if (filterTag) {
      result = result.filter((p) => p.tags?.includes(filterTag))
    }
    result.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'amount') return mul * (a.amount - b.amount)
      return mul * (a.updatedAt - b.updatedAt)
    })
    return result
  }, [payments, search, filterPaidBy, filterTag, sortBy, sortDir])

  const paginatedPayments = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredSortedPayments.slice(start, start + PAGE_SIZE)
  }, [filteredSortedPayments, page])

  const totalPages = Math.ceil(filteredSortedPayments.length / PAGE_SIZE)
  const allTags = useMemo(() => {
    const set = new Set<string>()
    payments?.forEach((p) => p.tags?.forEach((t) => set.add(t)))
    return Array.from(set)
  }, [payments])

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
      tags: p.tags,
    })
    setShowPaymentForm(true)
  }

  const closePaymentForm = () => {
    setShowPaymentForm(false)
    setEditingPayment(null)
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/groups/$groupId"
          params={{ groupId }}
          className="p-2 -m-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Link>
        <ImageUpload
          storageId={sandbox.imageStorageId}
          onUploaded={(id) => updateSandboxImage({ id: sandboxIdTyped, imageStorageId: id })}
          size="md"
          shape="square"
          readOnly={!isEditable}
        />
        <h1 className="text-xl font-semibold text-gray-900 truncate flex-1">{sandbox.name}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {isEditable && (
          <select
            value={sandbox.currency}
            onChange={(e) => updateCurrency({ id: sandboxIdTyped, currency: e.target.value })}
            className="px-2 py-1 rounded-lg border border-gray-300 text-xs font-medium bg-white"
          >
            {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'MAD', 'AED'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
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
          expensesPerMember={settlement?.expensesPerMember ?? []}
          formatCurrency={formatCurrency}
        />
        <SettleUpVisualization
          suggestions={settlement?.suggestions ?? []}
          formatCurrency={formatCurrency}
        />
      </div>

      <div className="sticky top-14 z-10 -mx-4 px-4 py-3 bg-gray-50 border-b border-gray-200 -mt-4 mb-4">
        {isEditable && members && members.length > 0 && (
          <button
            onClick={() => {
              setEditingPayment(null)
              setShowPaymentForm(true)
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
          >
            <Plus size={20} />
            Add payment
          </button>
        )}
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
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={18} />
          History
        </button>
      </div>

      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search payments..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
            <select
              value={filterPaidBy}
              onChange={(e) => {
                setFilterPaidBy(e.target.value as Id<'members'>)
                setPage(0)
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option value="">All payers</option>
              {members?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={filterTag}
              onChange={(e) => {
                setFilterTag(e.target.value)
                setPage(0)
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => setSortBy(sortBy === 'amount' ? 'date' : 'amount')}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
              >
                Sort: {sortBy}
              </button>
              <button
                onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
              >
                {sortDir}
              </button>
            </div>
          </div>
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
            <>
              <div className="space-y-2">
                {paginatedPayments.map((p) => {
                  const payer = members?.find((m) => m._id === p.paidBy)
                  return (
                    <PaymentRow
                      key={p._id}
                      payment={p}
                      memberName={memberMap.get(p.paidBy) ?? 'Unknown'}
                      memberImageStorageId={payer?.imageStorageId}
                      paidForNames={p.paidFor.map((id) => memberMap.get(id) ?? '')}
                      formatCurrency={formatCurrency}
                      isEditable={isEditable}
                      onEdit={() => openEditForm(p)}
                      onDelete={() => removePayment({ id: p._id })}
                    />
                  )
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="py-2 text-sm text-gray-600">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <ActivityLogs
          logs={logs ?? []}
          isEditable={isEditable}
          onUndo={(logId) => revertFromLog({ logId })}
        />
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {snapshots?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No settlement history yet</p>
          ) : (
            snapshots?.map((snap) => (
              <div
                key={snap._id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(snap._creationTime).toLocaleString()} • {snap.triggeredBy}
                </p>
                <p className="font-semibold text-emerald-600">
                  {formatCurrency(snap.totalExpense)} total
                </p>
              </div>
            ))
          )}
        </div>
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
