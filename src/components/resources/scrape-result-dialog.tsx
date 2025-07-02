'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ScrapeResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  scrapedData: {
    duration?: string;
    manualLastUpdate?: string;
  } | null;
  isSubmitting: boolean;
}

export function ScrapeResultDialog({ open, onOpenChange, onConfirm, scrapedData, isSubmitting }: ScrapeResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Analysis Results</DialogTitle>
          <DialogDescription>
            We found the following information. Would you like to update the resource?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {scrapedData?.duration && (
            <div className="grid grid-cols-3 items-center gap-4">
              <p className="text-right font-medium text-muted-foreground">Duration</p>
              <p className="col-span-2 rounded-md bg-muted px-3 py-1 text-sm">{scrapedData.duration}</p>
            </div>
          )}
          {scrapedData?.manualLastUpdate && (
            <div className="grid grid-cols-3 items-center gap-4">
              <p className="text-right font-medium text-muted-foreground">Last Update</p>
              <p className="col-span-2 rounded-md bg-muted px-3 py-1 text-sm">{scrapedData.manualLastUpdate}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Updating...' : 'Update Resource'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
