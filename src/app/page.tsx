
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { PlusCircle, AlertTriangle, Loader2 } from 'lucide-react';
import type { Resource, ResourceFormValues, SearchFilters, ResourceType } from '@/lib/definitions';
import { RESOURCE_TYPES } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { ResourceCard } from '@/components/resources/resource-card';
import { ResourceDialog } from '@/components/resources/resource-dialog';
import { FilterControls } from '@/components/resources/filter-controls';
import {
  createResourceAction,
  deleteResourceAction,
  getResourcesAction,
  updateResourceAction,
  getFilterOptionsAction
} from './actions';

export default function HomePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const { toast } = useToast();

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'All',
    sortBy: 'date_desc',
  });

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  const fetchResources = async (currentFilters: SearchFilters) => {
    setIsLoading(true);
    try {
      const fetchedResources = await getResourcesAction(currentFilters);
      setResources(fetchedResources);
    } catch (error) {
      toast({ title: 'Error fetching resources', description: String(error), variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await getFilterOptionsAction();
      setAvailableCategories(options.categories);
      setAvailableTopics(options.topics);
    } catch (error) {
      toast({ title: 'Error fetching filter options', description: String(error), variant: 'destructive' });
    }
  }

  useEffect(() => {
    fetchResources(filters);
    fetchFilterOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);


  const handleFiltersChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleOpenDialog = (resource?: Resource) => {
    setEditingResource(resource || null);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (values: ResourceFormValues) => {
    startSubmitTransition(async () => {
      try {
        const actionToTake = editingResource ? updateResourceAction : createResourceAction;
        let result;

        if (editingResource && editingResource.id) {
          result = await actionToTake(editingResource.id, values);
        } else if (!editingResource) {
          result = await actionToTake(values); // For createResourceAction
        } else {
          // This case should ideally not happen if a resource is being edited.
          console.error("Attempting to update resource without an ID.", editingResource);
          toast({
            title: "Error Updating Resource",
            description: "Cannot update resource: Critical information missing (ID).",
            variant: 'destructive',
          });
          return; // Exit early
        }

        if (result.message.includes('successfully')) {
          toast({
            title: editingResource ? 'Resource Updated' : 'Resource Created',
            description: result.message
          });
          setIsDialogOpen(false);
          setEditingResource(null);
          fetchResources(filters);
          fetchFilterOptions();
        } else {
          let errorDetails = '';
          if (result.errors) {
            errorDetails = Object.entries(result.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? (messages as string[]).join(', ') : String(messages)}`)
              .join('; ');
          }
          toast({
            title: `Error ${editingResource ? 'updating' : 'creating'} resource`,
            description: result.message + (errorDetails ? ` Details: ${errorDetails}` : ''),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error("Unexpected error during form submission:", error);
        toast({
          title: "An Unexpected Error Occurred",
          description: "Please try again. If the problem persists, contact support.",
          variant: 'destructive',
        });
      }
    });
  };

  const handleDeleteResource = (id: string) => {
    startSubmitTransition(async () => {
      const result = await deleteResourceAction(id);
      if (result.message.includes('successfully')) {
        toast({ title: 'Resource Deleted', description: result.message });
        fetchResources(filters);
        fetchFilterOptions();
      } else {
        toast({ title: 'Error deleting resource', description: result.message, variant: 'destructive' });
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-headline text-3xl font-semibold">Discover Resources</h1>
          <Button onClick={() => handleOpenDialog()} size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Resource
          </Button>
        </div>

        <FilterControls
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableCategories={availableCategories}
          availableTopics={availableTopics}
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-10 bg-card rounded-lg shadow">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Resources Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or add new resources to the hub.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={() => handleOpenDialog(resource)}
                onDelete={handleDeleteResource}
              />
            ))}
          </div>
        )}
      </main>

      <ResourceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleFormSubmit}
        initialData={editingResource}
        isSubmitting={isSubmitting}
      />
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} Resource Hub. All rights reserved.
      </footer>
    </div>
  );
}
