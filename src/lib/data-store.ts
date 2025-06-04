
import { db } from './firebase'; 
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy as firestoreOrderBy, 
  Timestamp,
  QueryConstraint,
  serverTimestamp // Import for server-side timestamp updates
} from 'firebase/firestore';
import type { Resource, SearchFilters, ResourceType } from './definitions';
import { RESOURCE_TYPES, ResourceTypeEnum } from './definitions';

const RESOURCES_COLLECTION = 'resources';

const fromFirestore = (docSnapshot: any): Resource => {
  const data = docSnapshot.data() || {}; 

  const name = data.name || 'Unnamed Resource';
  const fullUrl = data.fullUrl || 'https://example.com/invalid-url'; 
  const tags = Array.isArray(data.tags) ? data.tags : [];
  
  let type: ResourceType = RESOURCE_TYPES[0]; 
  const parsedType = ResourceTypeEnum.safeParse(data.type);
  if (parsedType.success) {
    type = parsedType.data;
  } else if (data.type !== undefined) { 
    console.warn(`Document ${docSnapshot.id} has invalid type '${data.type}'. Defaulting to '${type}'.`);
  }

  let updatedDate: Date;
  if (data.updatedDate instanceof Timestamp) {
    updatedDate = data.updatedDate.toDate();
  } else {
    if (data.updatedDate !== undefined) { 
      console.warn(`Document ${docSnapshot.id} has invalid or missing updatedDate (system timestamp). Defaulting to epoch.`);
    }
    updatedDate = new Date(0); 
  }
  
  const category = data.category || 'Uncategorized';
  const topic = data.topic || 'General';
  
  if (!data.name) console.warn(`Document ${docSnapshot.id} missing name. Defaulting to '${name}'.`);
  if (!data.fullUrl) console.warn(`Document ${docSnapshot.id} missing fullUrl. Defaulting to '${fullUrl}'.`);
  // No warning for missing category/topic if undefined, as they might be intentionally omitted.
  // if (!data.category && data.category !== undefined) console.warn(`Document ${docSnapshot.id} missing category. Defaulting to '${category}'.`);
  // if (!data.topic && data.topic !== undefined) console.warn(`Document ${docSnapshot.id} missing topic. Defaulting to '${topic}'.`);

  // Reconstruct manualLastUpdate from stored parts if they exist
  let manualLastUpdateValue: string | undefined = undefined;
  if (data.manualLastUpdateString) {
    manualLastUpdateValue = data.manualLastUpdateString;
  } else if (data.manualLastUpdateMonth && data.manualLastUpdateYear) {
    // Fallback if only month/year parts exist (less likely with current save logic)
    const monthStr = String(data.manualLastUpdateMonth).padStart(2, '0');
    manualLastUpdateValue = `${monthStr}/${data.manualLastUpdateYear}`;
  }


  return {
    id: docSnapshot.id,
    name: name,
    relativeUrl: data.relativeUrl || '',
    fullUrl: fullUrl,
    tags: tags,
    duration: data.duration || '',
    type: type,
    updatedDate: updatedDate, // System-generated timestamp
    category: category,
    topic: topic,
    manualLastUpdate: manualLastUpdateValue, // User-provided MM/YYYY
  };
};

