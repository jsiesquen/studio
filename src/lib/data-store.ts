
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

const RESOURCES_COLLECTION = 'resources';

// Helper para convertir datos de Firestore a tipo Resource
const fromFirestore = (docSnapshot: any): Resource => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    name: data.name,
    relativeUrl: data.relativeUrl || '',
    fullUrl: data.fullUrl,
    tags: data.tags || [],
    duration: data.duration || '',
    type: data.type,
    updatedDate: (data.updatedDate as Timestamp).toDate(), // Convertir Timestamp a Date
    category: data.category,
    topic: data.topic,
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

  // Aplicar filtros en memoria para query de texto y tags (más complejo para Firestore directamente)
  if (filters?.query) {
    const lowerQuery = filters.query.toLowerCase();
    fetchedResources = fetchedResources.filter(
      (r) =>
        r.name.toLowerCase().includes(lowerQuery) ||
        r.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        r.category.toLowerCase().includes(lowerQuery) || // Si no se filtró por Firestore
        r.topic.toLowerCase().includes(lowerQuery) // Si no se filtró por Firestore
    );
  }
  
  // Nota: Si los filtros de category/topic fueron aplicados por Firestore,
  // la re-filtración aquí es redundante pero inofensiva.
  // Para tags con 'array-contains-any', o búsquedas de texto más complejas,
  // se necesitarían servicios externos como Algolia o funciones de Cloud.

  return fetchedResources;
}

export async function getResourceById(id: string): Promise<Resource | undefined> {
  const docRef = doc(db, RESOURCES_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return fromFirestore(docSnap);
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
  // Devolver el recurso completo con el ID generado y la fecha convertida
  return {
    ...resourceData,
    id: docRef.id,
    updatedDate: (newResourceData.updatedDate as Timestamp).toDate(),
  };
}

export async function updateResource(id: string, resourceUpdateData: Partial<Omit<Resource, 'id' | 'updatedDate'>>): Promise<Resource | null> {
  const docRef = doc(db, RESOURCES_COLLECTION, id);
  const updateData = {
    ...resourceUpdateData,
    updatedDate: Timestamp.fromDate(new Date()), // Actualizar con Timestamp de Firestore
  };
  
  // Verificar si el documento existe antes de intentar actualizarlo
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null; // O lanzar un error
  }

  await updateDoc(docRef, updateData);
  
  // Obtener el documento actualizado para devolverlo
  const updatedDocSnap = await getDoc(docRef);
  return fromFirestore(updatedDocSnap);
}

export async function deleteResource(id: string): Promise<boolean> {
  const docRef = doc(db, RESOURCES_COLLECTION, id);
  // Verificar si el documento existe antes de intentar eliminarlo
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return false; 
  }
  await deleteDoc(docRef);
  return true;
}

export async function getDistinctCategories(): Promise<string[]> {
  const resourcesCollection = collection(db, RESOURCES_COLLECTION);
  const querySnapshot = await getDocs(query(resourcesCollection)); // Obtener todos los documentos
  const categories = new Set(querySnapshot.docs.map(doc => doc.data().category as string));
  return Array.from(categories).sort();
}

export async function getDistinctTopics(): Promise<string[]> {
  const resourcesCollection = collection(db, RESOURCES_COLLECTION);
  const querySnapshot = await getDocs(query(resourcesCollection)); // Obtener todos los documentos
  const topics = new Set(querySnapshot.docs.map(doc => doc.data().topic as string));
  return Array.from(topics).sort();
}
