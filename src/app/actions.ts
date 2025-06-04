
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ResourceSchema, type Resource, type ResourceFormValues } from '@/lib/definitions';
import * as DataStore from '@/lib/data-store';

const parseTags = (tagsString: string): string[] => {
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

export async function createResourceAction(formData: ResourceFormValues) {
  const validatedFields = ResourceSchema.omit({id: true, updatedDate: true}).safeParse({
    ...formData,
    tags: parseTags(formData.tags),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Could not create resource.',
    };
  }

  try {
    await DataStore.addResource(validatedFields.data);
    revalidatePath('/');
    return { message: 'Resource created successfully.' };
  } catch (error) {
    console.error("Error creating resource:", error);
    return { message: 'Database Error: Failed to create resource.' };
  }
}

export async function updateResourceAction(id: string, formData: ResourceFormValues) {
  const validatedFields = ResourceSchema.omit({id: true, updatedDate: true}).safeParse({
    ...formData,
    tags: parseTags(formData.tags),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Could not update resource.',
    };
  }
  
  try {
    const updatedResource = await DataStore.updateResource(id, validatedFields.data);
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
    return []; // Devuelve un array vacío en caso de error para que la UI no se rompa
  }
}

export async function getResourceByIdAction(id: string) {
   try {
    return await DataStore.getResourceById(id);
  } catch (error) {
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
