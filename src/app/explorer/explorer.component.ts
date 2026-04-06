import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, signInWithRedirect, signOut, fetchUserAttributes, AuthUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

// Pre-built complex queries to showcase DynamoDB graph traversal
const DEMO_QUERIES: { name: string; description: string; query: string }[] = [
  {
    name: 'Full Hierarchy Traversal',
    description: 'Traverse 6 levels deep: Facility → Area → System → Equipment → Components + WorkOrders + Inspections',
    query: `query FullHierarchy {
  listFacilities {
    items {
      name facilityCode type status
      areas {
        items {
          name areaCode hazardClassification
          systems {
            items {
              name systemCode criticality processType
              equipment {
                items {
                  equipmentTag name healthStatus operatingHours
                  components { items { componentTag name condition material } }
                  workOrders { items { workOrderNumber title status priority type } }
                  inspectionRecords { items { inspectionNumber inspectionType result findings } }
                }
              }
            }
          }
        }
      }
    }
  }
}`,
  },
  {
    name: 'Critical Equipment with Open Work Orders',
    description: 'Find degraded/critical equipment and join their active work orders with assigned personnel and task breakdown',
    query: `query CriticalEquipmentWorkOrders {
  listEquipment(filter: {
    or: [
      { healthStatus: { eq: DEGRADED } },
      { healthStatus: { eq: CRITICAL } }
    ]
  }) {
    items {
      equipmentTag name healthStatus operatingHours
      system { name criticality area { name facility { name } } }
      workOrders {
        items {
          workOrderNumber title status priority type
          estimatedHours actualHours estimatedCost
          scheduledStartDate scheduledEndDate
          assignedTo { name role specialization certifications }
          tasks { items { taskNumber description status sequenceOrder estimatedMinutes requiresShutdown safetyPermitRequired } }
        }
      }
      components { items { componentTag name condition } }
    }
  }
}`,
  },
  {
    name: 'Inspection Failure Analysis',
    description: 'Cross-reference failed inspections with equipment details, inspector info, and related work orders',
    query: `query InspectionFailures {
  listInspectionRecords(filter: {
    or: [
      { result: { eq: FAIL } },
      { result: { eq: REQUIRES_FOLLOWUP } },
      { result: { eq: CONDITIONAL_PASS } }
    ]
  }) {
    items {
      inspectionNumber inspectionType result
      findings recommendations
      inspectionDate nextDueDate
      wallThickness vibrationLevel temperatureReading pressureReading
      inspector { name role certifications }
      equipment {
        equipmentTag name healthStatus operatingHours
        system { name area { name facility { name } } }
        workOrders { items { workOrderNumber status priority scheduledStartDate } }
      }
    }
  }
}`,
  },
  {
    name: 'Facility Personnel & Workload',
    description: 'Show each facility\'s personnel with their assigned work orders and inspection history',
    query: `query PersonnelWorkload {
  listPersonnel {
    items {
      employeeId name role specialization certifications isActive
      facility { name facilityCode }
      assignedWorkOrders {
        items {
          workOrderNumber title status priority type
          estimatedHours actualHours
          equipment { equipmentTag name healthStatus }
        }
      }
      inspections {
        items {
          inspectionNumber inspectionType result inspectionDate
          equipment { equipmentTag name }
        }
      }
    }
  }
}`,
  },
  {
    name: 'Maintenance Task Deep Dive',
    description: 'Trace tasks back through work orders to equipment, systems, and facilities — showing the full maintenance chain',
    query: `query MaintenanceTaskChain {
  listMaintenanceTasks(filter: {
    or: [
      { status: { eq: PENDING } },
      { status: { eq: IN_PROGRESS } }
    ]
  }) {
    items {
      taskNumber description procedure status
      sequenceOrder estimatedMinutes actualMinutes
      requiresShutdown safetyPermitRequired
      workOrder {
        workOrderNumber title status priority type
        estimatedHours estimatedCost
        scheduledStartDate scheduledEndDate
        assignedTo { name role }
        equipment {
          equipmentTag name healthStatus
          system {
            name criticality
            area {
              name hazardClassification
              facility { name facilityCode type }
            }
          }
        }
      }
    }
  }
}`,
  },
];

interface BreadcrumbItem {
  label: string;
  level: string;
  data: any;
}

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.css',
})
export class ExplorerComponent implements OnInit {
  // Auth state
  isAuthenticated = false;
  userDropdownOpen = false;
  userInfo: {
    username?: string;
    email?: string;
    sub?: string;
    identities?: string;
    provider?: string;
  } = {};

  // Hierarchy browser state
  facilities: any[] = [];
  breadcrumb: BreadcrumbItem[] = [];
  currentItems: any[] = [];
  currentLevel = 'facility';
  selectedItem: any = null;
  loading = false;

  // Query runner state
  activeTab: 'browser' | 'queries' = 'browser';
  demoQueries = DEMO_QUERIES;
  selectedQuery: typeof DEMO_QUERIES[0] | null = null;
  queryResult: any = null;
  queryRunning = false;
  queryError: string | null = null;
  queryTime: number | null = null;

  ngOnInit() {
    this.checkAuth();
    this.listenForAuth();
    this.loadFacilities();
  }

