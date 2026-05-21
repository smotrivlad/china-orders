import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, Props>(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {props.required && <span className="ml-1 text-red-500">*</span>}
    </label>
    <textarea
      ref={ref}
      rows={4}
      className={cn(
        'rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors resize-none',
        error
          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
          : 'border-gray-300 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'
export default Textarea
