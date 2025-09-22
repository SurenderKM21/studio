import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

const densityInfo = [
  { color: 'bg-green-500', label: 'Free' },
  { color: 'bg-yellow-500', label: 'Moderate' },
  { color: 'bg-orange-500', label: 'Crowded' },
  { color: 'bg-red-500', label: 'Over-crowded' },
];

export function DensityLegend() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Legend</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="p-2 space-y-2">
            <p className="font-bold">Crowd Density</p>
            {densityInfo.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
