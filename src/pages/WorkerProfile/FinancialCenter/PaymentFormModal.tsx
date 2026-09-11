import { useState } from 'react'
import Modal from '../../../components/Modal'
import { Field, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../../../components/form'
import type { IncomePayment } from '../../../types'

export default function PaymentFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: IncomePayment
  onClose: () => void
  onSubmit: (data: Omit<IncomePayment, 'id'>) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const [type, setType] = useState(initial?.type ?? 'Bank Transfer')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [receiptName, setReceiptName] = useState(initial?.receiptName ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !amount) return
    onSubmit({
      name: name.trim(),
      date,
      type,
      amount: Number(amount),
      receiptName: receiptName.trim() || 'no_receipt.pdf',
    })
  }

  return (
    <Modal title={initial ? 'Edit Payment' : 'Add Payment'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Payment Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Payment Type">
            <SelectInput value={type} onChange={(e) => setType(e.target.value)}>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Cheque</option>
              <option>Online Payment</option>
            </SelectInput>
          </Field>
        </div>
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
        <div className="mt-2 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">{initial ? 'Save Changes' : 'Add Payment'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
