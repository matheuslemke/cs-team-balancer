import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { PlayerWithRoles, CSRole, CS_ROLES } from "@/types/cs-types";

interface PlayerFormProps {
  player?: PlayerWithRoles;
  onSubmit: (data: PlayerFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface PlayerFormData {
  name: string;
  overall_level: number;
  roles: Array<{
    role: CSRole;
    level: number;
    is_favorite: boolean;
  }>;
}

export function PlayerForm({ player, onSubmit, onCancel, isSubmitting }: PlayerFormProps) {
  const [name, setName] = useState(player?.name || '');
  const [overallLevel, setOverallLevel] = useState(player?.overall_level || 10);
  const [selectedRole, setSelectedRole] = useState<CSRole>('entry_fragger');
  const [roleLevel, setRoleLevel] = useState(10);
  const [roles, setRoles] = useState<Array<{ role: CSRole; level: number; is_favorite: boolean }>>(
    player?.player_roles.map(pr => ({
      role: pr.role,
      level: pr.level,
      is_favorite: pr.is_favorite
    })) || []
  );

  const addRole = () => {
    if (roles.some(r => r.role === selectedRole)) return;
    
    setRoles([...roles, {
      role: selectedRole,
      level: roleLevel,
      is_favorite: false
    }]);
  };

  const removeRole = (role: CSRole) => {
    setRoles(roles.filter(r => r.role !== role));
  };

  const toggleFavorite = (role: CSRole) => {
    setRoles(roles.map(r => ({
      ...r,
      is_favorite: r.role === role ? !r.is_favorite : false
    })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      overall_level: overallLevel,
      roles
    });
  };

  const getRoleLabel = (role: CSRole) => CS_ROLES.find(r => r.value === role)?.label || role;
  const availableRoles = CS_ROLES.filter(role => !roles.some(r => r.role === role.value));

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">
          {player ? 'Edit Player' : 'Add New Player'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Player Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter player name"
              required
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="overall-level">Overall Level (1-20)</Label>
            <Input
              id="overall-level"
              type="number"
              min="1"
              max="20"
              value={overallLevel}
              onChange={(e) => setOverallLevel(Number(e.target.value))}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-4">
            <Label>Roles</Label>
            
            {availableRoles.length > 0 && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="role">Add Role</Label>
                  <Select value={selectedRole} onValueChange={(value: CSRole) => setSelectedRole(value)}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label} - {role.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label htmlFor="role-level">Level</Label>
                  <Input
                    id="role-level"
                    type="number"
                    min="1"
                    max="20"
                    value={roleLevel}
                    onChange={(e) => setRoleLevel(Number(e.target.value))}
                    className="bg-input border-border"
                  />
                </div>
                <Button type="button" onClick={addRole} className="bg-primary hover:bg-primary/90">
                  Add
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {roles.map((role) => (
                <div key={role.role} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-cs-blue text-cs-blue">
                      {getRoleLabel(role.role)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Level: {role.level}</span>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`favorite-${role.role}`}
                        checked={role.is_favorite}
                        onCheckedChange={() => toggleFavorite(role.role)}
                      />
                      <Label htmlFor={`favorite-${role.role}`} className="text-sm cursor-pointer">
                        Favorite
                      </Label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRole(role.role)}
                    className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Saving...' : player ? 'Update Player' : 'Add Player'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}