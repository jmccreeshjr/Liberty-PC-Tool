const projects = [
  {
    name: 'Penn Medicine Cardiac Wing',
    number: '25-0142',
    phase: 5,
    status: 'On Track',
    contractValue: 2450000,
    billingPercent: 45,
    sopComplete: 78,
    openItems: 3
  },
  {
    name: 'Temple University STEM Building',
    number: '25-0187',
    phase: 3,
    status: 'At Risk',
    contractValue: 1820000,
    billingPercent: 0,
    sopComplete: 55,
    openItems: 7
  },
  {
    name: 'Reading Terminal Market Renovation',
    number: '25-0093',
    phase: 7,
    status: 'Overdue',
    contractValue: 890000,
    billingPercent: 82,
    sopComplete: 91,
    openItems: 5
  },
  {
    name: 'Amazon Data Center — Phase 2',
    number: '26-0011',
    phase: 2,
    status: 'On Track',
    contractValue: 4100000,
    billingPercent: 0,
    sopComplete: 30,
    openItems: 2
  },
  {
    name: 'Philadelphia Gov Center Electrical Upgrade',
    number: '25-0201',
    phase: 4,
    status: 'On Track',
    contractValue: 3250000,
    billingPercent: 12,
    sopComplete: 62,
    openItems: 4
  },
  {
    name: 'Rhoads Navy Yard Industrial',
    number: '25-0155',
    phase: 8,
    status: 'On Track',
    contractValue: 680000,
    billingPercent: 95,
    sopComplete: 88,
    openItems: 1
  }
]

async function seed() {
  console.log('Seeding projects...')
  for (const project of projects) {
    const res = await fetch('https://liberty-pc-tool-api.onrender.com/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    })
    const data = await res.json()
    console.log('Added:', data.name)
  }
  console.log('Done!')
}

seed()