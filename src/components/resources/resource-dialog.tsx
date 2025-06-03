'use client';

import type { Resource, ResourceFormValues } from '@/lib/definitions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResourceForm } from './resource-form';

interface ResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ResourceFormValues) => Promise<void>;
  initialData?: Resource | null;
  isSubmitting: boolean;
}

export function ResourceDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
}: ResourceDialogProps) {
  const dialogTitle = initialData ? 'Edit Resource' : 'Create New Resource';
  const dialogDescription = initialData
    ? 'Update the details of your resource.'
    : 'Fill in the form below to add a new resource to the hub.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <ResourceForm
          onSubmit={onSubmit}
          initialData={initialData}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
