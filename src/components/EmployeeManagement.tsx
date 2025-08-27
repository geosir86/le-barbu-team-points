import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Edit, Trash2, Eye, EyeOff, Users, Activity, Calendar, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PasswordResetModal } from "@/components/PasswordResetModal";
import bcrypt from 'bcryptjs';

interface Employee {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date: string;
  is_active: boolean;
  points_balance: number;
  total_earned_points: number;
  store_id?: string;
  monthly_revenue_target?: number;
}

interface Store {
  id: string;
  name: string;
  location: string;
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    store_id: "",
    monthly_revenue_target: 350000, // Default 3500 euros in cents
  });
  const [showPassword, setShowPassword] = useState(false);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των εργαζομένων",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, location')
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των καταστημάτων",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      full_name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      store_id: "",
      monthly_revenue_target: 350000, // Default 3500 euros in cents
    });
    setEditingEmployee(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.full_name) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Τα πεδία Username και Όνομα είναι υποχρεωτικά",
      });
      return;
    }

    if (!editingEmployee && !formData.password) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Ο κωδικός πρόσβασης είναι υποχρεωτικός για νέους εργαζομένους",
      });
      return;
    }

    try {
      if (editingEmployee) {
        // Update existing employee
        const updateData: any = {
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email || null,
          phone: formData.phone || null,
          position: formData.position || null,
          department: formData.department || null,
          store_id: formData.store_id || null,
          monthly_revenue_target: formData.monthly_revenue_target * 100, // Convert to cents
        };

        // Only update password if provided
        if (formData.password) {
          const saltRounds = 10;
          updateData.password_hash = await bcrypt.hash(formData.password, saltRounds);
        }

        const { error } = await supabase
          .from('employees')
          .update(updateData)
          .eq('id', editingEmployee.id);

        if (error) throw error;

        toast({
          title: "Επιτυχής ενημέρωση",
          description: "Ο εργαζόμενος ενημερώθηκε επιτυχώς",
        });
      } else {
        // Create new employee
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(formData.password, saltRounds);

        const { error } = await supabase
          .from('employees')
          .insert([{
            username: formData.username,
            password_hash,
            full_name: formData.full_name,
            email: formData.email || null,
            phone: formData.phone || null,
            position: formData.position || null,
            department: formData.department || null,
            store_id: formData.store_id || null,
            monthly_revenue_target: formData.monthly_revenue_target * 100, // Convert to cents
          }]);

        if (error) {
          if (error.code === '23505') {
            toast({
              variant: "destructive",
              title: "Σφάλμα",
              description: "Το username υπάρχει ήδη",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Επιτυχής δημιουργία",
          description: "Ο εργαζόμενος δημιουργήθηκε επιτυχώς",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά την αποθήκευση",
      });
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      password: "",
      full_name: employee.full_name,
      email: employee.email || "",
      phone: employee.phone || "",
      position: employee.position || "",
      department: employee.department || "",
      store_id: employee.store_id || "",
      monthly_revenue_target: (employee.monthly_revenue_target || 0) / 100, // Convert from cents to euros
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !employee.is_active })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Επιτυχής ενημέρωση",
        description: `Ο εργαζόμενος ${employee.is_active ? 'απενεργοποιήθηκε' : 'ενεργοποιήθηκε'}`,
      });
      
      fetchEmployees();
    } catch (error) {
      console.error('Error toggling employee status:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η ενημέρωση της κατάστασης",
      });
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε τον εργαζόμενο "${employee.full_name}";`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Επιτυχής διαγραφή",
        description: "Ο εργαζόμενος διαγράφηκε επιτυχώς",
      });
      
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η διαγραφή του εργαζομένου",
      });
    }
  };

  const handlePasswordReset = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPasswordResetOpen(true);
  };

  useEffect(() => {
    fetchEmployees();
    fetchStores();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-lg w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Διαχείριση Εργαζομένων
          </h1>
          <p className="text-muted-foreground">Δημιουργία και διαχείριση λογαριασμών εργαζομένων</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Σύνολο Εργαζομένων</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Ενεργοί</p>
                  <p className="text-2xl font-bold text-green-500">
                    {employees.filter(e => e.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Νέοι (τελευταίος μήνας)</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {employees.filter(e => {
                      const hireDate = new Date(e.hire_date);
                      const monthAgo = new Date();
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      return hireDate >= monthAgo;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Employee Button */}
        <div className="flex justify-center mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} size="lg" className="shadow-lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Προσθήκη Νέου Εργαζομένου
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Επεξεργασία Εργαζομένου' : 'Νέος Εργαζόμενος'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="π.χ. giannis.petrou"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Κωδικός {editingEmployee ? '(άδειο = χωρίς αλλαγή)' : '*'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingEmployee ? "Νέος κωδικός" : "Κωδικός πρόσβασης"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Πλήρες Όνομα *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="π.χ. Γιάννης Πετρόπουλος"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="π.χ. giannis@company.gr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Τηλέφωνο</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="π.χ. 6912345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Θέση</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="π.χ. Πωλητής"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Τμήμα</Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Επιλέξτε τμήμα" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Πωλήσεις</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="support">Υποστήριξη</SelectItem>
                      <SelectItem value="admin">Διοίκηση</SelectItem>
                      <SelectItem value="warehouse">Αποθήκη</SelectItem>
                      <SelectItem value="other">Άλλο</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store">Κατάστημα</Label>
                  <Select 
                    value={formData.store_id} 
                    onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Επιλέξτε κατάστημα" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name} - {store.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_revenue_target">Μηνιαίος Στόχος Τζίρου (€)</Label>
                  <Input
                    id="monthly_revenue_target"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.monthly_revenue_target}
                    onChange={(e) => setFormData({ ...formData, monthly_revenue_target: Number(e.target.value) || 0 })}
                    placeholder="π.χ. 5000"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingEmployee ? 'Ενημέρωση' : 'Δημιουργία'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Άκυρο
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Employees Grid */}
        {employees.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν εργαζόμενοι</h3>
              <p className="text-muted-foreground mb-4">
                Δημιουργήστε τον πρώτο εργαζόμενο για να αρχίσετε
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <Card key={employee.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{employee.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">@{employee.username}</p>
                    </div>
                    <Badge variant={employee.is_active ? "default" : "secondary"}>
                      {employee.is_active ? "Ενεργός" : "Ανενεργός"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employee.position && (
                    <p className="text-sm"><strong>Θέση:</strong> {employee.position}</p>
                  )}
                  {employee.department && (
                    <p className="text-sm"><strong>Τμήμα:</strong> {employee.department}</p>
                  )}
                  {employee.email && (
                    <p className="text-sm"><strong>Email:</strong> {employee.email}</p>
                  )}
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Πόντοι</p>
                      <p className="font-bold text-primary">{employee.points_balance}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Σύνολο</p>
                      <p className="font-bold">{employee.total_earned_points}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Πρόσληψη: {new Date(employee.hire_date).toLocaleDateString('el-GR')}
                  </p>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(employee)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Επεξεργασία
                    </Button>
                    <Button
                      size="sm"
                      variant={employee.is_active ? "secondary" : "default"}
                      onClick={() => handleToggleActive(employee)}
                    >
                      {employee.is_active ? "Απ/ποίηση" : "Ενεργοποίηση"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(employee)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Reset Password Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePasswordReset(employee)}
                    className="w-full mt-2"
                  >
                    <KeyRound className="h-3 w-3 mr-1" />
                    Reset κωδικού
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Password Reset Modal */}
        <PasswordResetModal
          isOpen={isPasswordResetOpen}
          onClose={() => {
            setIsPasswordResetOpen(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          onSuccess={fetchEmployees}
        />
      </div>
    </div>
  );
}