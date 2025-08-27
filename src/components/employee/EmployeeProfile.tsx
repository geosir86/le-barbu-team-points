import { useState } from "react";
import { User, Settings, BarChart3, History, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { EmployeeReportsReal } from "./EmployeeReportsReal";
import { EmployeeSettings } from "./EmployeeSettings";

export function EmployeeProfile() {
  const { currentEmployee } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  if (!currentEmployee) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto text-center">
          <p>Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Προφίλ
          </h1>
          <p className="text-muted-foreground">
            Οι πληροφορίες και οι ρυθμίσεις σου
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User size={16} />
              <span className="text-xs">Προφίλ</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1">
              <BarChart3 size={16} />
              <span className="text-xs">Αναφορές</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings size={16} />
              <span className="text-xs">Ρυθμίσεις</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            {/* Profile Info Card */}
            <Card className="bg-card border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Στοιχεία Προφίλ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Ονοματεπώνυμο</p>
                    <p className="font-medium">{currentEmployee.full_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{currentEmployee.email || 'Δεν έχει οριστεί'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Θέση</p>
                    <p className="font-medium">{currentEmployee.position || 'Δεν έχει οριστεί'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Τμήμα</p>
                    <p className="font-medium">{currentEmployee.department || 'Δεν έχει οριστεί'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Κατάσταση</p>
                    <Badge variant={currentEmployee.is_active ? "default" : "secondary"}>
                      {currentEmployee.is_active ? "Ενεργός" : "Ανενεργός"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points Summary Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Shield className="h-5 w-5" />
                  Σύνοψη Πόντων
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Διαθέσιμοι</p>
                    <p className="text-2xl font-bold text-blue-700">{currentEmployee.points_balance}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Συνολικοί</p>
                    <p className="text-2xl font-bold text-blue-700">{currentEmployee.total_earned_points}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Summary Card */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <History className="h-5 w-5" />
                  Μηνιαίος Τζίρος
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Στόχος</p>
                    <p className="text-lg font-bold text-green-700">
                      €{((currentEmployee.monthly_revenue_target || 0) / 100).toFixed(0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Πραγματικός</p>
                    <p className="text-lg font-bold text-green-700">
                      €{((currentEmployee.monthly_revenue_actual || 0) / 100).toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <EmployeeReportsReal />
          </TabsContent>

          <TabsContent value="settings">
            <EmployeeSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}