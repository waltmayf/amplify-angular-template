#!/usr/bin/env tsx
/**
 * Verify loaded sample data with a deep hierarchical query.
 */
import { setAmplifyEnvVars, getConfiguredAmplifyClient } from '../utils/amplifyUtils';

async function main() {
  await setAmplifyEnvVars();
  const client = getConfiguredAmplifyClient();

  // Deep hierarchy query: Facility → Area → System → Equipment → Components/WorkOrders/Inspections
  const deepQuery = `query {
    listFacilities {
      items {
        name
        facilityCode
        type
        status
        personnel { items { name role } }
        areas {
          items {
            name
            areaCode
            hazardClassification
            systems {
              items {
                name
                systemCode
                criticality
                equipment {
                  items {
                    equipmentTag
                    name
                    healthStatus
                    components { items { componentTag name condition } }
                    workOrders {
                      items {
                        workOrderNumber
                        status
                        priority
                        type
                        tasks { items { taskNumber status } }
                        assignedTo { name role }
                      }
                    }
                    inspectionRecords {
                      items {
                        inspectionNumber
                        inspectionType
                        result
                        findings
                        inspector { name }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

  console.log('⚡ Running deep hierarchical verification query...\n');
  const result = await client.graphql({ query: deepQuery });

  if (result.errors?.length) {
    console.error('❌ Errors:', JSON.stringify(result.errors, null, 2));
    process.exit(1);
  }

  const facilities = result.data.listFacilities.items;
  console.log(JSON.stringify(facilities, null, 2));

  // Summary counts
  let areas = 0, systems = 0, equipment = 0, components = 0, workOrders = 0, tasks = 0, inspections = 0, personnel = 0;
  for (const f of facilities) {
    personnel += f.personnel?.items?.length || 0;
    for (const a of f.areas?.items || []) {
      areas++;
      for (const s of a.systems?.items || []) {
        systems++;
        for (const e of s.equipment?.items || []) {
          equipment++;
          components += e.components?.items?.length || 0;
          for (const wo of e.workOrders?.items || []) {
            workOrders++;
            tasks += wo.tasks?.items?.length || 0;
          }
          inspections += e.inspectionRecords?.items?.length || 0;
        }
      }
    }
  }

  console.log('\n✅ Verification Summary:');
  console.log(`  Facilities: ${facilities.length}`);
  console.log(`  Personnel:  ${personnel}`);
  console.log(`  Areas:      ${areas}`);
  console.log(`  Systems:    ${systems}`);
  console.log(`  Equipment:  ${equipment}`);
  console.log(`  Components: ${components}`);
  console.log(`  WorkOrders: ${workOrders}`);
  console.log(`  Tasks:      ${tasks}`);
  console.log(`  Inspections:${inspections}`);
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
