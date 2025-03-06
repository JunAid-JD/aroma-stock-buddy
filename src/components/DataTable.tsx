
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";

export interface DataTableProps {
  columns: { 
    key: string; 
    label: string;
    isDate?: boolean;
  }[];
  data: any[];
  isLoading?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onEditClick?: (item: any) => void; // Added for backwards compatibility
}

const DataTable = ({ columns, data, isLoading = false, onEdit, onDelete, onEditClick }: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const formatValue = (value: any, isDate: boolean = false) => {
    if (isDate && value) {
      return format(new Date(value), "PPpp");
    }
    return value;
  };

  // Use onEdit if available, otherwise fallback to onEditClick
  const handleEdit = onEdit || onEditClick;

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                {(handleEdit || onDelete) && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={row.id || index}>
                  {columns.map((column) => (
                    <TableCell key={`${row.id}-${column.key}`}>
                      {formatValue(row[column.key], column.isDate)}
                    </TableCell>
                  ))}
                  {(handleEdit || onDelete) && (
                    <TableCell>
                      <div className="flex gap-2">
                        {handleEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(row)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};

export default DataTable;
