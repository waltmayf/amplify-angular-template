#!/usr/bin/env tsx
/**
 * Deletes ALL records from every model in the schema.
 * Deletes in reverse dependency order to avoid orphan issues.
 */
import { setAmplifyEnvVars, getConfiguredAmplifyClient } from '../utils/amplifyUtils';

const colors = { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', cyan: '\x1b[36m', bright: '\x1b[1m' };
function log(msg: string, c = colors.reset) { console.log(`${c}${msg}${colors.reset}`); }

async function deleteAll(client: any, modelName: string, listQuery: string, deleteMutation: string) {
  let total = 0;
  let hasMore = true;
  while (hasMore) {
    const result = await client.graphql({ query: listQuery });
    const items = result.data[Object.keys(result.data)[0]]?.items || [];
    if (items.length === 0) { hasMore = false; break; }
    for (const item of items) {
      await client.graphql({ query: deleteMutation, variables: { input: { id: item.id } } });
      total++;
    }
  }
  return total;
}

// Order matters: delete children before parents
const models = [
  { name: 'MaintenanceTask', list: 'listMaintenanceTasks', delete: 'deleteMaintenanceTask' },
  { name: 'InspectionRecord', list: 'listInspectionRecords', delete: 'deleteInspectionRecord' },
  { name: 'WorkOrder', list: 'listWorkOrders', delete: 'deleteWorkOrder' },
  { name: 'Component', list: 'listComponents', delete: 'deleteComponent' },
  { name: 'Equipment', list: 'listEquipment', delete: 'deleteEquipment' },
  { name: 'System', list: 'listSystems', delete: 'deleteSystem' },
  { name: 'Personnel', list: 'listPersonnel', delete: 'deletePersonnel' },
  { name: 'Area', list: 'listAreas', delete: 'deleteArea' },
  { name: 'Facility', list: 'listFacilities', delete: 'deleteFacility' },
];

async function main() {
  log('🗑️  Clearing ALL data...', colors.bright);
  await setAmplifyEnvVars();
  const client = getConfiguredAmplifyClient();

  for (const m of models) {
    const listQ = `query { ${m.list} { items { id } } }`;
    const delQ = `mutation Del($input: Delete${m.name}Input!) { ${m.delete}(input: $input) { id } }`;
    const count = await deleteAll(client, m.name, listQ, delQ);
    log(`  ✅ ${m.name}: deleted ${count} records`, count > 0 ? colors.green : colors.cyan);
  }
  log('\n🧹 All data cleared.', colors.green);
}

main().catch((e) => { log(`❌ ${e.message || JSON.stringify(e, null, 2)}`, colors.red); process.exit(1); });
