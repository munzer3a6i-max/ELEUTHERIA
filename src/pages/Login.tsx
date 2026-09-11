import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060b18] font-sans text-slate-200">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-[#162650] bg-[#0a142f] p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10">
          <ShieldCheck className="size-8 text-amber-500" strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-serif text-lg font-bold uppercase tracking-[1.3px] text-amber-500">Eleutheria</p>
          <p className="text-[10px] uppercase tracking-[0.4px] text-slate-400">
            International Placement Services Inc.
          </p>
        </div>
        <p className="text-sm text-slate-300">You have been logged out.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full rounded bg-amber-600 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-500"
        >
          Log Back In
        </button>
      </div>
    </div>
  )
}
