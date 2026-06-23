import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS = 'Goldfish Gifter <hello@goldfishgifter.com>'

export default async function handler(req, res) {
  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const today = new Date()

  const { data: people, error } = await supabase
    .from('people')
    .select('*')
    .not('birthday', 'is', null)

  if (error) {
    console.error('Supabase query failed:', error)
    return res.status(500).json({ error: error.message })
  }

  if (!people || people.length === 0) {
    return res.status(200).json({ message: 'No people found', sent: 0 })
  }

  const userBirthdays = {}
  for (const person of people) {
    const bday = new Date(person.birthday)
    bday.setFullYear(today.getFullYear())
    if (bday < today) bday.setFullYear(today.getFullYear() + 1)
    const daysUntil = Math.ceil((bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 30) {
      if (!userBirthdays[person.user_id]) userBirthdays[person.user_id] = []
      userBirthdays[person.user_id].push({ ...person, daysUntil })
    }
  }

  let sentCount = 0
  const failures = []

  for (const [userId, persons] of Object.entries(userBirthdays)) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    const email = userData?.user?.email
    if (!email || userError) {
      failures.push({ userId, reason: 'no email found' })
      continue
    }

    const list = persons
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .map(p => `- ${p.name} (${p.relationship}) in ${p.daysUntil} day${p.daysUntil === 1 ? '' : 's'}`)
      .join('\n')

    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: email,
          subject: 'Upcoming birthdays in the next 30 days 🐠',
          text: `Heads up — here's who's coming up:\n\n${list}\n\nLog in to Goldfish Gifter for gift ideas: https://www.goldfishgifter.com`
        })
      })

      if (!emailRes.ok) {
        const errBody = await emailRes.text()
        failures.push({ userId, email, reason: errBody })
        continue
      }

      sentCount++
    } catch (err) {
      failures.push({ userId, email, reason: err.message })
    }
  }

  return res.status(200).json({
    message: 'Reminder run complete',
    sent: sentCount,
    failures
  })
}
