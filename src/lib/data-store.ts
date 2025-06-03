import type { Resource, SearchFilters } from './definitions';
import { RESOURCE_TYPES } from './definitions';

let resources: Resource[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    name: 'Next.js 14 Tutorial',
    relativeUrl: '',
    fullUrl: 'https://nextjs.org/learn',
    tags: ['Next.js', 'React', 'Web Development'],
    duration: '2 hours',
    type: 'Course',
    updatedDate: new Date('2023-10-15T10:00:00Z'),
    category: 'Frameworks',
    topic: 'Frontend Development',
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    name: 'Tailwind CSS Best Practices',
    relativeUrl: '',
    fullUrl: 'https://tailwindcss.com/docs/utility-first',
    tags: ['CSS', 'TailwindCSS', 'Styling'],
    duration: '45 mins',
    type: 'Article',
    updatedDate: new Date('2023-11-01T14:30:00Z'),
    category: 'Styling',
    topic: 'Web Design',
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    name: 'Lucide Icons Introduction',
    relativeUrl: '',
    fullUrl: 'https://lucide.dev/',
    tags: ['Icons', 'UI', 'Design'],
    duration: 'N/A',
    type: 'Tool',
    updatedDate: new Date('2023-09-20T09:00:00Z'),
    category: 'Design Assets',
    topic: 'UI/UX',
  },
  {
    id: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    name: 'Zod Schema Validation',
    relativeUrl: '',
    fullUrl: 'https://zod.dev/',
    tags: ['TypeScript', 'Validation', 'Data'],
    duration: '30 mins read',
    type: 'Documentation',
    updatedDate: new Date('2024-01-10T11:00:00Z'),
    category: 'Libraries',
    topic: 'Backend Development',
  },
  {
    id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
    name: 'Advanced React Patterns',
    relativeUrl: '',
    fullUrl: 'https://www.youtube.com/watch?v=exampleVideoId',
    tags: ['React', 'Patterns', 'Advanced'],
    duration: '1 hour 15 mins',
    type: 'Video',
    updatedDate: new Date('2024-02-01T16:00:00Z'),
    category: 'Frameworks',
    topic: 'Frontend Development',
  },
];

export async function getResources(filters?: SearchFilters): Promise<Resource[]> {
  let filteredResources = [...resources];

  if (filters) {
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredResources = filteredResources.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          r.category.toLowerCase().includes(query) ||
          r.topic.toLowerCase().includes(query)
      );
    }
    if (filters.type && filters.type !== 'All') {
      filteredResources = filteredResources.filter((r) => r.type === filters.type);
    }
    if (filters.category) {
      filteredResources = filteredResources.filter((r) => r.category.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters.topic) {
       filteredResources = filteredResources.filter((r) => r.topic.toLowerCase() === filters.topic?.toLowerCase());
    }
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name_asc':
          filteredResources.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name_desc':
          filteredResources.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'date_asc':
          filteredResources.sort((a, b) => a.updatedDate.getTime() - b.updatedDate.getTime());
          break;
        case 'date_desc':
          filteredResources.sort((a, b) => b.updatedDate.getTime() - a.updatedDate.getTime());
          break;
      }
    } else {
      // Default sort by most recent
      filteredResources.sort((a, b) => b.updatedDate.getTime() - a.updatedDate.getTime());
    }
  } else {
     // Default sort by most recent
     filteredResources.sort((a, b) => b.updatedDate.getTime() - a.updatedDate.getTime());
  }


  return JSON.parse(JSON.stringify(filteredResources)); // Deep copy to avoid mutation issues with Date objects
}

export async function getResourceById(id: string): Promise<Resource | undefined> {
  const resource = resources.find((r) => r.id === id);
  return resource ? JSON.parse(JSON.stringify(resource)) : undefined;
}

export async function addResource(resourceData: Omit<Resource, 'id' | 'updatedDate'>): Promise<Resource> {
  const newResource: Resource = {
    ...resourceData,
    id: crypto.randomUUID(),
    updatedDate: new Date(),
  };
  resources.unshift(newResource); // Add to the beginning for most recent
  return JSON.parse(JSON.stringify(newResource));
}

export async function updateResource(id: string, resourceUpdateData: Partial<Omit<Resource, 'id' | 'updatedDate'>>): Promise<Resource | null> {
  const resourceIndex = resources.findIndex((r) => r.id === id);
  if (resourceIndex === -1) {
    return null;
  }
  resources[resourceIndex] = {
    ...resources[resourceIndex],
    ...resourceUpdateData,
    updatedDate: new Date(),
  };
  return JSON.parse(JSON.stringify(resources[resourceIndex]));
}

export async function deleteResource(id: string): Promise<boolean> {
  const initialLength = resources.length;
  resources = resources.filter((r) => r.id !== id);
  return resources.length < initialLength;
}

export async function getDistinctCategories(): Promise<string[]> {
  const categories = new Set(resources.map(r => r.category));
  return Array.from(categories).sort();
}

export async function getDistinctTopics(): Promise<string[]> {
  const topics = new Set(resources.map(r => r.topic));
  return Array.from(topics).sort();
}
