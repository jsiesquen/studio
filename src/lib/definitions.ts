
import { z } from 'zod';

export const ResourceTypeEnum = z.enum(["Article", "Video", "Course", "Tool", "Documentation"]);
export type ResourceType = z.infer<typeof ResourceTypeEnum>;

export const RESOURCE_TYPES = ResourceTypeEnum.options;

const manualLastUpdateRegex = /^(0[1-9]|1[0-2])\/\d{4}$/; // MM/YYYY format

export const ResourceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, { message: "Name must be at least 3 characters long." }),
  relativeUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  fullUrl: z.string().url({ message: "Please enter a valid URL." }),
  tags: z.array(z.string().min(1)).min(1, { message: "At least one tag is required." }),
  duration: z.string().optional(),
  type: ResourceTypeEnum,
  updatedDate: z.date(), // System-generated update timestamp
  category: z.string().min(2, { message: "Category must be at least 2 characters long." }),
  topic: z.string().min(2, { message: "Topic must be at least 2 characters long." }),
  manualLastUpdate: z.string().regex(manualLastUpdateRegex, { message: "Format must be MM/YYYY" }).optional().or(z.literal('')),
  // Fields for Firestore storage, not directly in Resource type for UI, but used in actions/data-store
  manualLastUpdateString: z.string().optional().nullable(),
  manualLastUpdateMonth: z.number().int().min(1).max(12).optional().nullable(),
  manualLastUpdateYear: z.number().int().min(1900).max(2100).optional().nullable(),
});

// Base type for UI and general use, excludes specific storage fields
export type Resource = Omit<z.infer<typeof ResourceSchema>, 'manualLastUpdateString' | 'manualLastUpdateMonth' | 'manualLastUpdateYear'>;

// Type for form values, includes the direct user input for manualLastUpdate
export type ResourceFormValues = Omit<Resource, 'id' | 'updatedDate' | 'tags'> & {
  id?: string;
  tags: string; // Comma-separated string for form input
  manualLastUpdate?: string; // User input MM/YYYY
};

// Zod schema for form validation
export const ResourceFormSchema = ResourceSchema.pick({
  name: true,
  relativeUrl: true,
  fullUrl: true,
  duration: true,
  type: true,
  category: true,
  topic: true,
  manualLastUpdate: true, // Validate user input format
}).extend({
  id: z.string().uuid().optional(),
  tags: z.string().min(1, { message: "Tags are required (comma-separated)." }),
});


export interface SearchFilters {
  query?: string;
  type?: ResourceType | 'All';
  category?: string;
  topic?: string;
  sortBy?: 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc';
  filterYear?: number | 'All';
  filterMonth?: number | 'All';
}
