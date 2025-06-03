import { z } from 'zod';

export const ResourceTypeEnum = z.enum(["Article", "Video", "Course", "Tool", "Documentation"]);
export type ResourceType = z.infer<typeof ResourceTypeEnum>;

export const RESOURCE_TYPES = ResourceTypeEnum.options;

export const ResourceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, { message: "Name must be at least 3 characters long." }),
  relativeUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  fullUrl: z.string().url({ message: "Please enter a valid URL." }),
  tags: z.array(z.string().min(1)).min(1, { message: "At least one tag is required." }),
  duration: z.string().optional(),
  type: ResourceTypeEnum,
  updatedDate: z.date(),
  category: z.string().min(2, { message: "Category must be at least 2 characters long." }),
  topic: z.string().min(2, { message: "Topic must be at least 2 characters long." }),
});

export type Resource = z.infer<typeof ResourceSchema>;

export type ResourceFormValues = Omit<Resource, 'id' | 'updatedDate'> & {
  id?: string;
  tags: string; // Comma-separated string for form input
};

export const ResourceFormSchema = ResourceSchema.omit({ id: true, updatedDate: true, tags: true }).extend({
  id: z.string().uuid().optional(),
  tags: z.string().min(1, { message: "Tags are required (comma-separated)." }),
});

export interface SearchFilters {
  query?: string;
  type?: ResourceType | 'All';
  category?: string;
  topic?: string;
  sortBy?: 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc';
}
