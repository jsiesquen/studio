'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Resource, ResourceFormValues } from '@/lib/definitions';
import { ResourceFormSchema, RESOURCE_TYPES } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '../ui/scroll-area';

interface ResourceFormProps {
  onSubmit: (values: ResourceFormValues) => Promise<void>;
  initialData?: Resource | null;
  isSubmitting: boolean;
}

export function ResourceForm({ onSubmit, initialData, isSubmitting }: ResourceFormProps) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(ResourceFormSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || '',
      relativeUrl: initialData?.relativeUrl || '',
      fullUrl: initialData?.fullUrl || '',
      tags: initialData?.tags?.join(', ') || '',
      duration: initialData?.duration || '',
      type: initialData?.type || RESOURCE_TYPES[0],
      category: initialData?.category || '',
      topic: initialData?.topic || '',
      manualLastUpdate: initialData?.manualLastUpdate || '',
    },
  });

  async function handleSubmit(values: ResourceFormValues) {
    await onSubmit(values);
    // if (!initialData) form.reset(); // Keep form populated for potential edits after failed submit
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] pr-4"> 
        <div className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Awesome Next.js Guide" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/resource" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="relativeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relative URL (Optional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="/docs/resource" {...field} />
              </FormControl>
              <FormDescription>Only if applicable, e.g., for internal documentation.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input placeholder="react, typescript, webdev (comma-separated)" {...field} />
              </FormControl>
              <FormDescription>Enter tags separated by commas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resource type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 30 mins, 1 week" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Frameworks, Design Tools" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Frontend, UI/UX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="manualLastUpdate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manual Last Update (MM/YYYY, Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="MM/YYYY" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>The month and year the resource content was last updated.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        </ScrollArea>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Resource' : 'Create Resource')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
