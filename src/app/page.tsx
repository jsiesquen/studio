
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
import { ScrapeResultDialog } from '@/components/resources/scrape-result-dialog';
import { FilterControls } from '@/components/resources/filter-controls';
import {
  createResourceAction,
  deleteResourceAction,
  getResourcesAction,
  updateResourceAction,
  getFilterOptionsAction,
  scrapeResourceAction,
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

  // State for scraping
  const [scrapingResourceId, setScrapingResourceId] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<{ duration?: string; manualLastUpdate?: string } | null>(null);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);

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
        const isUpdating = !!(editingResource && editingResource.id);
        const actionToTake = isUpdating ? updateResourceAction : createResourceAction;
        let result;
  
        if (isUpdating && values.id) {
          result = await updateResourceAction(values.id, values);
        } else if (!isUpdating) {
          result = await createResourceAction(values);
        } else {
          toast({
            title: "Error Updating Resource",
            description: "Cannot update resource: Critical information missing (ID).",
            variant: 'destructive',
          });
          return;
        }
  
        toast({
          title: result.message.includes('successfully') ? (isUpdating ? 'Resource Updated' : 'Resource Created') : 'Action Failed',
          description: result.message,
          variant: result.message.includes('successfully') ? 'default' : 'destructive',
        });
  
        if (result.message.includes('successfully')) {
          setIsDialogOpen(false);
          setEditingResource(null);
          fetchResources(filters);
          fetchFilterOptions();
        } else if (result.errors) {
            const errorDetails = Object.entries(result.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? (messages as string[]).join(', ') : String(messages)}`)
              .join('; ');
            toast({
              title: `Error ${isUpdating ? 'updating' : 'creating'} resource`,
              description: result.message + (errorDetails ? ` Details: ${errorDetails}` : ''),
              variant: 'destructive',
            });
        }
      } catch (error) {
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

  const handleScrape = async (resource: Resource) => {
    if (!resource.id) return;
    setScrapingResourceId(resource.id);
    setEditingResource(resource); 
    try {
      const result = await scrapeResourceAction(resource.fullUrl, resource.name);
      if (result.success && result.data) {
        setScrapedData(result.data);
        setIsScrapeModalOpen(true);
      } else {
        toast({ title: 'Analysis Failed', description: result.message || 'Could not find new information.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred during analysis.', variant: 'destructive' });
    } finally {
      setScrapingResourceId(null);
    }
  };

  const handleScrapeConfirm = () => {
    if (!editingResource || !scrapedData) {
      toast({ title: "Error", description: "No resource or scraped data to update.", variant: "destructive" });
      return;
    }

    const formValues: ResourceFormValues = {
        id: editingResource.id,
        name: editingResource.name,
        relativeUrl: editingResource.relativeUrl,
        fullUrl: editingResource.fullUrl,
        tags: editingResource.tags.join(', '),
        type: editingResource.type,
        category: editingResource.category,
        topic: editingResource.topic,
        duration: scrapedData.duration ?? editingResource.duration,
        manualLastUpdate: scrapedData.manualLastUpdate ?? editingResource.manualLastUpdate,
    };
    
    handleFormSubmit(formValues);
    setIsScrapeModalOpen(false);
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
                onScrape={handleScrape}
                isScraping={scrapingResourceId === resource.id}
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

      <ScrapeResultDialog
        open={isScrapeModalOpen}
        onOpenChange={setIsScrapeModalOpen}
        onConfirm={handleScrapeConfirm}
        scrapedData={scrapedData}
        isSubmitting={isSubmitting}
      />

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} Resource Hub. All rights reserved.
      </footer>
    </div>
  );
}
