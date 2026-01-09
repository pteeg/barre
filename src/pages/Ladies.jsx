import React, { useState, useEffect } from 'react'
import './Ladies.css'
import { subscribeToGirlies, addGirly, updateGirly, deleteGirly } from '../firebase/girlies'
import { subscribeToClasses } from '../firebase/classes'

function Ladies() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedLadyId, setSelectedLadyId] = useState(null)
  const [ladies, setLadies] = useState([])
  const [classes, setClasses] = useState([])
  const [firstName, setFirstName] = useState('')
  const [secondName, setSecondName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customCredits, setCustomCredits] = useState('')
  const [editFirstName, setEditFirstName] = useState('')
  const [editSecondName, setEditSecondName] = useState('')
  const [editPhoneNumber, setEditPhoneNumber] = useState('')
  const [editCredits, setEditCredits] = useState('')

  // Subscribe to Firestore changes for girlies
  useEffect(() => {
    const unsubscribe = subscribeToGirlies((girlies) => {
      setLadies(girlies)
    })
    return () => unsubscribe()
  }, [])

  // Subscribe to Firestore changes for classes
  useEffect(() => {
    const unsubscribe = subscribeToClasses((classesData) => {
      setClasses(classesData)
    })
    return () => unsubscribe()
  }, [])

  // Calculate remaining credits for a lady (after deducting classes where credit was used)
  // Any class with payment.type === 'credit' (past or upcoming) consumes a credit
  const getRemainingCredits = (ladyId) => {
    const lady = ladies.find(l => l.id === ladyId)
    if (!lady) return 0
    
    // Count how many classes (past or upcoming) they're in where a credit was used
    const classesWithCreditUsedAll = classes.filter(c => 
      (c.coming?.includes(ladyId) || c.waitingList?.includes(ladyId)) &&
      c.payments?.[ladyId]?.type === 'credit'
    ).length
    
    // Total credits minus all credits used = remaining credits
    const totalCredits = lady.credits || 0
    const remaining = totalCredits - classesWithCreditUsedAll
    
    return Math.max(0, remaining)
  }

  // Get credits in use (signed up for upcoming classes where credit was used)
  const getCreditsInUse = (ladyId) => {
    const now = new Date()
    const classesWithCreditUsed = classes.filter(c => 
      c.dateTime > now && 
      (c.coming?.includes(ladyId) || c.waitingList?.includes(ladyId)) &&
      c.payments?.[ladyId]?.type === 'credit'
    ).length
    return classesWithCreditUsed
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFirstName('')
    setSecondName('')
    setPhoneNumber('')
  }

  const handleAdd = async () => {
    if (firstName.trim()) {
      const fullName = secondName.trim() 
        ? `${firstName.trim()} ${secondName.trim()}` 
        : firstName.trim()
      try {
        await addGirly({
          name: fullName,
          firstName: firstName.trim(),
          secondName: secondName.trim(),
          phoneNumber: phoneNumber.trim(),
          credits: 0
        })
        handleCloseModal()
      } catch (error) {
        console.error('Error adding girly:', error)
        alert('Failed to add girly. Please try again.')
      }
    }
  }

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`
    }
  }

  const handleOpenCreditsModal = (ladyId) => {
    setSelectedLadyId(ladyId)
    const remainingCredits = getRemainingCredits(ladyId)
    setCustomCredits(String(remainingCredits))
    setIsCreditsModalOpen(true)
  }

  const handleCloseCreditsModal = () => {
    setIsCreditsModalOpen(false)
    setSelectedLadyId(null)
    setCustomCredits('')
  }

  const handleAddCredits = (amount) => {
    if (selectedLadyId !== null) {
      setLadies(ladies.map(lady => 
        lady.id === selectedLadyId 
          ? { ...lady, credits: (lady.credits || 0) + amount }
          : lady
      ))
      handleCloseCreditsModal()
    }
  }

  const handleCustomCredits = async () => {
    const amount = parseInt(customCredits)
    if (!isNaN(amount) && amount >= 0 && selectedLadyId !== null) {
      const lady = ladies.find(l => l.id === selectedLadyId)
      if (lady) {
        try {
          await updateGirly(selectedLadyId, {
            name: lady.name,
            firstName: lady.firstName || lady.name.split(' ')[0],
            secondName: lady.secondName || lady.name.split(' ').slice(1).join(' '),
            phoneNumber: lady.phoneNumber || '',
            credits: amount
          })
          handleCloseCreditsModal()
        } catch (error) {
          console.error('Error updating credits:', error)
          alert('Failed to update credits. Please try again.')
        }
      }
    }
  }

  const handleOpenEditModal = (lady) => {
    setSelectedLadyId(lady.id)
    // Use firstName/secondName if available, otherwise split name
    setEditFirstName(lady.firstName || lady.name.split(' ')[0] || '')
    setEditSecondName(lady.secondName || lady.name.split(' ').slice(1).join(' ') || '')
    setEditPhoneNumber(lady.phoneNumber || '')
    setEditCredits(String(lady.credits || 0))
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedLadyId(null)
    setEditFirstName('')
    setEditSecondName('')
    setEditPhoneNumber('')
    setEditCredits('')
  }

  const handleSaveEdit = async () => {
    if (selectedLadyId !== null && editFirstName.trim()) {
      const fullName = editSecondName.trim() 
        ? `${editFirstName.trim()} ${editSecondName.trim()}` 
        : editFirstName.trim()
      const credits = parseInt(editCredits) || 0
      try {
        await updateGirly(selectedLadyId, {
          name: fullName,
          firstName: editFirstName.trim(),
          secondName: editSecondName.trim(),
          phoneNumber: editPhoneNumber.trim(),
          credits: credits
        })
        handleCloseEditModal()
      } catch (error) {
        console.error('Error updating girly:', error)
        alert('Failed to update girly. Please try again.')
      }
    }
  }

  const handleDeleteGirly = async () => {
    if (!selectedLadyId) return
    const lady = ladies.find(l => l.id === selectedLadyId)
    const confirmDelete = window.confirm(
      lady
        ? `Remove ${lady.name} from your girlies list?`
        : 'Remove this girly from your girlies list?'
    )
    if (!confirmDelete) return

    try {
      await deleteGirly(selectedLadyId)
      handleCloseEditModal()
    } catch (error) {
      console.error('Error deleting girly:', error)
      alert('Failed to remove girly. Please try again.')
    }
  }

  const handleOpenDetailsModal = (lady) => {
    setSelectedLadyId(lady.id)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedLadyId(null)
  }

  return (
    <div className="page">
      <div className="page-content">
        <div className="ladies-header">
          <h1 className="ladies-title">Girlies • {ladies.length}</h1>
          <button className="add-girly-btn" onClick={handleOpenModal}>
            + Add a Girly
          </button>
        </div>

        <div className="ladies-list">
          {ladies.map((lady) => (
            <div 
              key={lady.id} 
              className="lady-tile"
              onClick={() => handleOpenDetailsModal(lady)}
              style={{ cursor: 'pointer' }}
            >
              <div className="lady-info">
                <div className="lady-name">
                  <span className="lady-first-name">{lady.firstName || lady.name.split(' ')[0]}</span>
                  <span className="lady-surname">{lady.secondName || lady.name.split(' ').slice(1).join(' ')}</span>
                </div>
                {lady.phoneNumber && (
                  <span 
                    className="lady-phone"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCall(lady.phoneNumber)
                    }}
                  >
                    {lady.phoneNumber}
                  </span>
                )}
              </div>
              <div className="lady-actions">
                {(() => {
                  const remainingCredits = getRemainingCredits(lady.id)
                  const creditsInUse = getCreditsInUse(lady.id)
                  const totalCredits = lady.credits || 0
                  
                  return (
                    <>
                      <span className="lady-credits">
                        {remainingCredits} {remainingCredits === 1 ? 'credit' : 'credits'} remaining
                        {creditsInUse > 0 && (
                          <span className="lady-credits-in-use">
                            (+ {creditsInUse} {creditsInUse === 1 ? 'credit' : 'credits'} in use)
                          </span>
                        )}
                      </span>
                    </>
                  )
                })()}
                <button 
                  className="add-credits-btn" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenCreditsModal(lady.id)
                  }}
                >
                  <span className="add-credits-text">+ Add Credits</span>
                  <span className="add-credits-icon">+</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {isModalOpen && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Add a Girly</h2>
              <div className="modal-form">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="secondName">Second Name</label>
                  <input
                    type="text"
                    id="secondName"
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    placeholder="Enter second name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button className="add-btn" onClick={handleAdd}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isDetailsModalOpen && selectedLadyId && (() => {
          const lady = ladies.find(l => l.id === selectedLadyId)
          if (!lady) return null
          const remainingCredits = getRemainingCredits(lady.id)
          const creditsInUse = getCreditsInUse(lady.id)
          const totalCredits = lady.credits || 0
          return (
            <div className="modal-overlay" onClick={handleCloseDetailsModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Girly Details</h2>
                  <button
                    className="modal-close-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseDetailsModal()
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div className="modal-form">
                  <div className="form-group">
                    <label>Name</label>
                    <p>{lady.name}</p>
                  </div>
                  {lady.phoneNumber && (
                    <div className="form-group">
                      <label>Phone</label>
                      <p>{lady.phoneNumber}</p>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Credits</label>
                    <p>
                      {remainingCredits} {remainingCredits === 1 ? 'credit' : 'credits'} remaining
                      {totalCredits > 0 && creditsInUse > 0 && (
                        <> (+ {creditsInUse} {creditsInUse === 1 ? 'credit' : 'credits'} in use)</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="modal-buttons">
                  <button
                    className="add-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseDetailsModal()
                      handleOpenEditModal(lady)
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {isCreditsModalOpen && (
          <div className="modal-overlay" onClick={handleCloseCreditsModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Add Credits</h2>
              <div className="modal-form">
                <div className="form-group">
                  <input
                    type="number"
                    id="customCredits"
                    value={customCredits}
                    onChange={(e) => setCustomCredits(e.target.value)}
                    placeholder="Enter number of credits"
                    min="1"
                  />
                </div>
                <div className="credits-options">
                  <button 
                    className="credit-option-btn" 
                    onClick={() => {
                      const current = parseInt(customCredits) || 0
                      setCustomCredits(String(current + 5))
                    }}
                  >
                    +5
                  </button>
                </div>
                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={handleCloseCreditsModal}>
                    Cancel
                  </button>
                  <button 
                    className="add-btn" 
                    onClick={handleCustomCredits}
                    disabled={!customCredits || parseInt(customCredits) <= 0}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isEditModalOpen && (
          <div className="modal-overlay" onClick={handleCloseEditModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Edit Girly</h2>
                <button
                  className="remove-girly-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteGirly()
                  }}
                >
                  Remove
                </button>
              </div>
              <div className="modal-form">
                <div className="form-group">
                  <label htmlFor="editFirstName">First Name</label>
                  <input
                    type="text"
                    id="editFirstName"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editSecondName">Second Name</label>
                  <input
                    type="text"
                    id="editSecondName"
                    value={editSecondName}
                    onChange={(e) => setEditSecondName(e.target.value)}
                    placeholder="Enter second name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editPhoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="editPhoneNumber"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editCredits">Credits</label>
                  <input
                    type="number"
                    id="editCredits"
                    value={editCredits}
                    onChange={(e) => setEditCredits(e.target.value)}
                    placeholder="Enter number of credits"
                    min="0"
                  />
                </div>
                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={handleCloseEditModal}>
                    Cancel
                  </button>
                  <button 
                    className="add-btn" 
                    onClick={handleSaveEdit}
                    disabled={!editFirstName.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Ladies
