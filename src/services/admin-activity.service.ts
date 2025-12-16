interface AdminActivity {
  id: string;
  action: string;
  resource: string;
  resourceName: string;
  timestamp: Date;
  adminUser?: string;
  details?: string;
}

type ActivityAction = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'approved' 
  | 'suspended' 
  | 'activated' 
  | 'deactivated';

type ActivityResource = 
  | 'route' 
  | 'bus' 
  | 'trip' 
  | 'operator' 
  | 'user' 
  | 'booking';

class AdminActivityService {
  private activities: AdminActivity[] = [];
  private readonly MAX_ACTIVITIES = 50; // Keep only last 50 activities
  private idCounter = 0; // Add counter for unique IDs

  // Add new activity
  addActivity(
    action: ActivityAction,
    resource: ActivityResource,
    resourceName: string,
    details?: string,
    adminUser?: string
  ) {
    // Generate unique ID using timestamp + counter + random number
    const uniqueId = `${Date.now()}-${++this.idCounter}-${Math.random().toString(36).substr(2, 9)}`;
    
    const activity: AdminActivity = {
      id: uniqueId,
      action,
      resource,
      resourceName,
      timestamp: new Date(),
      adminUser,
      details,
    };

    this.activities.unshift(activity); // Add to beginning

    // Keep only the most recent activities
    if (this.activities.length > this.MAX_ACTIVITIES) {
      this.activities = this.activities.slice(0, this.MAX_ACTIVITIES);
    }

    // Persist to localStorage
    this.saveToStorage();
  }

  // Get recent activities
  getRecentActivities(limit = 10): AdminActivity[] {
    return this.activities.slice(0, limit);
  }

  // Clear all activities
  clearActivities() {
    this.activities = [];
    this.saveToStorage();
  }

  // Save to localStorage
  private saveToStorage() {
    try {
      localStorage.setItem('adminActivities', JSON.stringify(this.activities));
    } catch (error) {
      console.warn('Failed to save admin activities to localStorage:', error);
    }
  }

  // Load from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('adminActivities');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Restore Date objects
        this.activities = parsed.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
        }));
        
        // Reset idCounter based on existing activities to avoid duplicates
        this.idCounter = this.activities.length;
      }
    } catch (error) {
      console.warn('Failed to load admin activities from localStorage:', error);
      this.activities = [];
      this.idCounter = 0;
    }
  }

  // Format activity for display
  formatActivity(activity: AdminActivity): string {
    const action = activity.action.charAt(0).toUpperCase() + activity.action.slice(1);
    return `${action} ${activity.resource} "${activity.resourceName}"`;
  }

  // Get activity icon based on action
  getActivityIcon(activity: AdminActivity): string {
    switch (activity.action) {
      case 'created':
        return '➕';
      case 'updated':
        return '✏️';
      case 'deleted':
        return '🗑️';
      case 'approved':
        return '✅';
      case 'suspended':
        return '⏸️';
      case 'activated':
        return '🟢';
      case 'deactivated':
        return '🔴';
      default:
        return '📝';
    }
  }

  // Get activity color based on action
  getActivityColor(activity: AdminActivity): string {
    switch (activity.action) {
      case 'created':
        return 'text-green-600 dark:text-green-400';
      case 'updated':
        return 'text-blue-600 dark:text-blue-400';
      case 'deleted':
        return 'text-red-600 dark:text-red-400';
      case 'approved':
        return 'text-green-600 dark:text-green-400';
      case 'suspended':
        return 'text-orange-600 dark:text-orange-400';
      case 'activated':
        return 'text-green-600 dark:text-green-400';
      case 'deactivated':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }
}

// Export singleton instance
export const adminActivityService = new AdminActivityService();

// Export types for use in other components
export type { AdminActivity, ActivityAction, ActivityResource };