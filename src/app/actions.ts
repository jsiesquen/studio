
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Resource, ResourceFormValues, ResourceType } from '@/lib/definitions';
import { ResourceFormSchema } from '@/lib/definitions';
import * as DataStore from '@/lib/data-store';
import { scrapeResource, type ScrapeResourceOutput } from '@/ai/flows/scrape-resource-flow';

const parseTags = (tagsString: string): string[] => {
  if (!tagsString || typeof tagsString !== 'string') {
    return [];
  }
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

// Interfaz para los datos que se envían a Firestore (para creación o actualización)
// No incluye 'id' ni 'updatedDate' ya que se manejan por separado o con serverTimestamp.
// El 'manualLastUpdate' original del formulario se transforma.
interface StorableResourceData {
  name: string;
  relativeUrl: string | null;
  fullUrl: string;
  tags: string[];
  duration: string | null;
  type: ResourceType;
  category: string;
  topic: string;
  manualLastUpdateString: string | null;
  manualLastUpdateMonth: number | null;
  manualLastUpdateYear: number | null;
}

// Helper to prepare data for Firestore, including manual update date processing
const prepareDataForStore = (formData: ResourceFormValues): StorableResourceData => {
  const dataToStore: StorableResourceData = {
    name: formData.name,
    relativeUrl: formData.relativeUrl || null,
    fullUrl: formData.fullUrl,
    tags: parseTags(formData.tags),
    duration: formData.duration || null,
    type: formData.type,
    category: formData.category,
    topic: formData.topic,
    // Inicializar campos de manualLastUpdate
    manualLastUpdateString: null,
    manualLastUpdateMonth: null,
    manualLastUpdateYear: null,
  };

  if (formData.manualLastUpdate && /^(0[1-9]|1[0-2])\/\d{4}$/.test(formData.manualLastUpdate)) {
    const [month, year] = formData.manualLastUpdate.split('/');
    dataToStore.manualLastUpdateString = formData.manualLastUpdate;
    dataToStore.manualLastUpdateMonth = parseInt(month, 10);
    dataToStore.manualLastUpdateYear = parseInt(year, 10);
  }
  
  return dataToStore;
};


export async function createResourceAction(formData: ResourceFormValues) {
  const validatedFields = ResourceFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Could not create resource.',
    };
  }

  try {
    const dataToStore = prepareDataForStore(validatedFields.data);
    await DataStore.addResource(dataToStore);
    revalidatePath('/');
    return { message: 'Resource created successfully.' };
  } catch (error) {
    console.error("Error creating resource:", error);
    return { message: 'Database Error: Failed to create resource.' };
  }
}

export async function updateResourceAction(id: string, formData: ResourceFormValues) {
  const validatedFields = ResourceFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Could not update resource.',
    };
  }
  
  try {
    const dataToStore = prepareDataForStore(validatedFields.data);
    const updatedResource = await DataStore.updateResource(id, dataToStore);
    if (!updatedResource) {
      return { message: 'Resource not found.' };
    }
    revalidatePath('/');
    return { message: 'Resource updated successfully.' };
  } catch (error) {
    console.error("Error updating resource:", error);
    return { message: 'Database Error: Failed to update resource.' };
  }
}

export async function deleteResourceAction(id: string) {
  try {
    const success = await DataStore.deleteResource(id);
    if (!success) {
      return { message: 'Resource not found or already deleted.' };
    }
    revalidatePath('/');
    return { message: 'Resource deleted successfully.' };
  } catch (error) {
    console.error("Error deleting resource:", error);
    return { message: 'Database Error: Failed to delete resource.' };
  }
}

export async function getResourcesAction(filters?: any) {
  try {
    return await DataStore.getResources(filters);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return []; 
  }
}

export async function getResourceByIdAction(id: string) {
   try {
    return await DataStore.getResourceById(id);
  } catch (error)
    {
    console.error("Error fetching resource by ID:", error);
    return undefined;
  }
}

export async function getFilterOptionsAction() {
  try {
    const categories = await DataStore.getDistinctCategories();
    const topics = await DataStore.getDistinctTopics();
    return { categories, topics };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return { categories: [], topics: [] };
  }
}

export async function scrapeResourceAction(url: string, name: string): Promise<{ success: boolean; data?: ScrapeResourceOutput; message?: string; }> {
  if (!url || !name) {
    return { success: false, message: 'URL and name are required for scraping.' };
  }
  
  try {
    const scrapedData = await scrapeResource({ url, name });
    // Check if the model returned any data at all
    if (!scrapedData.duration && !scrapedData.manualLastUpdate) {
        return { success: false, message: 'Could not extract any new information from the resource.' };
    }
    return { success: true, data: scrapedData };
  } catch (error) {
    console.error("Error scraping resource:", error);
    return { success: false, message: 'An unexpected error occurred during the scraping process.' };
  }
}
