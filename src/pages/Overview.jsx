import React, { useState, useEffect, useRef } from 'react'
import './Overview.css'
import './Classes.css'
import { subscribeToClasses, updateClass } from '../firebase/classes'
import { subscribeToGirlies, addGirly, updateGirly } from '../firebase/girlies'
import ClassTile from '../components/ClassTile'

function Overview() {
  const [classes, setClasses] = useState([])
  const [girlies, setGirlies] = useState([])
  const [selectedTab, setSelectedTab] = useState('coming') // 'coming' or 'waitlist' for Next Class
  const [recentTab, setRecentTab] = useState('coming') // 'coming' or 'waitlist' for Most Recent Class
  const [isAddGirliesModalOpen, setIsAddGirliesModalOpen] = useState(false)
  const [isAddGirlyModalOpen, setIsAddGirlyModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isEllipsesModalOpen, setIsEllipsesModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedGirlyForDetails, setSelectedGirlyForDetails] = useState(null)
  const [addToListType, setAddToListType] = useState(null) // 'coming' or 'waiting'
  const [addToClassId, setAddToClassId] = useState(null) // Track which class we're adding girlies to
  const [expandedClassId, setExpandedClassId] = useState(null) // For modals - tracks which class is being edited
  const [isNextClassExpanded, setIsNextClassExpanded] = useState(true) // Next class is always expanded by default
  const [isLastClassExpanded, setIsLastClassExpanded] = useState(false) // Most recent class starts collapsed
  const isAddingGirliesRef = useRef(false) // Track if we're in the process of adding girlies
  const [selectedGirlyForPayment, setSelectedGirlyForPayment] = useState(null)
  const [selectedGirlyForEllipses, setSelectedGirlyForEllipses] = useState(null)
  const [selectedGirlies, setSelectedGirlies] = useState([])
  const [newGirlyFirstName, setNewGirlyFirstName] = useState('')
  const [newGirlySecondName, setNewGirlySecondName] = useState('')
  const [newGirlyPhoneNumber, setNewGirlyPhoneNumber] = useState('')
  const [paymentType, setPaymentType] = useState(null) // 'credit', 'oneoff', 'addCredits'
  const [oneOffPaid, setOneOffPaid] = useState(null)
  const [creditsToAdd, setCreditsToAdd] = useState('')
  // Subscribe to Firestore changes for classes
  useEffect(() => {
    const unsubscribe = subscribeToClasses((classesData) => {
      setClasses(classesData)
    })
    return () => unsubscribe()
  }, [])

  // Subscribe to Firestore changes for girlies
  useEffect(() => {
    const unsubscribe = subscribeToGirlies((girliesData) => {
      setGirlies(girliesData)
    })
    return () => unsubscribe()
  }, [])

  // Calculate remaining credits for a girly
  // Any class with payment.type === 'credit' (past or upcoming) consumes a credit
  const getRemainingCredits = (girlyId) => {
    const girly = girlies.find(g => g.id === girlyId)
    if (!girly) return 0
    
    // Count how many classes (past or upcoming) they're in where a credit was used
    // Only count credits for people in 'coming' list, not 'waitingList' (waiting list doesn't use credits)
    const classesWithCreditUsedAll = classes.filter(c => 
      c.coming?.includes(girlyId) &&
      c.payments?.[girlyId]?.type === 'credit'
    ).length
    
    // Total credits minus all credits used = remaining credits
    const totalCredits = girly.credits || 0
    const remaining = totalCredits - classesWithCreditUsedAll
    
    return Math.max(0, remaining)
  }

  // Get next class
  const now = new Date()
  const upcomingClasses = classes
    .filter(c => c.dateTime > now)
    .sort((a, b) => a.dateTime - b.dateTime)
  const nextClass = upcomingClasses[0]

  // Get most recent past class
  const pastClasses = classes
    .filter(c => c.dateTime <= now)
    .sort((a, b) => b.dateTime - a.dateTime)
  const lastClass = pastClasses[0]

  // Get credits in use (signed up for upcoming classes where credit was used)
  const getCreditsInUse = (girlyId) => {
    const now = new Date()
    // Only count credits for people in 'coming' list, not 'waitingList' (waiting list doesn't use credits)
    const classesWithCreditUsed = classes.filter(c => 
      c.dateTime > now && 
      c.coming?.includes(girlyId) &&
      c.payments?.[girlyId]?.type === 'credit'
    ).length
    return classesWithCreditUsed
  }

  const getPaymentStatus = (girlyId, classItem) => {
    const payment = classItem.payments?.[girlyId]
    if (!payment) return null
    
    if (payment.type === 'credit') {
      return 'Credit used'
    } else if (payment.type === 'oneoff') {
      if (payment.paid) {
        return 'Paid'
      } else {
        const count = payment.oneOffCount || 1
        return `Owes x${count}`
      }
    }
    return null
  }

  const handleOpenPaymentModal = (girlyId, e, classId = null) => {
    e.stopPropagation()
    setSelectedGirlyForPayment(girlyId)
    
    // classId is required - it tells us which class we're working with
    const targetClassId = classId
    if (!targetClassId) return
    
    const classItem = classes.find(c => c.id === targetClassId)
    const payment = classItem?.payments?.[girlyId]
    
    // Set expandedClassId for modal operations
    setExpandedClassId(targetClassId)
    
    if (payment && payment.type === 'credit') {
      // Show only clear payment option for credit used
      setPaymentType('clearCredit')
      setOneOffPaid(null)
    } else if (payment && payment.type === 'oneoff' && payment.paid === false) {
      setPaymentType('oneoff')
      setOneOffPaid(false)
    } else {
      setPaymentType(null)
      setOneOffPaid(null)
    }
    
    setCreditsToAdd('')
    setIsPaymentModalOpen(true)
  }

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false)
    setSelectedGirlyForPayment(null)
    setPaymentType(null)
    setOneOffPaid(null)
    setCreditsToAdd('')
  }

  const handleOpenEllipsesModal = (girlyId, e) => {
    e.stopPropagation()
    setSelectedGirlyForEllipses(girlyId)
    setIsEllipsesModalOpen(true)
  }

  const handleCloseEllipsesModal = () => {
    setIsEllipsesModalOpen(false)
    setSelectedGirlyForEllipses(null)
  }

  const handleOpenDetailsModal = (girlyId) => {
    setSelectedGirlyForDetails(girlyId)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedGirlyForDetails(null)
  }

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`
    }
  }

  const handleUseCredit = async () => {
    const targetClassId = expandedClassId
    if (targetClassId && selectedGirlyForPayment) {
      const classItem = classes.find(c => c.id === targetClassId)
      if (!classItem) return

      const girly = girlies.find(g => g.id === selectedGirlyForPayment)
      if (!girly || girly.credits <= 0) return

      const payments = { ...(classItem.payments || {}) }
      const existingPayment = payments[selectedGirlyForPayment]

      try {
        if (existingPayment && existingPayment.type === 'credit') {
          handleClosePaymentModal()
          return
        }

        payments[selectedGirlyForPayment] = { type: 'credit', status: 'used' }
        await updateClass(targetClassId, { payments })
        
        handleClosePaymentModal()
      } catch (error) {
        console.error('Error using credit:', error)
        alert('Failed to use credit. Please try again.')
      }
    }
  }

  const handleSavePayment = async () => {
    if (expandedClassId && selectedGirlyForPayment) {
      const classItem = classes.find(c => c.id === expandedClassId)
      if (!classItem) return

      const payments = { ...(classItem.payments || {}) }
      const girly = girlies.find(g => g.id === selectedGirlyForPayment)
      
      try {
        if (paymentType === 'credit') {
          payments[selectedGirlyForPayment] = { type: 'credit', status: 'used' }
          await updateClass(expandedClassId, { payments })
        } else if (paymentType === 'oneoff') {
          if (oneOffPaid === null) {
            return
          }
          const existingOneOffPayment = payments[selectedGirlyForPayment]
          if (existingOneOffPayment && existingOneOffPayment.type === 'oneoff') {
            payments[selectedGirlyForPayment] = { 
              type: 'oneoff', 
              paid: oneOffPaid,
              oneOffCount: oneOffPaid ? existingOneOffPayment.oneOffCount : existingOneOffPayment.oneOffCount + 1
            }
          } else {
            payments[selectedGirlyForPayment] = { 
              type: 'oneoff', 
              paid: oneOffPaid,
              oneOffCount: oneOffPaid ? 0 : 1
            }
          }
          await updateClass(expandedClassId, { payments })
        } else if (paymentType === 'addCredits') {
          const targetAmount = parseInt(creditsToAdd)
          if (!isNaN(targetAmount) && targetAmount >= 0 && girly) {
            await updateGirly(selectedGirlyForPayment, {
              name: girly.name,
              firstName: girly.firstName || girly.name.split(' ')[0],
              secondName: girly.secondName || girly.name.split(' ').slice(1).join(' '),
              phoneNumber: girly.phoneNumber || '',
              credits: targetAmount
            })
            setPaymentType(null)
            setCreditsToAdd('')
            return
          }
        }
        handleClosePaymentModal()
      } catch (error) {
        console.error('Error saving payment:', error)
        alert('Failed to save payment. Please try again.')
      }
    }
  }

  const handleMoveToWaitlist = async () => {
    if (expandedClassId && selectedGirlyForEllipses) {
      const classItem = classes.find(c => c.id === expandedClassId)
      if (!classItem) return

      try {
        // Remove from coming, add to waitlist
        const coming = (classItem.coming || []).filter(id => id !== selectedGirlyForEllipses)
        const waitingList = [...new Set([...(classItem.waitingList || []), selectedGirlyForEllipses])]
        
        // Clear ALL payment types when moving to waiting list (waiting list doesn't use credits or have payments)
        const payments = { ...(classItem.payments || {}) }
        if (payments[selectedGirlyForEllipses]) {
          delete payments[selectedGirlyForEllipses]
        }
        
        await updateClass(expandedClassId, {
          coming,
          waitingList,
          payments
        })
        
        handleCloseEllipsesModal()
      } catch (error) {
        console.error('Error moving to waitlist:', error)
        alert('Failed to move to waitlist. Please try again.')
      }
    }
  }

  const handleMoveToClass = async (girlyId = null, classId = null) => {
    const targetGirlyId = girlyId || selectedGirlyForEllipses
    const targetClassId = classId || expandedClassId
    
    if (!targetClassId || !targetGirlyId) return

    const classItem = classes.find(c => c.id === targetClassId)
    if (!classItem) return

    const girly = girlies.find(g => g.id === targetGirlyId)
    if (!girly) return

    try {
      // Remove from waitlist, add to coming
      const waitingList = (classItem.waitingList || []).filter(id => id !== targetGirlyId)
      const coming = [...new Set([...(classItem.coming || []), targetGirlyId])]
      
      // For upcoming classes, MUST use credit if available
      const payments = { ...(classItem.payments || {}) }
      const now = new Date()
      const isUpcomingOrPrevious = classItem.dateTime && classItem.dateTime.toDate ? classItem.dateTime.toDate() : new Date(classItem.dateTime)
      const isUpcoming = isUpcomingOrPrevious > now
      
      if (isUpcoming && girly.credits > 0 && !payments[targetGirlyId]) {
        payments[targetGirlyId] = { type: 'credit', status: 'used' }
      }
      
      await updateClass(targetClassId, {
        coming,
        waitingList,
        payments
      })
      
      if (!girlyId) {
        // Only close modal if called from ellipses menu
        handleCloseEllipsesModal()
      }
    } catch (error) {
      console.error('Error moving to class:', error)
      alert('Failed to move to class. Please try again.')
    }
  }

  const handleCancelGirly = async () => {
    if (expandedClassId && selectedGirlyForEllipses) {
      const classItem = classes.find(c => c.id === expandedClassId)
      if (!classItem) return

      try {
        const coming = (classItem.coming || []).filter(id => id !== selectedGirlyForEllipses)
        const waitingList = (classItem.waitingList || []).filter(id => id !== selectedGirlyForEllipses)
        const payments = { ...(classItem.payments || {}) }
        delete payments[selectedGirlyForEllipses]
        
        await updateClass(expandedClassId, {
          coming,
          waitingList,
          payments
        })
        
        handleCloseEllipsesModal()
      } catch (error) {
        console.error('Error cancelling girly:', error)
        alert('Failed to cancel girly. Please try again.')
      }
    }
  }

  const handleOpenAddGirliesModal = (listType, classId = null) => {
    if (classId) {
      setAddToClassId(classId)
      if (expandedClassId !== classId) {
        setExpandedClassId(classId)
      }
    } else {
      setAddToClassId(expandedClassId)
    }
    setAddToListType(listType)
    setSelectedGirlies([])
    setIsAddGirliesModalOpen(true)
  }

  const handleCloseAddGirliesModal = () => {
    setIsAddGirliesModalOpen(false)
    setAddToListType(null)
    setSelectedGirlies([])
    if (addToClassId) {
      setExpandedClassId(addToClassId)
    }
  }

  const handleToggleGirlieSelection = (girlyId) => {
    setSelectedGirlies(prev => 
      prev.includes(girlyId)
        ? prev.filter(id => id !== girlyId)
        : [...prev, girlyId]
    )
  }

  const handleAddGirliesToList = async () => {
    const targetClassId = addToClassId || expandedClassId
    if (targetClassId && addToListType && selectedGirlies.length > 0) {
      const classItem = classes.find(c => c.id === targetClassId)
      if (!classItem) return

      const now = new Date()
      const upcoming = classes.filter(c => c.dateTime > now).sort((a, b) => a.dateTime - b.dateTime)
      const nextClass = upcoming[0]
      const isNextClass = nextClass && targetClassId === nextClass.id

      const listKey = addToListType === 'coming' ? 'coming' : 'waitingList'
      const existingIds = classItem[listKey] || []
      const newIds = [...new Set([...existingIds, ...selectedGirlies])]
      
      const payments = { ...(classItem.payments || {}) }
      
      selectedGirlies.forEach(girlyId => {
        const girly = girlies.find(g => g.id === girlyId)
        if (girly) {
          if (addToListType === 'waitingList') {
            // Clear any existing payment when adding to waiting list (waiting list doesn't use credits or have payments)
            if (payments[girlyId]) {
              delete payments[girlyId]
            }
          } else {
            // Only assign credits if adding to 'coming' list, not 'waitingList'
            // Waiting list doesn't use credits
            if (!payments[girlyId]) {
              if (isNextClass) {
                if (girly.credits > 0) {
                  payments[girlyId] = { type: 'credit', status: 'used' }
                } else {
                  payments[girlyId] = null
                }
              } else {
                const remainingCredits = getRemainingCredits(girlyId)
                if (remainingCredits > 0) {
                  payments[girlyId] = { type: 'credit', status: 'used' }
                } else {
                  payments[girlyId] = null
                }
              }
            }
          }
        }
      })
      
      try {
        isAddingGirliesRef.current = true
        
        await updateClass(targetClassId, {
          [listKey]: newIds,
          payments: payments
        })
        
        setExpandedClassId(targetClassId)
        handleCloseAddGirliesModal()
        
        setTimeout(() => {
          isAddingGirliesRef.current = false
        }, 500)
      } catch (error) {
        console.error('Error adding girlies to class:', error)
        alert('Failed to add girlies. Please try again.')
        isAddingGirliesRef.current = false
      }
    }
  }

  const handleOpenAddGirlyModal = () => {
    setIsAddGirlyModalOpen(true)
  }

  const handleCloseAddGirlyModal = () => {
    setIsAddGirlyModalOpen(false)
    setNewGirlyFirstName('')
    setNewGirlySecondName('')
    setNewGirlyPhoneNumber('')
  }

  const handleAddNewGirly = async () => {
    if (newGirlyFirstName.trim()) {
      const fullName = newGirlySecondName.trim() 
        ? `${newGirlyFirstName.trim()} ${newGirlySecondName.trim()}` 
        : newGirlyFirstName.trim()
      try {
        const girlyId = await addGirly({
          name: fullName,
          firstName: newGirlyFirstName.trim(),
          secondName: newGirlySecondName.trim(),
          phoneNumber: newGirlyPhoneNumber.trim(),
          credits: 0
        })
        if (girlyId) {
          setSelectedGirlies([...selectedGirlies, girlyId])
        }
        handleCloseAddGirlyModal()
      } catch (error) {
        console.error('Error adding new girly:', error)
        alert('Failed to add girly. Please try again.')
      }
    }
  }

  // Auto-expand next class and set expandedClassId for modals
  useEffect(() => {
    if (isAddingGirliesRef.current) {
      return
    }
    
    const now = new Date()
    const upcoming = classes.filter(c => c.dateTime > now).sort((a, b) => a.dateTime - b.dateTime)
    const next = upcoming[0]
    if (next) {
      // Next class is always expanded
      setIsNextClassExpanded(true)
      // Set expandedClassId for modal operations if not already set
      if (!expandedClassId) {
        setExpandedClassId(next.id)
      }
    }
  }, [classes])

  return (
    <div className="page">
      <div className="page-content">
        <h1 className="overview-title">Overview</h1>

        {/* Next Class Section */}
        {nextClass && (
          <div className="overview-next-class-section">
            <h2 className="section-title">Next Class</h2>
            <ClassTile
              classItem={nextClass}
              girlies={girlies}
              classes={classes}
              isExpanded={isNextClassExpanded}
              onToggleExpand={null}
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
              isPastClass={false}
              onOpenPaymentModal={(girlyId, e) => handleOpenPaymentModal(girlyId, e, nextClass.id)}
              onOpenEllipsesModal={(girlyId, e) => {
                setExpandedClassId(nextClass.id)
                handleOpenEllipsesModal(girlyId, e)
              }}
              onOpenAddGirliesModal={(listType) => {
                setExpandedClassId(nextClass.id)
                handleOpenAddGirliesModal(listType, nextClass.id)
              }}
              onOpenDetailsModal={handleOpenDetailsModal}
              getRemainingCredits={getRemainingCredits}
              getPaymentStatus={getPaymentStatus}
              getCreditsInUse={getCreditsInUse}
              expandedClassId={nextClass.id}
              setExpandedClassId={setExpandedClassId}
              onMoveToClass={(girlyId) => {
                setExpandedClassId(nextClass.id)
                handleMoveToClass(girlyId, nextClass.id)
              }}
            />
          </div>
        )}

        {/* Most Recent Class Section */}
        {lastClass && (
          <div className="overview-last-class-section">
            <h2 className="section-title">Most Recent Class</h2>
            <ClassTile
              classItem={lastClass}
              girlies={girlies}
              classes={classes}
              isExpanded={isLastClassExpanded}
              onToggleExpand={() => {
                setIsLastClassExpanded(!isLastClassExpanded)
                if (!isLastClassExpanded) {
                  setExpandedClassId(lastClass.id)
                  setRecentTab('coming')
                }
              }}
              selectedTab={recentTab}
              onTabChange={setRecentTab}
              isPastClass={true}
              onOpenPaymentModal={(girlyId, e) => handleOpenPaymentModal(girlyId, e, lastClass.id)}
              onOpenEllipsesModal={(girlyId, e) => {
                setExpandedClassId(lastClass.id)
                handleOpenEllipsesModal(girlyId, e)
              }}
              onOpenAddGirliesModal={(listType) => {
                setExpandedClassId(lastClass.id)
                handleOpenAddGirliesModal(listType, lastClass.id)
              }}
              onOpenDetailsModal={handleOpenDetailsModal}
              getRemainingCredits={getRemainingCredits}
              getPaymentStatus={getPaymentStatus}
              getCreditsInUse={getCreditsInUse}
              expandedClassId={lastClass.id}
              setExpandedClassId={setExpandedClassId}
              onMoveToClass={(girlyId) => {
                setExpandedClassId(lastClass.id)
                handleMoveToClass(girlyId, lastClass.id)
              }}
            />
          </div>
        )}

        {/* Modals - same as Classes page */}
        {isAddGirliesModalOpen && (
          <div className="modal-overlay" onClick={handleCloseAddGirliesModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-with-button">
                <h2 className="modal-title">Who's {addToListType === 'coming' ? 'Coming?' : 'on the Waiting List?'}</h2>
                <button className="add-new-girly-btn" onClick={handleOpenAddGirlyModal}>
                  + Add New Girly
                </button>
              </div>
              <div className="modal-form">
                <div className="girlies-selection-list">
                  {(() => {
                    const targetClassId = addToClassId || expandedClassId
                    const currentClass = classes.find(c => c.id === targetClassId)
                    const alreadyInClass = currentClass 
                      ? [...(currentClass.coming || []), ...(currentClass.waitingList || [])]
                      : []
                    const availableGirlies = girlies.filter(girly => !alreadyInClass.includes(girly.id))
                    
                    return availableGirlies.map((girly) => (
                      <div 
                        key={girly.id} 
                        className={`girly-selection-item ${selectedGirlies.includes(girly.id) ? 'selected' : ''}`}
                        onClick={() => handleToggleGirlieSelection(girly.id)}
                      >
                        <span>{girly.name}</span>
                      </div>
                    ))
                  })()}
                  {(() => {
                    const targetClassId = addToClassId || expandedClassId
                    const currentClass = classes.find(c => c.id === targetClassId)
                    const alreadyInClass = currentClass 
                      ? [...(currentClass.coming || []), ...(currentClass.waitingList || [])]
                      : []
                    const availableGirlies = girlies.filter(girly => !alreadyInClass.includes(girly.id))
                    
                    return availableGirlies.length === 0 && (
                      <p className="no-girlies-message">No girlies available. Click "+ Add New Girly" to add one.</p>
                    )
                  })()}
                </div>
                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={handleCloseAddGirliesModal}>
                    Cancel
                  </button>
                  <button 
                    className="add-btn" 
                    onClick={handleAddGirliesToList}
                    disabled={selectedGirlies.length === 0}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAddGirlyModalOpen && (
          <div className="modal-overlay" onClick={handleCloseAddGirlyModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Add a Girly</h2>
              <div className="modal-form">
                <div className="form-group">
                  <label htmlFor="newGirlyFirstName">First Name</label>
                  <input
                    type="text"
                    id="newGirlyFirstName"
                    value={newGirlyFirstName}
                    onChange={(e) => setNewGirlyFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newGirlySecondName">Second Name</label>
                  <input
                    type="text"
                    id="newGirlySecondName"
                    value={newGirlySecondName}
                    onChange={(e) => setNewGirlySecondName(e.target.value)}
                    placeholder="Enter second name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newGirlyPhoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="newGirlyPhoneNumber"
                    value={newGirlyPhoneNumber}
                    onChange={(e) => setNewGirlyPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={handleCloseAddGirlyModal}>
                    Cancel
                  </button>
                  <button 
                    className="add-btn" 
                    onClick={handleAddNewGirly}
                    disabled={!newGirlyFirstName.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isPaymentModalOpen && selectedGirlyForPayment && (
          <div className="modal-overlay" onClick={handleClosePaymentModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Payment</h2>
                <button 
                  className="modal-close-btn"
                  onClick={handleClosePaymentModal}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="modal-form">
                {(() => {
                  const girly = girlies.find(g => g.id === selectedGirlyForPayment)
                  const remainingCredits = girly ? getRemainingCredits(selectedGirlyForPayment) : 0
                  const classItem = classes.find(c => c.id === expandedClassId)
                  const existingPayment = classItem?.payments?.[selectedGirlyForPayment]
                  return (
                    <>
                      {paymentType === 'clearCredit' && (
                        <div className="modal-buttons">
                          <button 
                            className="cancel-btn" 
                            onClick={async () => {
                              try {
                                const payments = { ...(classItem.payments || {}) }
                                delete payments[selectedGirlyForPayment]
                                await updateClass(expandedClassId, { payments })
                                // After clearing, show the full payment popup
                                setPaymentType(null)
                                setOneOffPaid(null)
                              } catch (error) {
                                console.error('Error clearing payment:', error)
                                alert('Failed to clear payment. Please try again.')
                              }
                            }}
                          >
                            Clear Payment
                          </button>
                        </div>
                      )}
                      {!paymentType && (
                        <>
                          <div className="credits-info">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <p className="credits-display" style={{ margin: 0 }}>{remainingCredits} {remainingCredits === 1 ? 'credit' : 'credits'} remaining</p>
                              <button 
                                className="add-credits-in-modal-btn"
                                onClick={() => {
                                  const currentRemainingCredits = getRemainingCredits(selectedGirlyForPayment)
                                  setCreditsToAdd(String(currentRemainingCredits))
                                  setPaymentType('addCredits')
                                }}
                              >
                                <span className="add-credits-text">+ Add Credits</span>
                                <span className="add-credits-icon">+</span>
                              </button>
                            </div>
                          </div>
                          <div className="payment-options">
                            <button 
                              className="payment-option-btn"
                              onClick={handleUseCredit}
                              disabled={remainingCredits === 0 || existingPayment?.type === 'credit'}
                            >
                              Use Credit
                            </button>
                            <button 
                              className="payment-option-btn"
                              onClick={() => setPaymentType('oneoff')}
                            >
                              One-off £14.29
                            </button>
                          </div>
                          {existingPayment && existingPayment.type !== 'credit' && (
                            <div className="modal-buttons" style={{ marginTop: '16px' }}>
                              <button 
                                className="cancel-btn" 
                                onClick={async () => {
                                  try {
                                    const payments = { ...(classItem.payments || {}) }
                                    delete payments[selectedGirlyForPayment]
                                    await updateClass(expandedClassId, { payments })
                                    handleClosePaymentModal()
                                  } catch (error) {
                                    console.error('Error clearing payment:', error)
                                    alert('Failed to clear payment. Please try again.')
                                  }
                                }}
                              >
                                Clear Payment
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      {paymentType === 'oneoff' && (
                        <div className="payment-options">
                          <button 
                            className="payment-option-btn"
                            onClick={() => setOneOffPaid(true)}
                            style={{
                              backgroundColor: oneOffPaid === true ? '#000' : 'white',
                              color: oneOffPaid === true ? 'white' : '#000',
                              border: 'none'
                            }}
                          >
                            Paid
                          </button>
                          <button 
                            className="payment-option-btn"
                            onClick={() => setOneOffPaid(false)}
                            style={{
                              backgroundColor: oneOffPaid === false ? '#000' : 'white',
                              color: oneOffPaid === false ? 'white' : '#000',
                              border: 'none'
                            }}
                          >
                            Not Paid
                          </button>
                        </div>
                      )}
                      {paymentType === 'addCredits' && (
                        <>
                          <div className="form-group">
                            <label htmlFor="creditsToAdd">Number of Credits</label>
                            <input
                              type="number"
                              id="creditsToAdd"
                              value={creditsToAdd}
                              onChange={(e) => setCreditsToAdd(e.target.value)}
                              placeholder="Enter number of credits"
                              min="0"
                            />
                          </div>
                          <div className="credits-options">
                            <button 
                              className="credit-option-btn" 
                              onClick={() => {
                                const current = parseInt(creditsToAdd) || 0
                                setCreditsToAdd(String(current + 5))
                              }}
                            >
                              +5
                            </button>
                          </div>
                        </>
                      )}
                      {paymentType && paymentType !== 'clearCredit' && (
                        <div className="modal-buttons">
                          <button className="cancel-btn" onClick={() => setPaymentType(null)}>
                            Back
                          </button>
                          <button 
                            className="add-btn" 
                            onClick={handleSavePayment}
                            disabled={
                              (paymentType === 'addCredits' && (creditsToAdd === '' || isNaN(parseInt(creditsToAdd)) || parseInt(creditsToAdd) < 0)) ||
                              (paymentType === 'oneoff' && oneOffPaid === null)
                            }
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {isEllipsesModalOpen && selectedGirlyForEllipses && (() => {
          const girly = girlies.find(g => g.id === selectedGirlyForEllipses)
          const firstName = girly?.firstName || girly?.name?.split(' ')[0] || 'Girly'
          const classItem = classes.find(c => c.id === expandedClassId)
          const isInComing = classItem?.coming?.includes(selectedGirlyForEllipses)
          const isInWaitlist = classItem?.waitingList?.includes(selectedGirlyForEllipses)
          return (
            <div className="modal-overlay" onClick={handleCloseEllipsesModal}>
              <div className="modal-content ellipses-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Options</h2>
                <div className="ellipses-options">
                  {girly?.phoneNumber && (
                    <button 
                      className="ellipses-option-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCall(girly.phoneNumber)
                        handleCloseEllipsesModal()
                      }}
                    >
                      Call {firstName}
                    </button>
                  )}
                  {isInComing && (
                    <button 
                      className="ellipses-option-btn"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await handleMoveToWaitlist()
                      }}
                    >
                      Add to Waitlist
                    </button>
                  )}
                  {isInWaitlist && (
                    <button 
                      className="ellipses-option-btn"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await handleMoveToClass()
                      }}
                    >
                      Add to Class
                    </button>
                  )}
                  <button 
                    className="ellipses-option-btn"
                    onClick={async (e) => {
                      e.stopPropagation()
                      await handleCancelGirly()
                    }}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {isDetailsModalOpen && selectedGirlyForDetails && (() => {
          const girly = girlies.find(g => g.id === selectedGirlyForDetails)
          if (!girly) return null
          const remainingCredits = getRemainingCredits(girly.id)
          const creditsInUse = getCreditsInUse(girly.id)
          const totalCredits = girly.credits || 0
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
                    <p>{girly.name}</p>
                  </div>
                  {girly.phoneNumber && (
                    <div className="form-group">
                      <label>Phone</label>
                      <p>{girly.phoneNumber}</p>
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
                      // Note: Edit functionality not available on Overview page
                      // User can edit from Ladies page
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}

export default Overview