export async function getResources(filters?: SearchFilters): Promise<Resource[]> {
  const qConstraints: QueryConstraint[] = [];

  if (filters?.type && filters.type !== 'All') {
    qConstraints.push(where('type', '==', filters.type));
  }
  if (filters?.category) {
    qConstraints.push(where('category', '==', filters.category));
  }
  if (filters?.topic) {
    qConstraints.push(where('topic', '==', filters.topic));
  }

  let sortByField = 'updatedDate';
  let sortDirection: 'asc' | 'desc' = 'desc';

  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'name_asc':
        sortByField = 'name';
        sortDirection = 'asc';
        break;
      case 'name_desc':
        sortByField = 'name';
        sortDirection = 'desc';
        break;
      case 'date_asc':
        sortByField = 'updatedDate';
        sortDirection = 'asc';
        break;
      case 'date_desc':
        sortByField = 'updatedDate';
        sortDirection = 'desc';
        break;
    }
  }
  qConstraints.push(firestoreOrderBy(sortByField, sortDirection));

  const resourcesCollection = collection(db, RESOURCES_COLLECTION);
  const q = query(resourcesCollection, ...qConstraints);
  const querySnapshot = await getDocs(q);
  
  let fetchedResources: Resource[] = querySnapshot.docs.map(doc => {
    try {
      return fromFirestore(doc);
    } catch (error) {
      console.error(`Error parsing document ${doc.id} in getResources:`, error);
      // Return a placeholder or skip if critical fields are missing,
      // or ensure fromFirestore handles this gracefully.
      // For now, we'll let it propagate if fromFirestore throws, or filter out if it returns undefined.
      return null;
    }
  }).filter(resource => resource !== null) as Resource[];


  if (filters?.query) {
    const lowerQuery = filters.query.toLowerCase();
    fetchedResources = fetchedResources.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(lowerQuery)) ||
        (r.tags && r.tags.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes(lowerQuery))) ||
        (r.category && r.category.toLowerCase().includes(lowerQuery)) ||
        (r.topic && r.topic.toLowerCase().includes(lowerQuery))
    );
  }
  
  return fetchedResources;
}

export async function getResourceById(id: string): Promise<Resource | undefined> {
  const docRef = doc(db, RESOURCES_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    try {
      return fromFirestore(docSnap);
    } catch (error) {
      console.error(`Error parsing document ${id} from Firestore:`, error);
      return undefined;
    }
  } else {
    return undefined;
  }
}

// The resourceData here is expected to be prepared by the action, including manualLastUpdateString/Month/Year
export async function addResource(resourceData: Omit<Resource, 'id' | 'updatedDate' | 'manualLastUpdate'> & { manualLastUpdateString?: string; manualLastUpdateMonth?: number; manualLastUpdateYear?: number }): Promise<Resource> {
  const newResourceData = {
    ...resourceData,
    updatedDate: serverTimestamp(), // Use serverTimestamp for system update
  };
  const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), newResourceData);
  
  const newDocSnap = await getDoc(docRef);
  // Wait for server timestamp to be applied, or read it back (might be null initially if read immediately)
  // For simplicity, we re-fetch. For optimization, could construct locally if serverTimestamp behavior is well-understood.
  return fromFirestore(newDocSnap); 
}

// resourceUpdateData is also expected to be prepared by the action
export async function updateResource(id: string, resourceUpdateData: Partial<Omit<Resource, 'id' | 'updatedDate' | 'manualLastUpdate'> & { manualLastUpdateString?: string | null; manualLastUpdateMonth?: number | null; manualLastUpdateYear?: number | null }>): Promise<Resource | null> {
  const docRef = doc(db, RESOURCES_COLLECTION, id);
  const updateDataWithTimestamp = {
    ...resourceUpdateData,
    updatedDate: serverTimestamp(),
  };
  
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null; 
  }

  await updateDoc(docRef, updateDataWithTimestamp);
  
  const updatedDocSnap = await getDoc(docRef);
  return fromFirestore(updatedDocSnap); 
}

export async function deleteResource(id: string): Promise<boolean> {
  const docRef = doc(db, RESOURCES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return false; 
  }
  await deleteDoc(docRef);
  return true;
}

export async function getDistinctCategories(): Promise<string[]> {
  const resourcesCollection = collection(db, RESOURCES_COLLECTION);
  const querySnapshot = await getDocs(query(resourcesCollection)); 
  const categories = new Set<string>();
  querySnapshot.docs.forEach(doc => {
    const category = doc.data().category;
    if (typeof category === 'string' && category.trim() !== '') {
      categories.add(category);
    }
  });
  return Array.from(categories).sort();
}

export async function getDistinctTopics(): Promise<string[]> {
  const resourcesCollection = collection(db, RESOURCES_COLLECTION);
  const querySnapshot = await getDocs(query(resourcesCollection)); 
  const topics = new Set<string>();
  querySnapshot.docs.forEach(doc => {
    const topic = doc.data().topic;
    if (typeof topic === 'string' && topic.trim() !== '') {
      topics.add(topic);
    }
  });
  return Array.from(topics).sort();
}
