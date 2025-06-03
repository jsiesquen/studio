'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { ResourceType, SearchFilters } from '@/lib/definitions';
import { RESOURCE_TYPES } from '@/lib/definitions';
import { Filter, Search, X } from 'lucide-react';

interface FilterControlsProps {
  filters: SearchFilters;
  onFiltersChange: (newFilters: Partial<SearchFilters>) => void;
  availableCategories: string[];
  availableTopics: string[];
}

const sortOptions = [
  { value: 'date_desc', label: 'Date (Newest First)' },
  { value: 'date_asc', label: 'Date (Oldest First)' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

export function FilterControls({
  filters,
  onFiltersChange,
  availableCategories,
  availableTopics,
}: FilterControlsProps) {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ query: e.target.value });
  };

  const handleSelectChange = (field: keyof SearchFilters) => (value: string) => {
    onFiltersChange({ [field]: value === 'All' ? undefined : value });
  };
  
  const handleClearFilters = () => {
    onFiltersChange({ query: '', type: 'All', category: undefined, topic: undefined, sortBy: 'date_desc' });
  };

  return (
    <div className="mb-6 p-4 bg-card rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search resources..."
            value={filters.query || ''}
            onChange={handleInputChange}
            className="pl-10"
          />
        </div>

        <Select value={filters.type || 'All'} onValueChange={handleSelectChange('type')}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            {RESOURCE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.category || 'All'} onValueChange={handleSelectChange('category')}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.topic || 'All'} onValueChange={handleSelectChange('topic')}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Topics</SelectItem>
            {availableTopics.map((topic) => (
              <SelectItem key={topic} value={topic}>{topic}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="lg:col-span-3">
            <Select value={filters.sortBy || 'date_desc'} onValueChange={handleSelectChange('sortBy')}>
            <SelectTrigger>
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
        
        <Button onClick={handleClearFilters} variant="outline" className="w-full">
            <X className="mr-2 h-4 w-4" /> Clear Filters
        </Button>

      </div>
    </div>
  );
}
