import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarDays, Clock, Edit3, ExternalLink, FileText, PlaySquare, Tag, Trash2, Wrench, BookOpen, TerminalSquare, CalendarClock, Sparkles, Loader2 } from 'lucide-react';
import type { Resource, ResourceType } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ResourceCardProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
  onScrape: (resource: Resource) => void;
  isScraping: boolean;
}

const typeIcons: Record<ResourceType, React.ElementType> = {
  Article: FileText,
  Video: PlaySquare,
  Course: BookOpen,
  Tool: Wrench,
  Documentation: TerminalSquare,
};

export function ResourceCard({ resource, onEdit, onDelete, onScrape, isScraping }: ResourceCardProps) {
  const TypeIcon = typeIcons[resource.type] || FileText;

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
      <CardHeader>
        <div className="aspect-[16/9] relative mb-4 rounded-t-md overflow-hidden bg-muted">
          <Image
            src={`https://placehold.co/600x338.png?text=${encodeURIComponent(resource.name)}`}
            alt={resource.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="technology abstract"
          />
        </div>
        <CardTitle className="font-headline text-xl leading-tight">{resource.name}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground">
          <TypeIcon className="mr-2 h-4 w-4" /> {resource.type} &bull; {resource.category} &bull; {resource.topic}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {resource.tags && resource.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {resource.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        <div className="space-y-2 text-sm">
          {resource.duration && (
            <p className="flex items-center text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" /> Duration: {resource.duration}
            </p>
          )}
          {resource.manualLastUpdate && (
             <p className="flex items-center text-muted-foreground">
              <CalendarClock className="mr-2 h-4 w-4" /> Last Content Update: {resource.manualLastUpdate}
            </p>
          )}
          <p className="flex items-center text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" /> Record Updated: {format(new Date(resource.updatedDate), 'PPP')}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <Link href={resource.fullUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Resource
          </Button>
        </Link>
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onScrape(resource)} disabled={isScraping} aria-label="Scrape resource with AI">
                  {isScraping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-accent-foreground" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Analyze with AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onEdit(resource)} aria-label="Edit resource">
                  <Edit3 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Resource</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AlertDialog>
            <AlertDialogTrigger asChild>
               <Button variant="ghost" size="icon" aria-label="Delete resource">
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the resource
                  "{resource.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(resource.id!)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
