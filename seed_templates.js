import { INITIAL_TEMPLATES } from './src/data/mockData.js'

async function seed() {
  for (const tpl of INITIAL_TEMPLATES) {
    try {
      const res = await fetch('http://localhost:5000/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tpl),
      })
      const data = await res.json()
      console.log('Seeded:', tpl.name, data)
    } catch (e) {
      console.error('Error seeding:', tpl.name, e.message)
    }
  }
}

seed()
