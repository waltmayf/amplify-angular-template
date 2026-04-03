import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({

  // ─── Top-level: Facility (e.g., Refinery, Offshore Platform) ───
  Facility: a
    .model({
      name: a.string().required(),
      facilityCode: a.string().required(),
      type: a.enum(['REFINERY', 'OFFSHORE_PLATFORM', 'ONSHORE_FIELD', 'PIPELINE_STATION', 'GAS_PROCESSING_PLANT', 'TERMINAL']),
      location: a.string(),
      latitude: a.float(),
      longitude: a.float(),
      operatingCompany: a.string(),
      commissionDate: a.date(),
      status: a.enum(['OPERATIONAL', 'SHUTDOWN', 'UNDER_CONSTRUCTION', 'DECOMMISSIONED']),
      areas: a.hasMany('Area', 'facilityId'),
      personnel: a.hasMany('Personnel', 'facilityId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // ─── Area within a Facility (e.g., Crude Distillation Unit, Wellhead Area) ───
  Area: a
    .model({
      name: a.string().required(),
      areaCode: a.string().required(),
      description: a.string(),
      hazardClassification: a.enum(['ZONE_0', 'ZONE_1', 'ZONE_2', 'NON_HAZARDOUS']),
      facilityId: a.id().required(),
      facility: a.belongsTo('Facility', 'facilityId'),
      systems: a.hasMany('System', 'areaId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // ─── System within an Area (e.g., Cooling Water System, Flare System) ───
  System: a
    .model({
      name: a.string().required(),
      systemCode: a.string().required(),
      description: a.string(),
      criticality: a.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
      processType: a.enum(['SEPARATION', 'COMPRESSION', 'HEAT_EXCHANGE', 'PUMPING', 'STORAGE', 'FLARE', 'UTILITY', 'INSTRUMENTATION']),
      areaId: a.id().required(),
      area: a.belongsTo('Area', 'areaId'),
      equipment: a.hasMany('Equipment', 'systemId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // ─── Equipment within a System (e.g., Pump P-101, Compressor C-201) ───
  Equipment: a
    .model({
      equipmentTag: a.string().required(),
      name: a.string().required(),
      description: a.string(),
      manufacturer: a.string(),
      model: a.string(),
      serialNumber: a.string(),
      installDate: a.date(),
      equipmentType: a.enum(['PUMP', 'COMPRESSOR', 'HEAT_EXCHANGER', 'VESSEL', 'VALVE', 'TURBINE', 'GENERATOR', 'MOTOR', 'INSTRUMENT', 'PIPING']),
      healthStatus: a.enum(['HEALTHY', 'DEGRADED', 'CRITICAL', 'FAILED', 'UNKNOWN']),
      operatingHours: a.integer(),
      lastMaintenanceDate: a.date(),
      systemId: a.id().required(),
      system: a.belongsTo('System', 'systemId'),
      components: a.hasMany('Component', 'equipmentId'),
      workOrders: a.hasMany('WorkOrder', 'equipmentId'),
      inspectionRecords: a.hasMany('InspectionRecord', 'equipmentId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // ─── Component within Equipment (e.g., Impeller, Bearing, Seal) ───
  Component: a
    .model({
      name: a.string().required(),
      componentTag: a.string().required(),
      partNumber: a.string(),
      description: a.string(),
      material: a.string(),
      condition: a.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'FAILED']),
      installDate: a.date(),
      expectedLifeYears: a.float(),
      equipmentId: a.id().required(),
      equipment: a.belongsTo('Equipment', 'equipmentId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // ─── Work Orders tied to Equipment ───
  WorkOrder: a
    .model({
      workOrderNumber: a.string().required(),
      title: a.string().required(),
      description: a.string(),
      priority: a.enum(['EMERGENCY', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']),
      status: a.enum(['DRAFT', 'PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
      type: a.enum(['CORRECTIVE', 'PREVENTIVE', 'PREDICTIVE', 'CONDITION_BASED', 'SHUTDOWN', 'TURNAROUND']),
      estimatedHours: a.float(),
      actualHours: a.float(),
      estimatedCost: a.float(),
      actualCost: a.float(),
      scheduledStartDate: a.date(),
      scheduledEndDate: a.date(),
      actualStartDate: a.date(),
      actualEndDate: a.date(),
      equipmentId: a.id().required(),
      equipment: a.belongsTo('Equipment', 'equipmentId'),
      assignedToId: a.id(),
      assignedTo: a.belongsTo('Personnel', 'assignedToId'),
      tasks: a.hasMany('MaintenanceTask', 'workOrderId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // ─── Maintenance Tasks within a Work Order ───
  MaintenanceTask: a
    .model({
      taskNumber: a.string().required(),
      description: a.string().required(),
      procedure: a.string(),
      status: a.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
      sequenceOrder: a.integer(),
      estimatedMinutes: a.integer(),
      actualMinutes: a.integer(),
      requiresShutdown: a.boolean(),
      safetyPermitRequired: a.boolean(),
      workOrderId: a.id().required(),
      workOrder: a.belongsTo('WorkOrder', 'workOrderId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // ─── Inspection Records for Equipment ───
  InspectionRecord: a
    .model({
      inspectionNumber: a.string().required(),
      inspectionType: a.enum(['VISUAL', 'ULTRASONIC', 'RADIOGRAPHIC', 'MAGNETIC_PARTICLE', 'VIBRATION_ANALYSIS', 'THERMOGRAPHIC', 'PRESSURE_TEST']),
      result: a.enum(['PASS', 'CONDITIONAL_PASS', 'FAIL', 'REQUIRES_FOLLOWUP']),
      findings: a.string(),
      recommendations: a.string(),
      inspectionDate: a.date(),
      nextDueDate: a.date(),
      wallThickness: a.float(),
      vibrationLevel: a.float(),
      temperatureReading: a.float(),
      pressureReading: a.float(),
      equipmentId: a.id().required(),
      equipment: a.belongsTo('Equipment', 'equipmentId'),
      inspectorId: a.id(),
      inspector: a.belongsTo('Personnel', 'inspectorId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // ─── Personnel assigned to a Facility ───
  Personnel: a
    .model({
      employeeId: a.string().required(),
      name: a.string().required(),
      role: a.enum(['OPERATOR', 'TECHNICIAN', 'ENGINEER', 'INSPECTOR', 'SUPERVISOR', 'SAFETY_OFFICER', 'PLANNER']),
      specialization: a.string(),
      certifications: a.string(),
      contactEmail: a.string(),
      contactPhone: a.string(),
      isActive: a.boolean(),
      facilityId: a.id().required(),
      facility: a.belongsTo('Facility', 'facilityId'),
      assignedWorkOrders: a.hasMany('WorkOrder', 'assignedToId'),
      inspections: a.hasMany('InspectionRecord', 'inspectorId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
