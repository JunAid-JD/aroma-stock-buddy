
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
import { Edit, Search } from "lucide-react";
import { format } from "date-fns";

interface DataTableProps {
  columns: { 
    key: string; 
    label: string;
    isDate?: boolean;
  }[];
  data: any[];
  isLoading?: boolean;
  onEdit?: (item: any) => void;
}

const DataTable = ({ columns, data, isLoading = false, onEdit }: DataTableProps) => {
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
      return format(new Date(value), "PPpp"); // Format: "Apr 29, 2024, 12:00 PM"
    }
    return value;
  };

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
                {onEdit && <TableHead>Actions</TableHead>}
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
                  {onEdit && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(row)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
