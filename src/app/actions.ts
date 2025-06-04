
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ResourceFormSchema, type Resource, type ResourceFormValues } from '@/lib/definitions';
import * as DataStore from '@/lib/data-store';

const parseTags = (tagsString: string): string[] => {
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

// Helper to prepare data for Firestore, including manual update date processing
const prepareDataForStore = (formData: ResourceFormValues) => {
  const dataToStore: any = {
    ...formData,
    tags: parseTags(formData.tags),
  };

  if (formData.manualLastUpdate && /^(0[1-9]|1[0-2])\/\d{4}$/.test(formData.manualLastUpdate)) {
    const [month, year] = formData.manualLastUpdate.split('/');
    dataToStore.manualLastUpdateString = formData.manualLastUpdate;
    dataToStore.manualLastUpdateMonth = parseInt(month, 10);
    dataToStore.manualLastUpdateYear = parseInt(year, 10);
  } else {
    // Ensure these fields are explicitly undefined or null if not provided / invalid,
    // so Firestore can remove them if they existed or not set them.
    dataToStore.manualLastUpdateString = null;
    dataToStore.manualLastUpdateMonth = null;
    dataToStore.manualLastUpdateYear = null;
  }
  // Remove the combined manualLastUpdate field as we store its parts
  delete dataToStore.manualLastUpdate;


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
