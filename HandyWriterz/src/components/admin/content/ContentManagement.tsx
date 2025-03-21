import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  MoreVertical,
  Plus,
  Download,
  Trash,
  Edit,
  Eye,
  Archive,
  Clock,
  Tag,
  User,
  Folder,
} from 'lucide-react';
import { adminContentService, ContentItem, ContentFilter, ContentSort } from '@/services/adminContentService';

const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
};

export default function ContentManagement() {
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filter, setFilter] = useState<ContentFilter>({});
  const [sort, setSort] = useState<ContentSort>({ field: 'updatedAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const response = await adminContentService.getContentItems(
      { ...filter, searchQuery },
      sort,
      page,
      10
    );
    setItems(response.items);
    setTotal(response.total);
    setLoading(false);
  }, [filter, sort, page, searchQuery]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (key: keyof ContentFilter, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSortChange = (field: ContentSort['field']) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? items.map((item) => item.id) : []);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems((prev) =>
      checked ? [...prev, id] : prev.filter((itemId) => itemId !== id)
    );
  };

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (!selectedItems.length) return;

    try {
      if (action === 'delete') {
        await adminContentService.bulkDelete(selectedItems);
      } else {
        await adminContentService.bulkUpdateStatus(
          selectedItems,
          action === 'publish' ? 'published' : 'archived'
        );
      }
      fetchContent();
      setSelectedItems([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = await adminContentService.exportContent(filter);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Content exported successfully');
    } catch (error) {
      console.error('Error exporting content:', error);
      toast.error('Failed to export content');
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Management</h1>
        <Button onClick={() => router.push('/admin/content/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Content
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-4 gap-4 rounded-lg border p-4">
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filter.status}
              onValueChange={(value: any) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Service</label>
            <Select
              value={filter.service}
              onValueChange={(value: any) => handleFilterChange('service', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adult-health-nursing">Adult Health Nursing</SelectItem>
                <SelectItem value="mental-health-nursing">Mental Health Nursing</SelectItem>
                <SelectItem value="child-nursing">Child Nursing</SelectItem>
                <SelectItem value="crypto">Cryptocurrency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Date Range</label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filter.startDate && filter.endDate
                    ? `${format(new Date(filter.startDate), 'PP')} - ${format(
                        new Date(filter.endDate),
                        'PP'
                      )}`
                    : 'Select dates'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Date Range</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <Calendar
                    mode="range"
                    selected={{
                      from: filter.startDate ? new Date(filter.startDate) : undefined,
                      to: filter.endDate ? new Date(filter.endDate) : undefined,
                    }}
                    onSelect={(range) => {
                      if (range?.from) {
                        handleFilterChange('startDate', format(range.from, 'yyyy-MM-dd'));
                      }
                      if (range?.to) {
                        handleFilterChange('endDate', format(range.to, 'yyyy-MM-dd'));
                      }
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
          <span className="text-sm text-blue-700">
            {selectedItems.length} items selected
          </span>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('publish')}
            >
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('archive')}
            >
              Archive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    items.length > 0 &&
                    selectedItems.length === items.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortChange('title')}
              >
                Title
                {sort.field === 'title' && (
                  <span className="ml-2">
                    {sort.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Author</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortChange('publishedAt')}
              >
                Published
                {sort.field === 'publishedAt' && (
                  <span className="ml-2">
                    {sort.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No content found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(item.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={statusColors[item.status]}
                      variant="outline"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Folder className="mr-2 h-4 w-4 text-gray-500" />
                      {item.service}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      {item.author.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.publishedAt ? (
                      format(new Date(item.publishedAt), 'PP')
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/content/${item.id}`)
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/preview/${item.slug}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleBulkAction(
                              item.status === 'archived'
                                ? 'publish'
                                : 'archive'
                            )
                          }
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          {item.status === 'archived'
                            ? 'Unarchive'
                            : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() =>
                            handleBulkAction('delete')
                          }
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {items.length} of {total} items
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={items.length < 10}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 