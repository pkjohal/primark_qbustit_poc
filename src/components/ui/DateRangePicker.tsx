import { format } from 'date-fns';

interface DateRangePickerProps {
  from: Date;
  to: Date;
  onChange: (from: Date, to: Date) => void;
}

function toInputValue(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export default function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-mid-grey uppercase tracking-wide font-medium">From</label>
        <input
          type="date"
          value={toInputValue(from)}
          max={toInputValue(to)}
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onChange(d, to);
          }}
          className="px-3 py-2 border border-border-grey rounded-lg text-sm text-charcoal focus:outline-none focus:border-primark-blue"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-mid-grey uppercase tracking-wide font-medium">To</label>
        <input
          type="date"
          value={toInputValue(to)}
          min={toInputValue(from)}
          max={toInputValue(new Date())}
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onChange(from, d);
          }}
          className="px-3 py-2 border border-border-grey rounded-lg text-sm text-charcoal focus:outline-none focus:border-primark-blue"
        />
      </div>
    </div>
  );
}
