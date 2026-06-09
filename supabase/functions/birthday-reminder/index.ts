import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async () => {
  const today = new Date()
  const { data: people, error } = await supabase
    .from('people')
    .select('*')
    .not('birthday', 'is', null)

  console.log('People found:', people?.length, error)
  if (!people || people.length === 0) {
    return new Response('No people found', { status: 200 })
  }

  const userBirthdays = {}
  for (const person of people) {
    const bday = new Date(person.birthday)
    bday.setFullYear(today.getFullYear())
    if (bday < today) bday.setFullYear(today.getFullYear() + 1)
    const daysUntil = Math.ceil((bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    console.log(person.name, 'daysUntil:', daysUntil)
    if (daysUntil <= 30) {
      if (!userBirthdays[person.user_id]) userBirthdays[person.user_id] = []
      userBirthdays[person.user_id].push({ ...person, daysUntil })
    }
  }

  for (const [userId, persons] of Object.entries(userBirthdays)) {
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const email = userData?.user?.email
    if (!email) continue
    const list = persons.sort((a, b) => a.daysUntil - b.daysUntil)
      .map(p => '- ' + p.name + ' (' + p.relationship + ') in ' + p.daysUntil + ' days')
      .join('\n')
    console.log('Sending to:', email)
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RESEND_API_KEY },
      body: JSON.stringify({
        from: 'Gift Ideas <onboarding@resend.dev>',
        to: email,
        subject: 'Upcoming birthdays in the next 30 days',
        text: 'Upcoming birthdays:\n\n' + list + '\n\nLog in to get gift ideas.'
      })
    })
    const emailData = await emailRes.json()
    console.log('Email response:', JSON.stringify(emailData))
  }
  return new Response('Done', { status: 200 })
})
