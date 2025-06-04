
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
  serverTimestamp
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
  } else if (data.type !== undefined && data.type !== null) { 
    console.warn(`Document ${docSnapshot.id} has invalid type '${data.type}'. Defaulting to '${type}'.`);
  }

  let updatedDate: Date;
  if (data.updatedDate instanceof Timestamp) {
    updatedDate = data.updatedDate.toDate();
  } else {
    if (data.updatedDate !== undefined && data.updatedDate !== null) { 
      console.warn(`Document ${docSnapshot.id} has invalid or missing updatedDate (system timestamp). Defaulting to epoch.`);
    }
    updatedDate = new Date(0); 
  }
  
  const category = data.category || 'Uncategorized';
  const topic = data.topic || 'General';
  
  if (!data.name) console.warn(`Document ${docSnapshot.id} missing name. Defaulting to '${name}'.`);
  if (!data.fullUrl) console.warn(`Document ${docSnapshot.id} missing fullUrl. Defaulting to '${fullUrl}'.`);

  let manualLastUpdateValue: string | undefined = undefined;
  if (data.manualLastUpdateString) {
    manualLastUpdateValue = data.manualLastUpdateString;
  } else if (data.manualLastUpdateMonth && data.manualLastUpdateYear) {
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
    updatedDate: updatedDate, 
    category: category,
    topic: topic,
    manualLastUpdate: manualLastUpdateValue,
  };
};

export async function getResources(filters?: SearchFilters): Promise<Resource[]> {
  const qConstraints: QueryConstraint[] = [];

  if (filters?.type && filters.type !== 'All') {
    qConstraints.push(where('type', '==', filters.type));
  }
  if (filters?.category && filters.category !== 'All') {
    qConstraints.push(where('category', '==', filters.category));
  }
  if (filters?.topic && filters.topic !== 'All') {
    qConstraints.push(where('topic', '==', filters.topic));
  }
  if (filters?.filterYear && filters.filterYear !== 'All') {
    qConstraints.push(where('manualLastUpdateYear', '==', Number(filters.filterYear)));
  }
  if (filters?.filterMonth && filters.filterMonth !== 'All') {
    qConstraints.push(where('manualLastUpdateMonth', '==', Number(filters.filterMonth)));
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

  const resourcesCollectionRef = collection(db, RESOURCES_COLLECTION);
  const q = query(resourcesCollectionRef, ...qConstraints);
  
  let fetchedResources: Resource[] = [];
  try {
    const querySnapshot = await getDocs(q);
    fetchedResources = querySnapshot.docs.map(doc => {
      try {
        return fromFirestore(doc);
      } catch (error) {
        console.error(`Error parsing document ${doc.id} in getResources:`, error);
        return null;
      }
    }).filter(resource => resource !== null) as Resource[];
  } catch (error) {
     console.error("Error fetching resources from Firestore:", error);
     // Potentially re-throw or handle as a user-facing error
     // For now, return empty array and log. Check server console for Firestore index errors.
     return [];
  }

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

export async function addResource(resourceData: Omit<Resource, 'id' | 'updatedDate' | 'manualLastUpdate'> & { manualLastUpdateString?: string | null; manualLastUpdateMonth?: number | null; manualLastUpdateYear?: number | null }): Promise<Resource> {
  const newResourceData = {
    ...resourceData,
    updatedDate: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), newResourceData);
  
  const newDocSnap = await getDoc(docRef);
  return fromFirestore(newDocSnap); 
}

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
