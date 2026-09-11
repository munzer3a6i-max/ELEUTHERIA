import { useState } from 'react'
import Modal from '../../../components/Modal'
import { Field, TextInput, PrimaryButton, SecondaryButton } from '../../../components/form'
import type { ExpenseRow } from '../../../types'

export default function ExpenseFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string
  initial?: Partial<Omit<ExpenseRow, 'id'>>
  onClose: () => void
  onSubmit: (data: Omit<ExpenseRow, 'id'>) => void
}) {
  const [stage, setStage] = useState(initial?.stage ?? '')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(initial?.category ?? '')
  const [reference, setReference] = useState(initial?.reference ?? '')
  const [amount, setAmount] = useState(initial?.amount !== undefined ? String(initial.amount) : '')
  const [paid, setPaid] = useState(initial?.paid ?? true)
  const [receiptName, setReceiptName] = useState(initial?.receiptName ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stage.trim() || !amount) return
    onSubmit({
      stage: stage.trim(),
      date,
      category: category.trim(),
      reference: reference.trim(),
      amount: Number(amount),
      paid,
      receiptName: receiptName.trim() || 'no_receipt.pdf',
    })
  }

  const isEditing = initial?.amount !== undefined

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Stage / Description">
          <TextInput value={stage} onChange={(e) => setStage(e.target.value)} required autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Category">
            <TextInput value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
        </div>
        <Field label="Reference / To">
          <TextInput value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (SAR)">
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
          <Field label="Receipt filename">
            <TextInput value={receiptName} onChange={(e) => setReceiptName(e.target.value)} placeholder="receipt.pdf" />
          </Field>
        </div>
        <label className="mb-3 flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
          Marked as paid
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">{isEditing ? 'Save Changes' : 'Add Expense'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
