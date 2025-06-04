
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

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
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

  const handleSelectChange = (field: keyof SearchFilters) => (value: string | number) => {
    if (field === 'filterYear' || field === 'filterMonth') {
      onFiltersChange({ [field]: value === 'All' ? undefined : Number(value) });
    } else {
      onFiltersChange({ [field]: value === 'All' ? undefined : value as string });
    }
  };
  
  const handleClearFilters = () => {
    onFiltersChange({ 
      query: '', 
      type: 'All', 
      category: undefined, 
      topic: undefined, 
      sortBy: 'date_desc',
      filterYear: undefined,
      filterMonth: undefined,
    });
  };

  return (
    <div className="mb-6 p-4 bg-card rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
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
        
        <Select value={filters.filterYear?.toString() || 'All'} onValueChange={handleSelectChange('filterYear')}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Year (Update)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.filterMonth?.toString() || 'All'} onValueChange={handleSelectChange('filterMonth')}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Month (Update)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Months</SelectItem>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="md:col-span-1 lg:col-span-1 xl:col-span-1">
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
        
        <Button onClick={handleClearFilters} variant="outline" className="w-full md:col-span-1">
            <X className="mr-2 h-4 w-4" /> Clear Filters
        </Button>

      </div>
    </div>
  );
}
