import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ session }) {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPerson, setNewPerson] = useState({ name: '', relationship: '', birthday: '', interests: '', notes: '' })
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [giftIdeas, setGiftIdeas] = useState('')
  const [generatingIdeas, setGeneratingIdeas] = useState(false)

  useEffect(() => {
    fetchPeople()
  }, [])

  const fetchPeople = async () => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('name')
    if (!error) setPeople(data)
    setLoading(false)
  }

  const addPerson = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('people')
      .insert([{ ...newPerson, user_id: session.user.id }])
    if (!error) {
      setNewPerson({ name: '', relationship: '', birthday: '', interests: '', notes: '' })
      setShowAddForm(false)
      fetchPeople()
    }
  }

  const deletePerson = async (id) => {
    await supabase.from('people').delete().eq('id', id)
    fetchPeople()
  }

  const generateGiftIdeas = async (person) => {
    setSelectedPerson(person)
    setGiftIdeas('')
    setGeneratingIdeas(true)

    const prompt = `Generate 5 thoughtful gift ideas for the following person:
Name: ${person.name}
Relationship: ${person.relationship}
Birthday: ${person.birthday || 'unknown'}
Interests: ${person.interests || 'not specified'}
Notes: ${person.notes || 'none'}

For each gift idea, give it a title and a one sentence explanation of why it suits them. Format as a numbered list.`

    try {
const response = await fetch('/api/generate-gift-ideas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ person })
})
const data = await response.json()
setGiftIdeas(data.result)    } catch (err) {
      setGiftIdeas('Error generating ideas. Please try again.')
    }
    setGeneratingIdeas(false)
  }

  const upcomingBirthdays = people.filter(p => {
    if (!p.birthday) return false
    const today = new Date()
    const bday = new Date(p.birthday)
    bday.setFullYear(today.getFullYear())
    if (bday < today) bday.setFullYear(today.getFullYear() + 1)
    const daysUntil = Math.ceil((bday - today) / (1000 * 60 * 60 * 24))
    return daysUntil <= 30
  })

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>🎁 Gift Ideas</h1>
        <div>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ marginRight: '1rem', padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            + Add Person
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      {upcomingBirthdays.length > 0 && (
        <div style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <strong>🎂 Upcoming birthdays (next 30 days):</strong>
          {upcomingBirthdays.map(p => <span key={p.id} style={{ marginLeft: '1rem' }}>{p.name}</span>)}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={addPerson} style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>Add a person</h3>
          {['name', 'relationship', 'birthday', 'interests', 'notes'].map(field => (
            <div key={field} style={{ marginBottom: '0.75rem' }}>
              <input
                type={field === 'birthday' ? 'date' : 'text'}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={newPerson[field]}
                onChange={e => setNewPerson({ ...newPerson, [field]: e.target.value })}
                required={field === 'name'}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Save
          </button>
        </form>
      )}

      <div>
        {people.length === 0 && <p style={{ color: '#666' }}>No people yet. Add someone to get started.</p>}
        {people.map(person => (
          <div key={person.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong>{person.name}</strong>
                {person.relationship && <span style={{ color: '#666', marginLeft: '0.5rem' }}>· {person.relationship}</span>}
                {person.birthday && <span style={{ color: '#666', marginLeft: '0.5rem' }}>· 🎂 {person.birthday}</span>}
                {person.interests && <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.9rem' }}>{person.interests}</p>}
              </div>
              <div>
                <button onClick={() => generateGiftIdeas(person)} style={{ marginRight: '0.5rem', padding: '0.4rem 0.75rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  💡 Gift ideas
                </button>
                <button onClick={() => deletePerson(person.id)} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPerson && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', backgroundColor: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', padding: '2rem', overflowY: 'auto' }}>
          <button onClick={() => setSelectedPerson(null)} style={{ marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          <h2>Gift ideas for {selectedPerson.name}</h2>
          {generatingIdeas ? <p>Thinking...</p> : <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', lineHeight: '1.6' }}>{giftIdeas}</pre>}
        </div>
      )}
    </div>
  )
}
