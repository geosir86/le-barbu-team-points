import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { EmployeeNavigation } from "@/components/employee/EmployeeNavigation";
import { EnhancedManagerDashboard } from "@/components/EnhancedManagerDashboard";
import { EnhancedNavigation } from "@/components/EnhancedNavigation";
import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import { ApprovalRequests } from "@/components/ApprovalRequests";
import { EmployeeManagement } from "@/components/EmployeeManagement";
import { StoreManagement } from "@/components/StoreManagement";
import { AddEventForm } from "@/components/AddEventForm";
import { Settings } from "@/components/Settings";
import { Notifications } from "@/components/Notifications";
import { Rewards } from "@/components/Rewards";
import { RewardsManagement } from "@/components/RewardsManagement";
import { LoginScreen } from "@/components/LoginScreen";
// Employee components
import { EmployeeActivityLog } from "@/components/employee/EmployeeActivityLog";
import { EmployeeRequests } from "@/components/employee/EmployeeRequests";
import { EmployeeGoals } from "@/components/employee/EmployeeGoals";
import { EmployeeLeaderboard } from "@/components/employee/EmployeeLeaderboard";
import { EmployeeBadges } from "@/components/employee/EmployeeBadges";
import { EmployeeFeedback } from "@/components/employee/EmployeeFeedback";
import { EmployeeReportsReal } from "@/components/employee/EmployeeReportsReal";
import { EmployeeKudos } from "@/components/employee/EmployeeKudos";
import { EmployeeProfile } from "@/components/employee/EmployeeProfile";
import { EmployeeEventsScreen } from "@/components/employee/EmployeeEventsScreen";
import { EmployeeNotifications } from "@/components/employee/EmployeeNotifications";
import { ManagerNotifications } from "@/components/ManagerNotifications";
import { RevenueEntry } from "@/components/RevenueEntry";
import { MonthlyRevenueOverview } from "@/components/MonthlyRevenueOverview";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { isLoggedIn, userRole, login } = useAuth();
  const [currentView, setCurrentView] = useState(() => 
    userRole === "manager" ? "manager-dashboard" : "employee-dashboard"
  );
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [storeCount, setStoreCount] = useState(0);

  // Load counts for navigation badges
  useEffect(() => {
    if (userRole === "manager") {
      loadNavigationCounts();
    }
  }, [userRole]);

  const loadNavigationCounts = async () => {
    try {
      // Count pending employee requests
      const { data: pendingRequests, error: requestsError } = await supabase
        .from('employee_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (!requestsError && pendingRequests) {
        setPendingApprovalsCount(pendingRequests.length);
      }

      // Count pending reward redemptions
      const { data: pendingRedemptions, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (!redemptionsError && pendingRedemptions) {
        setPendingApprovalsCount(prev => prev + pendingRedemptions.length);
      }

      // Count pending kudos
      const { data: pendingKudos, error: kudosError } = await supabase
        .from('employee_feedback')
        .select('id', { count: 'exact' })
        .eq('feedback_type', 'kudos')
        .eq('status', 'pending');

      if (!kudosError && pendingKudos) {
        setPendingApprovalsCount(prev => prev + pendingKudos.length);
      }

      // Count recent notifications (within 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentNotifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .gte('created_at', yesterday);

      if (!notificationsError && recentNotifications) {
        setNotificationsCount(recentNotifications.length);
      }

      // Count stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id', { count: 'exact' });

      if (!storesError && stores) {
        setStoreCount(stores.length);
      }

    } catch (error) {
      console.error('Error loading navigation counts:', error);
    }
  };

  // Update current view based on role change - MOVED BEFORE conditional return
  useEffect(() => {
    if (userRole) {
      setCurrentView(userRole === "manager" ? "manager-dashboard" : "employee-dashboard");
    }
  }, [userRole]);

  const handleLogin = async (username: string, password: string) => {
    return await login(username, password);
  };

  const renderView = () => {
    // Manager Views
    if (userRole === "manager") {
      switch (currentView) {
        case "dashboard":
        case "manager-dashboard":
          return <EnhancedManagerDashboard onViewChange={setCurrentView} />;
        case "approvals":
          return <ApprovalRequests />;
        case "employees":
          return <EmployeeManagement />;
        case "stores":
          return <StoreManagement />;
        case "notifications":
          return <ManagerNotifications />;
        case "add-event":
          return <AddEventForm />;
        case "revenue-entry":
          return <RevenueEntry />;
        case "monthly-revenue":
          return <MonthlyRevenueOverview />;
        case "settings":
          return <Settings />;
        default:
          return <EnhancedManagerDashboard onViewChange={setCurrentView} />;
      }
    }
    
    // Employee Views
    else {
      switch (currentView) {
        case "employee-dashboard":
          return <EmployeeDashboard />;
        case "events":
          return <EmployeeEventsScreen />;
        case "employee-notifications":
          return <EmployeeNotifications />;
        case "employee-activity":
          return <EmployeeActivityLog />;
        case "employee-rewards":
          return <Rewards />;
        case "employee-kudos":
          return <EmployeeKudos />;
        case "employee-requests":
          return <EmployeeRequests />;
        case "employee-profile":
          return <EmployeeProfile />;
        default:
          return <EmployeeDashboard />;
      }
    }
  };

  // Show login screen if not logged in - AFTER all hooks
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {renderView()}
      {userRole === "manager" ? (
        <EnhancedNavigation 
          currentView={currentView} 
          onViewChange={setCurrentView}
          pendingApprovalsCount={pendingApprovalsCount}
          notificationsCount={notificationsCount}
          storeCount={storeCount}
        />
      ) : (
        <EmployeeNavigation
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      )}
    </div>
  );
};

export default Index;
