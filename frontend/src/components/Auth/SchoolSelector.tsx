import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface School {
  id: string;
  name: string;
  code: string;
}

interface SchoolSelectorProps {
  value?: string;
  onChange: (schoolId: string, schoolName: string) => void;
  error?: string;
}

export const SchoolSelector = ({ value, onChange, error }: SchoolSelectorProps) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = schools.filter(
        (school) =>
          school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          school.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSchools(filtered);
    } else {
      setFilteredSchools(schools);
    }
  }, [searchTerm, schools]);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setSchools(data || []);
      setFilteredSchools(data || []);
    } catch (error) {
      console.error('Error loading schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolChange = (schoolId: string) => {
    const selectedSchool = schools.find((s) => s.id === schoolId);
    if (selectedSchool) {
      onChange(schoolId, selectedSchool.name);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="school" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        School *
      </Label>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search schools by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* School Dropdown */}
      <Select value={value} onValueChange={handleSchoolChange} disabled={loading}>
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder={loading ? 'Loading schools...' : 'Select your school'} />
        </SelectTrigger>
        <SelectContent>
          {filteredSchools.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchTerm ? 'No schools found matching your search' : 'No schools available'}
            </div>
          ) : (
            filteredSchools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{school.name}</span>
                  <span className="text-xs text-muted-foreground">Code: {school.code}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
