export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { person } = req.body

  const prompt = `Generate 5 thoughtful gift ideas for ${person.name} (${person.relationship}). Their interests: ${person.interests || 'not specified'}. Notes: ${person.notes || 'none'}. Format as a numbered list with a title and one sentence explanation each.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  console.log('Anthropic response:', JSON.stringify(data))
  if (!data.content) {
    return res.status(500).json({ error: data })
  }
  res.status(200).json({ result: data.content[0].text })
}
