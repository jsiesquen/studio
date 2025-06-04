
import { db } from './firebase'; // Importa la instancia de Firestore
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
  orderBy as firestoreOrderBy, // Renombrado para evitar conflicto con orderBy local si existiera
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import type { Resource, SearchFilters, ResourceType } from './definitions';
import { RESOURCE_TYPES, ResourceTypeEnum } from './definitions';

const RESOURCES_COLLECTION = 'resources';

// Helper para convertir datos de Firestore a tipo Resource
const fromFirestore = (docSnapshot: any): Resource => {
  const data = docSnapshot.data() || {}; // Asegurar que data sea un objeto

  const name = data.name || 'Unnamed Resource';
  const fullUrl = data.fullUrl || 'https://example.com/invalid-url'; // Proporcionar una URL válida por defecto
  const tags = Array.isArray(data.tags) ? data.tags : [];
  
  let type: ResourceType = RESOURCE_TYPES[0]; // Default type
  const parsedType = ResourceTypeEnum.safeParse(data.type);
  if (parsedType.success) {
    type = parsedType.data;
  } else if (data.type !== undefined) { // Solo advertir si data.type existía pero era inválido
    console.warn(`Document ${docSnapshot.id} has invalid type '${data.type}'. Defaulting to '${type}'.`);
  }

  let updatedDate: Date;
  if (data.updatedDate instanceof Timestamp) {
    updatedDate = data.updatedDate.toDate();
  } else {
    if (data.updatedDate !== undefined) { // Solo advertir si existía pero era inválido
      console.warn(`Document ${docSnapshot.id} has invalid or missing updatedDate. Defaulting to epoch.`);
    }
    updatedDate = new Date(0); // Epoch como default
  }
  
  const category = data.category || 'Uncategorized';
  const topic = data.topic || 'General';
  
  if (!data.name) console.warn(`Document ${docSnapshot.id} missing name. Defaulting to '${name}'.`);
  if (!data.fullUrl) console.warn(`Document ${docSnapshot.id} missing fullUrl. Defaulting to '${fullUrl}'.`);
  if (!data.category && data.category !== undefined) console.warn(`Document ${docSnapshot.id} missing category. Defaulting to '${category}'.`);
  if (!data.topic && data.topic !== undefined) console.warn(`Document ${docSnapshot.id} missing topic. Defaulting to '${topic}'.`);

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
  };
};

export async function getResources(filters?: SearchFilters): Promise<Resource[]> {
  const qConstraints: QueryConstraint[] = [];

  // Aplicar filtros de Firestore si es posible
  if (filters?.type && filters.type !== 'All') {
    qConstraints.push(where('type', '==', filters.type));
  }
  if (filters?.category) {
    qConstraints.push(where('category', '==', filters.category));
  }
  if (filters?.topic) {
    qConstraints.push(where('topic', '==', filters.topic));
  }

  // Aplicar ordenamiento
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
  
  let fetchedResources: Resource[] = querySnapshot.docs.map(fromFirestore);

  // Aplicar filtros en memoria para query de texto
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

export async function addResource(resourceData: Omit<Resource, 'id' | 'updatedDate'>): Promise<Resource> {
  const newResourceData = {
    ...resourceData,
    updatedDate: Timestamp.fromDate(new Date()), // Usar Timestamp de Firestore
  };
  const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), newResourceData);
  
  // Para asegurar consistencia, obtenemos el documento recién creado y lo parseamos
  const newDocSnap = await getDoc(docRef);
  return fromFirestore(newDocSnap); // Usar fromFirestore para consistencia
}

export async function updateResource(id: string, resourceUpdateData: Partial<Omit<Resource, 'id' | 'updatedDate'>>): Promise<Resource | null> {
  const docRef = doc(db, RESOURCES_COLLECTION, id);
  const updateDataWithTimestamp = {
    ...resourceUpdateData,
    updatedDate: Timestamp.fromDate(new Date()),
  };
  
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null; 
  }

  await updateDoc(docRef, updateDataWithTimestamp);
  
  const updatedDocSnap = await getDoc(docRef);
  return fromFirestore(updatedDocSnap); // Usar fromFirestore para consistencia
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
