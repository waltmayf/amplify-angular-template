#!/usr/bin/env tsx
/**
 * Oil & Gas Maintenance Demo - Sample Data Loader
 *
 * Loads a realistic hierarchical dataset into the Amplify GraphQL API:
 *   Facility → Area → System → Equipment → Components
 *   Plus: Personnel, WorkOrders, MaintenanceTasks, InspectionRecords
 *
 * Usage:
 *   pnpm tsx scripts/loadSampleData.ts
 */

import { setAmplifyEnvVars, getConfiguredAmplifyClient } from '../utils/amplifyUtils';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(msg: string, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

async function gql(client: any, query: string, variables: Record<string, any> = {}) {
  const result = await client.graphql({ query, variables });
  if (result.errors?.length) {
    console.error('GraphQL errors:', JSON.stringify(result.errors, null, 2));
    throw new Error(result.errors[0].message);
  }
  // Return the first data key's value
  const keys = Object.keys(result.data);
  return result.data[keys[0]];
}

// ─── Mutation helpers ───

const createFacility = `mutation Create($input: CreateFacilityInput!) {
  createFacility(input: $input) { id name }
}`;

const createArea = `mutation Create($input: CreateAreaInput!) {
  createArea(input: $input) { id name }
}`;

const createSystem = `mutation Create($input: CreateSystemInput!) {
  createSystem(input: $input) { id name }
}`;

const createEquipment = `mutation Create($input: CreateEquipmentInput!) {
  createEquipment(input: $input) { id equipmentTag name }
}`;

const createComponent = `mutation Create($input: CreateComponentInput!) {
  createComponent(input: $input) { id componentTag name }
}`;

const createPersonnel = `mutation Create($input: CreatePersonnelInput!) {
  createPersonnel(input: $input) { id employeeId name }
}`;

const createWorkOrder = `mutation Create($input: CreateWorkOrderInput!) {
  createWorkOrder(input: $input) { id workOrderNumber }
}`;

const createMaintenanceTask = `mutation Create($input: CreateMaintenanceTaskInput!) {
  createMaintenanceTask(input: $input) { id taskNumber }
}`;

const createInspectionRecord = `mutation Create($input: CreateInspectionRecordInput!) {
  createInspectionRecord(input: $input) { id inspectionNumber }
}`;

// ─── Sample Data ───

async function loadData(client: any) {
  log('\n🏭 Creating Facilities...', colors.cyan);

  const facility1 = await gql(client, createFacility, {
    input: {
      name: 'Thunder Bay Refinery',
      facilityCode: 'TBR-001',
      type: 'REFINERY',
      location: 'Thunder Bay, Alberta, Canada',
      latitude: 56.234,
      longitude: -120.849,
      operatingCompany: 'Northern Petroleum Corp',
      commissionDate: '1998-06-15',
      status: 'OPERATIONAL',
    },
  });
  log(`  ✅ ${facility1.name} (${facility1.id})`, colors.green);

  const facility2 = await gql(client, createFacility, {
    input: {
      name: 'Deepwater Horizon Alpha',
      facilityCode: 'DHA-002',
      type: 'OFFSHORE_PLATFORM',
      location: 'Gulf of Mexico, Block 252',
      latitude: 28.738,
      longitude: -88.366,
      operatingCompany: 'Northern Petroleum Corp',
      commissionDate: '2012-03-22',
      status: 'OPERATIONAL',
    },
  });
  log(`  ✅ ${facility2.name} (${facility2.id})`, colors.green);

  // ─── Personnel ───
  log('\n👷 Creating Personnel...', colors.cyan);

  const personnel = await Promise.all([
    gql(client, createPersonnel, {
      input: { employeeId: 'EMP-1001', name: 'Carlos Mendez', role: 'SUPERVISOR', specialization: 'Rotating Equipment', certifications: 'API 510, API 570, CMRP', contactEmail: 'cmendez@example.com', isActive: true, facilityId: facility1.id },
    }),
    gql(client, createPersonnel, {
      input: { employeeId: 'EMP-1002', name: 'Sarah Chen', role: 'ENGINEER', specialization: 'Process Engineering', certifications: 'PE, Six Sigma Black Belt', contactEmail: 'schen@example.com', isActive: true, facilityId: facility1.id },
    }),
    gql(client, createPersonnel, {
      input: { employeeId: 'EMP-1003', name: 'James Okafor', role: 'INSPECTOR', specialization: 'NDT Level III', certifications: 'ASNT Level III UT/RT/MT', contactEmail: 'jokafor@example.com', isActive: true, facilityId: facility1.id },
    }),
    gql(client, createPersonnel, {
      input: { employeeId: 'EMP-1004', name: 'Maria Santos', role: 'TECHNICIAN', specialization: 'Instrumentation & Controls', certifications: 'ISA CCST Level III', contactEmail: 'msantos@example.com', isActive: true, facilityId: facility1.id },
    }),
    gql(client, createPersonnel, {
      input: { employeeId: 'EMP-2001', name: 'Erik Johansson', role: 'SAFETY_OFFICER', specialization: 'Offshore Safety', certifications: 'NEBOSH, BOSIET', contactEmail: 'ejohansson@example.com', isActive: true, facilityId: facility2.id },
    }),
    gql(client, createPersonnel, {
      input: { employeeId: 'EMP-2002', name: 'Aisha Patel', role: 'PLANNER', specialization: 'Maintenance Planning', certifications: 'CMRP, PMP', contactEmail: 'apatel@example.com', isActive: true, facilityId: facility2.id },
    }),
  ]);
  personnel.forEach((p) => log(`  ✅ ${p.name} (${p.employeeId})`, colors.green));

  // ─── Areas for Thunder Bay Refinery ───
  log('\n📍 Creating Areas...', colors.cyan);

  const areaCDU = await gql(client, createArea, {
    input: { name: 'Crude Distillation Unit', areaCode: 'TBR-CDU', description: 'Primary crude oil distillation and fractionation', hazardClassification: 'ZONE_1', facilityId: facility1.id },
  });
  const areaUtil = await gql(client, createArea, {
    input: { name: 'Utilities & Offsites', areaCode: 'TBR-UTL', description: 'Steam generation, cooling water, and power distribution', hazardClassification: 'ZONE_2', facilityId: facility1.id },
  });
  const areaFCC = await gql(client, createArea, {
    input: { name: 'Fluid Catalytic Cracker', areaCode: 'TBR-FCC', description: 'Catalytic cracking of heavy gas oils', hazardClassification: 'ZONE_1', facilityId: facility1.id },
  });

  // Areas for Offshore Platform
  const areaWellhead = await gql(client, createArea, {
    input: { name: 'Wellhead Platform', areaCode: 'DHA-WHP', description: 'Subsea wellhead control and production manifold', hazardClassification: 'ZONE_0', facilityId: facility2.id },
  });
  const areaProcess = await gql(client, createArea, {
    input: { name: 'Process Module', areaCode: 'DHA-PRC', description: 'Separation, compression, and metering', hazardClassification: 'ZONE_1', facilityId: facility2.id },
  });

  [areaCDU, areaUtil, areaFCC, areaWellhead, areaProcess].forEach((a) =>
    log(`  ✅ ${a.name}`, colors.green)
  );

  // ─── Systems ───
  log('\n⚙️  Creating Systems...', colors.cyan);

  const sysPreheat = await gql(client, createSystem, {
    input: { name: 'Crude Preheat Train', systemCode: 'CDU-PHT-100', description: 'Heat exchangers for crude oil preheating before distillation column', criticality: 'CRITICAL', processType: 'HEAT_EXCHANGE', areaId: areaCDU.id },
  });
  const sysPumping = await gql(client, createSystem, {
    input: { name: 'Crude Charge Pumping', systemCode: 'CDU-PMP-200', description: 'Main crude charge pumps feeding the distillation column', criticality: 'CRITICAL', processType: 'PUMPING', areaId: areaCDU.id },
  });
  const sysCooling = await gql(client, createSystem, {
    input: { name: 'Cooling Water System', systemCode: 'UTL-CW-300', description: 'Closed-loop cooling water for process heat exchangers', criticality: 'HIGH', processType: 'UTILITY', areaId: areaUtil.id },
  });
  const sysFlare = await gql(client, createSystem, {
    input: { name: 'Flare System', systemCode: 'UTL-FLR-400', description: 'Emergency pressure relief and flare stack', criticality: 'CRITICAL', processType: 'FLARE', areaId: areaUtil.id },
  });
  const sysSeparation = await gql(client, createSystem, {
    input: { name: 'Production Separation', systemCode: 'PRC-SEP-100', description: 'Three-phase separator for oil/gas/water separation', criticality: 'CRITICAL', processType: 'SEPARATION', areaId: areaProcess.id },
  });
  const sysCompression = await gql(client, createSystem, {
    input: { name: 'Gas Compression', systemCode: 'PRC-CMP-200', description: 'Export gas compression for pipeline delivery', criticality: 'HIGH', processType: 'COMPRESSION', areaId: areaProcess.id },
  });

  [sysPreheat, sysPumping, sysCooling, sysFlare, sysSeparation, sysCompression].forEach((s) =>
    log(`  ✅ ${s.name} (${s.id})`, colors.green)
  );

  // ─── Equipment ───
  log('\n🔧 Creating Equipment...', colors.cyan);

  const pumpP101 = await gql(client, createEquipment, {
    input: { equipmentTag: 'P-101A', name: 'Crude Charge Pump A', description: 'Centrifugal crude charge pump, primary', manufacturer: 'Sulzer', model: 'MSD-D 8x10x14', serialNumber: 'SLZ-2019-44821', installDate: '2019-04-10', equipmentType: 'PUMP', healthStatus: 'DEGRADED', operatingHours: 42350, lastMaintenanceDate: '2025-11-15', systemId: sysPumping.id },
  });
  const pumpP101B = await gql(client, createEquipment, {
    input: { equipmentTag: 'P-101B', name: 'Crude Charge Pump B', description: 'Centrifugal crude charge pump, standby', manufacturer: 'Sulzer', model: 'MSD-D 8x10x14', serialNumber: 'SLZ-2019-44822', installDate: '2019-04-10', equipmentType: 'PUMP', healthStatus: 'HEALTHY', operatingHours: 18200, lastMaintenanceDate: '2026-01-20', systemId: sysPumping.id },
  });
  const hxE101 = await gql(client, createEquipment, {
    input: { equipmentTag: 'E-101', name: 'Crude/Residue Exchanger', description: 'Shell & tube heat exchanger, crude preheat stage 1', manufacturer: 'Alfa Laval', model: 'Compabloc CB76', serialNumber: 'AL-2018-99102', installDate: '2018-09-01', equipmentType: 'HEAT_EXCHANGER', healthStatus: 'HEALTHY', operatingHours: 52000, lastMaintenanceDate: '2025-09-30', systemId: sysPreheat.id },
  });
  const hxE102 = await gql(client, createEquipment, {
    input: { equipmentTag: 'E-102', name: 'Crude/Heavy Naphtha Exchanger', description: 'Shell & tube heat exchanger, crude preheat stage 2', manufacturer: 'Alfa Laval', model: 'Compabloc CB76', serialNumber: 'AL-2018-99103', installDate: '2018-09-01', equipmentType: 'HEAT_EXCHANGER', healthStatus: 'CRITICAL', operatingHours: 52000, lastMaintenanceDate: '2025-06-15', systemId: sysPreheat.id },
  });
  const compC201 = await gql(client, createEquipment, {
    input: { equipmentTag: 'C-201', name: 'Export Gas Compressor', description: 'Centrifugal gas compressor, 3-stage', manufacturer: 'Atlas Copco', model: 'GT-110', serialNumber: 'AC-2012-33100', installDate: '2012-03-22', equipmentType: 'COMPRESSOR', healthStatus: 'DEGRADED', operatingHours: 98500, lastMaintenanceDate: '2025-12-01', systemId: sysCompression.id },
  });
  const vesselV301 = await gql(client, createEquipment, {
    input: { equipmentTag: 'V-301', name: 'Three-Phase Separator', description: 'Horizontal three-phase production separator', manufacturer: 'Exterran', model: 'HPS-3600', serialNumber: 'EXT-2012-10050', installDate: '2012-03-22', equipmentType: 'VESSEL', healthStatus: 'HEALTHY', operatingHours: 105000, lastMaintenanceDate: '2026-02-10', systemId: sysSeparation.id },
  });
  const valvePSV401 = await gql(client, createEquipment, {
    input: { equipmentTag: 'PSV-401', name: 'Flare Header Relief Valve', description: 'Pressure safety valve on main flare header', manufacturer: 'Emerson', model: 'Crosby J-Series', serialNumber: 'EMR-2020-77001', installDate: '2020-08-15', equipmentType: 'VALVE', healthStatus: 'HEALTHY', operatingHours: 35000, lastMaintenanceDate: '2026-01-05', systemId: sysFlare.id },
  });

  [pumpP101, pumpP101B, hxE101, hxE102, compC201, vesselV301, valvePSV401].forEach((e) =>
    log(`  ✅ ${e.equipmentTag} - ${e.name}`, colors.green)
  );

  // ─── Components (sub-parts of equipment) ───
  log('\n🔩 Creating Components...', colors.cyan);

  const components = await Promise.all([
    // Pump P-101A components
    gql(client, createComponent, { input: { name: 'Impeller', componentTag: 'P-101A-IMP', partNumber: 'SLZ-IMP-8x10', material: 'Duplex Stainless Steel 2205', condition: 'FAIR', installDate: '2023-06-01', expectedLifeYears: 4, equipmentId: pumpP101.id } }),
    gql(client, createComponent, { input: { name: 'Mechanical Seal', componentTag: 'P-101A-SEAL', partNumber: 'SLZ-SEAL-4500', material: 'Silicon Carbide / Carbon', condition: 'POOR', installDate: '2025-11-15', expectedLifeYears: 2, equipmentId: pumpP101.id } }),
    gql(client, createComponent, { input: { name: 'Radial Bearing DE', componentTag: 'P-101A-BRG-DE', partNumber: 'SKF-7316-BECBM', material: 'Chrome Steel', condition: 'FAIR', installDate: '2023-06-01', expectedLifeYears: 3, equipmentId: pumpP101.id } }),
    gql(client, createComponent, { input: { name: 'Coupling', componentTag: 'P-101A-CPL', partNumber: 'REXNORD-OMEGA-E50', material: 'Steel / Elastomer', condition: 'GOOD', installDate: '2023-06-01', expectedLifeYears: 5, equipmentId: pumpP101.id } }),
    // Heat Exchanger E-102 components
    gql(client, createComponent, { input: { name: 'Tube Bundle', componentTag: 'E-102-TUBES', partNumber: 'AL-TB-CB76-SS316', material: 'SS 316L', condition: 'POOR', installDate: '2018-09-01', expectedLifeYears: 8, equipmentId: hxE102.id } }),
    gql(client, createComponent, { input: { name: 'Gasket Set', componentTag: 'E-102-GSKT', partNumber: 'AL-GSKT-CB76-SPW', material: 'Spiral Wound SS/Graphite', condition: 'FAIR', installDate: '2025-06-15', expectedLifeYears: 3, equipmentId: hxE102.id } }),
    // Compressor C-201 components
    gql(client, createComponent, { input: { name: '1st Stage Impeller', componentTag: 'C-201-IMP1', partNumber: 'AC-IMP-GT110-S1', material: 'Inconel 718', condition: 'GOOD', installDate: '2024-01-15', expectedLifeYears: 5, equipmentId: compC201.id } }),
    gql(client, createComponent, { input: { name: 'Thrust Bearing', componentTag: 'C-201-BRG-THR', partNumber: 'KINGSBURY-LEG-6', material: 'Babbitt / Steel', condition: 'FAIR', installDate: '2024-01-15', expectedLifeYears: 4, equipmentId: compC201.id } }),
    gql(client, createComponent, { input: { name: 'Dry Gas Seal', componentTag: 'C-201-DGS', partNumber: 'JOHN-CRANE-2800', material: 'Tungsten Carbide', condition: 'GOOD', installDate: '2025-12-01', expectedLifeYears: 3, equipmentId: compC201.id } }),
  ]);
  components.forEach((c) => log(`  ✅ ${c.componentTag} - ${c.name}`, colors.green));

  // ─── Work Orders ───
  log('\n📋 Creating Work Orders...', colors.cyan);

  const wo1 = await gql(client, createWorkOrder, {
    input: {
      workOrderNumber: 'WO-2026-0042',
      title: 'P-101A Mechanical Seal Replacement',
      description: 'Elevated vibration and seal leakage detected on crude charge pump P-101A. Replace mechanical seal and inspect impeller wear.',
      priority: 'URGENT',
      status: 'SCHEDULED',
      type: 'CORRECTIVE',
      estimatedHours: 16,
      estimatedCost: 45000,
      scheduledStartDate: '2026-04-07',
      scheduledEndDate: '2026-04-08',
      equipmentId: pumpP101.id,
      assignedToId: personnel[0].id, // Carlos Mendez
    },
  });

  const wo2 = await gql(client, createWorkOrder, {
    input: {
      workOrderNumber: 'WO-2026-0043',
      title: 'E-102 Tube Bundle Inspection & Cleaning',
      description: 'Scheduled inspection of crude/heavy naphtha exchanger. Fouling suspected based on declining heat transfer coefficient.',
      priority: 'HIGH',
      status: 'PLANNED',
      type: 'PREVENTIVE',
      estimatedHours: 24,
      estimatedCost: 28000,
      scheduledStartDate: '2026-04-14',
      scheduledEndDate: '2026-04-16',
      equipmentId: hxE102.id,
      assignedToId: personnel[1].id, // Sarah Chen
    },
  });

  const wo3 = await gql(client, createWorkOrder, {
    input: {
      workOrderNumber: 'WO-2026-0044',
      title: 'C-201 Vibration Analysis & Bearing Assessment',
      description: 'Predictive maintenance: vibration trending shows increasing 1x amplitude on drive-end bearing. Assess bearing condition and alignment.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      type: 'PREDICTIVE',
      estimatedHours: 8,
      actualHours: 4,
      estimatedCost: 12000,
      scheduledStartDate: '2026-04-01',
      scheduledEndDate: '2026-04-02',
      actualStartDate: '2026-04-01',
      equipmentId: compC201.id,
      assignedToId: personnel[3].id, // Maria Santos
    },
  });

  const wo4 = await gql(client, createWorkOrder, {
    input: {
      workOrderNumber: 'WO-2026-0045',
      title: 'PSV-401 Annual Certification Test',
      description: 'Annual pop-test and recertification of flare header pressure safety valve per API 510 requirements.',
      priority: 'HIGH',
      status: 'PLANNED',
      type: 'CONDITION_BASED',
      estimatedHours: 6,
      estimatedCost: 8500,
      scheduledStartDate: '2026-04-21',
      scheduledEndDate: '2026-04-21',
      equipmentId: valvePSV401.id,
      assignedToId: personnel[2].id, // James Okafor
    },
  });

  const wo5 = await gql(client, createWorkOrder, {
    input: {
      workOrderNumber: 'WO-2026-0046',
      title: 'V-301 Separator Turnaround Inspection',
      description: 'Major turnaround: internal inspection of three-phase separator including corrosion mapping, weld inspection, and internals replacement.',
      priority: 'HIGH',
      status: 'DRAFT',
      type: 'TURNAROUND',
      estimatedHours: 120,
      estimatedCost: 250000,
      scheduledStartDate: '2026-06-01',
      scheduledEndDate: '2026-06-15',
      equipmentId: vesselV301.id,
      assignedToId: personnel[4].id, // Erik Johansson
    },
  });

  [wo1, wo2, wo3, wo4, wo5].forEach((w) => log(`  ✅ ${w.workOrderNumber}`, colors.green));

  // ─── Maintenance Tasks (for WO-2026-0042: Seal Replacement) ───
  log('\n🔨 Creating Maintenance Tasks...', colors.cyan);

  const tasks = await Promise.all([
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0042-01', description: 'Isolate pump P-101A, lock-out/tag-out, depressurize and drain', procedure: 'SOP-PMP-LOTO-001', status: 'PENDING', sequenceOrder: 1, estimatedMinutes: 60, requiresShutdown: true, safetyPermitRequired: true, workOrderId: wo1.id } }),
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0042-02', description: 'Remove coupling guard and disconnect coupling', procedure: 'SOP-PMP-CPL-002', status: 'PENDING', sequenceOrder: 2, estimatedMinutes: 45, requiresShutdown: true, safetyPermitRequired: false, workOrderId: wo1.id } }),
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0042-03', description: 'Remove and inspect mechanical seal assembly', procedure: 'SOP-PMP-SEAL-003', status: 'PENDING', sequenceOrder: 3, estimatedMinutes: 90, requiresShutdown: true, safetyPermitRequired: false, workOrderId: wo1.id } }),
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0042-04', description: 'Inspect impeller for wear and erosion, measure clearances', procedure: 'SOP-PMP-IMP-004', status: 'PENDING', sequenceOrder: 4, estimatedMinutes: 60, requiresShutdown: true, safetyPermitRequired: false, workOrderId: wo1.id } }),
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0042-05', description: 'Install new mechanical seal, reassemble pump', procedure: 'SOP-PMP-SEAL-005', status: 'PENDING', sequenceOrder: 5, estimatedMinutes: 120, requiresShutdown: true, safetyPermitRequired: false, workOrderId: wo1.id } }),
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0042-06', description: 'Perform alignment check and reconnect coupling', procedure: 'SOP-PMP-ALN-006', status: 'PENDING', sequenceOrder: 6, estimatedMinutes: 90, requiresShutdown: true, safetyPermitRequired: false, workOrderId: wo1.id } }),
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0042-07', description: 'Commission pump: run test, vibration check, seal leak check', procedure: 'SOP-PMP-COM-007', status: 'PENDING', sequenceOrder: 7, estimatedMinutes: 60, requiresShutdown: false, safetyPermitRequired: true, workOrderId: wo1.id } }),
    // Tasks for WO-2026-0044: Vibration Analysis
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0044-01', description: 'Collect vibration data at all measurement points (DE, NDE, axial)', procedure: 'SOP-VIB-COL-001', status: 'COMPLETED', sequenceOrder: 1, estimatedMinutes: 45, actualMinutes: 40, requiresShutdown: false, safetyPermitRequired: false, workOrderId: wo3.id } }),
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0044-02', description: 'Analyze vibration spectra, identify fault frequencies', procedure: 'SOP-VIB-ANL-002', status: 'IN_PROGRESS', sequenceOrder: 2, estimatedMinutes: 60, requiresShutdown: false, safetyPermitRequired: false, workOrderId: wo3.id } }),
    gql(client, createMaintenanceTask, { input: { taskNumber: 'T-0044-03', description: 'Perform laser alignment check on compressor-driver coupling', procedure: 'SOP-ALN-LSR-001', status: 'PENDING', sequenceOrder: 3, estimatedMinutes: 90, requiresShutdown: true, safetyPermitRequired: false, workOrderId: wo3.id } }),
  ]);
  tasks.forEach((t) => log(`  ✅ ${t.taskNumber}`, colors.green));

  // ─── Inspection Records ───
  log('\n🔍 Creating Inspection Records...', colors.cyan);

  const inspections = await Promise.all([
    gql(client, createInspectionRecord, {
      input: {
        inspectionNumber: 'INS-2026-0101',
        inspectionType: 'VIBRATION_ANALYSIS',
        result: 'CONDITIONAL_PASS',
        findings: 'Elevated 1x vibration at DE bearing (4.2 mm/s vs 2.8 mm/s baseline). Spectrum shows slight misalignment signature.',
        recommendations: 'Schedule laser alignment check within 30 days. Continue monitoring weekly.',
        inspectionDate: '2026-03-15',
        nextDueDate: '2026-04-15',
        vibrationLevel: 4.2,
        temperatureReading: 78.5,
        equipmentId: pumpP101.id,
        inspectorId: personnel[3].id, // Maria Santos
      },
    }),
    gql(client, createInspectionRecord, {
      input: {
        inspectionNumber: 'INS-2026-0102',
        inspectionType: 'ULTRASONIC',
        result: 'FAIL',
        findings: 'Wall thinning detected on tube-side inlet nozzle. Minimum wall thickness 3.2mm vs required 4.5mm. Corrosion rate estimated at 0.4mm/year.',
        recommendations: 'Replace tube bundle at next available opportunity. Install corrosion coupons for monitoring.',
        inspectionDate: '2026-03-20',
        nextDueDate: '2026-09-20',
        wallThickness: 3.2,
        temperatureReading: 165.0,
        pressureReading: 12.5,
        equipmentId: hxE102.id,
        inspectorId: personnel[2].id, // James Okafor
      },
    }),
    gql(client, createInspectionRecord, {
      input: {
        inspectionNumber: 'INS-2026-0103',
        inspectionType: 'VIBRATION_ANALYSIS',
        result: 'REQUIRES_FOLLOWUP',
        findings: 'Increasing 1x amplitude trend on DE bearing over last 3 months. Current level 5.8 mm/s (alert at 6.5 mm/s). Bearing defect frequency not yet present.',
        recommendations: 'Increase monitoring frequency to daily. Plan bearing replacement during next scheduled outage.',
        inspectionDate: '2026-04-01',
        nextDueDate: '2026-04-08',
        vibrationLevel: 5.8,
        temperatureReading: 92.3,
        equipmentId: compC201.id,
        inspectorId: personnel[3].id,
      },
    }),
    gql(client, createInspectionRecord, {
      input: {
        inspectionNumber: 'INS-2026-0104',
        inspectionType: 'PRESSURE_TEST',
        result: 'PASS',
        findings: 'PSV set pressure verified at 15.5 barg (design: 15.5 barg). Seat leakage test passed. Blowdown within spec at 10%.',
        recommendations: 'No action required. Next certification due in 12 months.',
        inspectionDate: '2026-01-05',
        nextDueDate: '2027-01-05',
        pressureReading: 15.5,
        equipmentId: valvePSV401.id,
        inspectorId: personnel[2].id,
      },
    }),
    gql(client, createInspectionRecord, {
      input: {
        inspectionNumber: 'INS-2026-0105',
        inspectionType: 'THERMOGRAPHIC',
        result: 'PASS',
        findings: 'Thermal imaging of separator vessel shows uniform temperature distribution. No hot spots or insulation defects detected.',
        recommendations: 'Continue annual thermographic survey schedule.',
        inspectionDate: '2026-02-10',
        nextDueDate: '2027-02-10',
        temperatureReading: 45.2,
        pressureReading: 8.3,
        equipmentId: vesselV301.id,
        inspectorId: personnel[2].id,
      },
    }),
  ]);
  inspections.forEach((i) => log(`  ✅ ${i.inspectionNumber}`, colors.green));

  // ─── Summary ───
  log('\n' + '═'.repeat(60), colors.bright);
  log('📊 Data Load Summary', colors.bright);
  log('═'.repeat(60), colors.bright);
  log(`  Facilities:         2`, colors.yellow);
  log(`  Areas:              5`, colors.yellow);
  log(`  Systems:            6`, colors.yellow);
  log(`  Equipment:          7`, colors.yellow);
  log(`  Components:         9`, colors.yellow);
  log(`  Personnel:          6`, colors.yellow);
  log(`  Work Orders:        5`, colors.yellow);
  log(`  Maintenance Tasks: 10`, colors.yellow);
  log(`  Inspection Records: 5`, colors.yellow);
  log(`  ${'─'.repeat(28)}`, colors.yellow);
  log(`  Total Records:     55`, colors.bright);
  log('═'.repeat(60) + '\n', colors.bright);

  log('🎉 Sample data loaded successfully!', colors.green);
  log('Try querying with: pnpm tsx scripts/runGraphql.ts -- interactive\n', colors.cyan);
}

async function main() {
  log('🛢️  Oil & Gas Maintenance Demo - Data Loader', colors.bright);
  log('═'.repeat(50) + '\n', colors.bright);

  log('🔧 Setting up Amplify environment...', colors.cyan);
  const envResult = await setAmplifyEnvVars();
  if (!envResult.success) {
    log('❌ Failed to set up Amplify environment. Is your sandbox running?', colors.red);
    process.exit(1);
  }
  log('✅ Amplify environment configured\n', colors.green);

  const client = getConfiguredAmplifyClient();
  await loadData(client);
}

main().catch((err) => {
  log(`\n❌ Fatal error: ${err.message || err}`, colors.red);
  process.exit(1);
});