  // ─── Auth ───

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userDropdownOpen = false;
    }
  }

  async checkAuth() {
    try {
      const user: AuthUser = await getCurrentUser();
      const attrs = await fetchUserAttributes();
      this.isAuthenticated = true;
      // Parse identities to find the provider
      let provider = 'Cognito';
      const identitiesRaw = attrs['identities'];
      if (identitiesRaw) {
        try {
          const parsed = JSON.parse(identitiesRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            provider = parsed[0].providerName || 'Auth0';
          }
        } catch {}
      }
      this.userInfo = {
        username: user.username,
        email: attrs['email'] || 'N/A',
        sub: attrs['sub'],
        identities: identitiesRaw,
        provider,
      };
    } catch {
      this.isAuthenticated = false;
      this.userInfo = {};
    }
  }

  listenForAuth() {
    Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        this.checkAuth();
      } else if (payload.event === 'signedOut') {
        this.isAuthenticated = false;
        this.userInfo = {};
      }
    });
  }

  signIn() {
    signInWithRedirect({ provider: { custom: 'Auth0' } });
  }

  async handleSignOut() {
    await signOut({ global: true });
    this.isAuthenticated = false;
    this.userInfo = {};
    this.userDropdownOpen = false;
  }

  toggleDropdown() {
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  // ─── Hierarchy Browser ───

  async loadFacilities() {
    this.loading = true;
    try {
      const { data } = await client.models.Facility.list();
      this.facilities = data;
      this.currentItems = data;
      this.currentLevel = 'facility';
      this.breadcrumb = [];
      this.selectedItem = null;
    } catch (e) {
      console.error('Error loading facilities:', e);
    }
    this.loading = false;
  }

  async drillInto(item: any, level: string) {
    this.loading = true;
    this.selectedItem = null;
    try {
      let children: any[] = [];
      let nextLevel = '';

      switch (level) {
        case 'facility':
          this.breadcrumb = [{ label: item.name, level: 'facility', data: item }];
          const { data: areas } = await client.models.Area.list({
            filter: { facilityId: { eq: item.id } },
          });
          children = areas;
          nextLevel = 'area';
          break;

        case 'area':
          this.breadcrumb = this.breadcrumb.slice(0, 1);
          this.breadcrumb.push({ label: item.name, level: 'area', data: item });
          const { data: systems } = await client.models.System.list({
            filter: { areaId: { eq: item.id } },
          });
          children = systems;
          nextLevel = 'system';
          break;

        case 'system':
          this.breadcrumb = this.breadcrumb.slice(0, 2);
          this.breadcrumb.push({ label: item.name, level: 'system', data: item });
          const { data: equipment } = await client.models.Equipment.list({
            filter: { systemId: { eq: item.id } },
          });
          children = equipment;
          nextLevel = 'equipment';
          break;

        case 'equipment':
          this.breadcrumb = this.breadcrumb.slice(0, 3);
          this.breadcrumb.push({ label: item.equipmentTag || item.name, level: 'equipment', data: item });
          // Load components, work orders, and inspections in parallel
          // Use userPool auth mode for work orders when authenticated to access gated fields
          const woAuthMode = this.isAuthenticated ? { authMode: 'userPool' as const } : {};
          const [compResult, woResult, insResult] = await Promise.all([
            client.models.Component.list({ filter: { equipmentId: { eq: item.id } } }),
            client.models.WorkOrder.list({ filter: { equipmentId: { eq: item.id } }, ...woAuthMode }),
            client.models.InspectionRecord.list({ filter: { equipmentId: { eq: item.id } } }),
          ]);
          this.selectedItem = {
            ...item,
            _components: compResult.data,
            _workOrders: woResult.data,
            _inspections: insResult.data,
          };
          this.currentItems = [];
          nextLevel = 'detail';
          this.loading = false;
          return;
      }

      this.currentItems = children;
      this.currentLevel = nextLevel;
    } catch (e) {
      console.error('Error drilling into:', e);
    }
    this.loading = false;
  }

  navigateBreadcrumb(index: number) {
    if (index < 0) {
      this.loadFacilities();
      return;
    }
    const crumb = this.breadcrumb[index];
    // Re-drill from the parent level
    if (index === 0) {
      this.breadcrumb = [];
      this.drillInto(crumb.data, 'facility');
    } else {
      this.breadcrumb = this.breadcrumb.slice(0, index);
      this.drillInto(crumb.data, crumb.level);
    }
  }

  getLevelIcon(level: string): string {
    const icons: Record<string, string> = {
      facility: '🏭', area: '📍', system: '⚙️', equipment: '🔧', detail: '📋',
    };
    return icons[level] || '📄';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      HEALTHY: 'status-healthy', OPERATIONAL: 'status-healthy', PASS: 'status-healthy',
      GOOD: 'status-healthy', NEW: 'status-healthy', COMPLETED: 'status-healthy',
      DEGRADED: 'status-warning', FAIR: 'status-warning', CONDITIONAL_PASS: 'status-warning',
      IN_PROGRESS: 'status-warning', SCHEDULED: 'status-warning', PLANNED: 'status-warning',
      CRITICAL: 'status-critical', FAILED: 'status-critical', POOR: 'status-critical',
      FAIL: 'status-critical', EMERGENCY: 'status-critical', URGENT: 'status-critical',
      REQUIRES_FOLLOWUP: 'status-critical',
    };
    return map[status] || 'status-default';
  }

  // ─── Query Runner ───

  selectQuery(q: typeof DEMO_QUERIES[0]) {
    this.selectedQuery = q;
    this.queryResult = null;
    this.queryError = null;
    this.queryTime = null;
  }

  async runSelectedQuery() {
    if (!this.selectedQuery) return;
    this.queryRunning = true;
    this.queryError = null;
    this.queryResult = null;
    const start = performance.now();
    try {
      const result = await client.graphql({ query: this.selectedQuery.query } as any);
      this.queryTime = Math.round(performance.now() - start);
      if ((result as any).errors?.length) {
        this.queryError = JSON.stringify((result as any).errors, null, 2);
      } else {
        this.queryResult = (result as any).data;
      }
    } catch (e: any) {
      this.queryTime = Math.round(performance.now() - start);
      this.queryError = e.message || JSON.stringify(e);
    }
    this.queryRunning = false;
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
}
