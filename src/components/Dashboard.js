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

    try {
      const response = await fetch('/api/generate-gift-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person })
      })
      const data = await response.json()
      setGiftIdeas(data.result)
    } catch (err) {
      setGiftIdeas('Something went wrong generating ideas. Try again in a moment.')
    }
    setGeneratingIdeas(false)
  }

  const daysUntilBirthday = (birthday) => {
    const today = new Date()
    const bday = new Date(birthday)
    bday.setFullYear(today.getFullYear())
    if (bday < today) bday.setFullYear(today.getFullYear() + 1)
    return Math.ceil((bday - today) / (1000 * 60 * 60 * 24))
  }

  const upcomingBirthdays = people.filter(p => p.birthday && daysUntilBirthday(p.birthday) <= 30)

  if (loading) return <div className="page-loading">Loading…</div>

  return (
    <div className="page">
      <div className="shell">
        <div className="dash-header">
          <h1 className="dash-title">Gift Ideas</h1>
          <div className="dash-actions">
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-accent">
              Add person
            </button>
            <button onClick={() => supabase.auth.signOut()} className="btn-quiet">
              Sign out
            </button>
          </div>
        </div>

        {upcomingBirthdays.length > 0 && (
          <div className="birthday-banner">
            <span className="birthday-banner-label">Coming up: </span>
            <span className="birthday-names">
              {upcomingBirthdays.map((p, i) => (
                <React.Fragment key={p.id}>
                  {i > 0 && <span className="sep">·</span>}
                  {p.name}
                </React.Fragment>
              ))}
            </span>
          </div>
        )}

        {showAddForm && (
          <form onSubmit={addPerson} className="add-form">
            <h3>Add a person</h3>
            {['name', 'relationship', 'birthday', 'interests', 'notes'].map(field => (
              <div key={field} className="field">
                <input
                  type={field === 'birthday' ? 'date' : 'text'}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={newPerson[field]}
                  onChange={e => setNewPerson({ ...newPerson, [field]: e.target.value })}
                  required={field === 'name'}
                />
              </div>
            ))}
            <button type="submit" className="btn-primary">Save</button>
          </form>
        )}

        <div className="person-list">
          {people.length === 0 && (
            <p className="empty-state">No one here yet. Add the first person you want to remember well.</p>
          )}
          {people.map(person => {
            const days = person.birthday ? daysUntilBirthday(person.birthday) : null
            const showStub = days !== null && days <= 30
            return (
              <div key={person.id} className="person-card">
                <div className="person-card-main">
                  {showStub && (
                    <div className="days-stub">
                      <span className="days-stub-num">{days}</span>
                      <span className="days-stub-label">{days === 1 ? 'day' : 'days'}</span>
                    </div>
                  )}
                  <div className="person-info">
                    <div className="person-name-row">
                      <span className="person-name">{person.name}</span>
                      {person.relationship && <span className="person-meta">{person.relationship}</span>}
                      {person.birthday && !showStub && <span className="person-meta">{person.birthday}</span>}
                    </div>
                    {person.interests && <p className="person-interests">{person.interests}</p>}
                  </div>
                </div>
                <div className="person-card-actions">
                  <button onClick={() => generateGiftIdeas(person)} className="btn-ideas">
                    Gift ideas
                  </button>
                  <button onClick={() => deletePerson(person.id)} className="btn-remove">
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedPerson && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedPerson(null)} />
          <div className="drawer">
            <button onClick={() => setSelectedPerson(null)} className="drawer-close">✕</button>
            <h2 className="drawer-title">Gift ideas for {selectedPerson.name}</h2>
            {generatingIdeas ? (
              <p className="drawer-loading">Thinking…</p>
            ) : (
              <pre className="drawer-content">{giftIdeas}</pre>
            )}
          </div>
        </>
      )}
    </div>
  )
}
