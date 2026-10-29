import { Search, X } from 'lucide-react';
export default function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (<label className="relative block min-w-0 flex-1 sm:max-w-sm">
    <span className="sr-only">{placeholder}</span>
    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden" />
    {value && <button type="button" onClick={() => onChange('')} aria-label="clear" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 animate-scale-in place-items-center rounded-full text-muted hover:bg-gray-light"><X className="h-4 w-4" /></button>}
  </label>);
}
