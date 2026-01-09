import React, { useState, useEffect, useRef } from 'react'
import './Classes.css'
import { subscribeToClasses, addClass, updateClass } from '../firebase/classes'
import { subscribeToGirlies, addGirly, updateGirly } from '../firebase/girlies'
import ClassTile from '../components/ClassTile'

function Classes() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddGirliesModalOpen, setIsAddGirliesModalOpen] = useState(false)
  const [isAddGirlyModalOpen, setIsAddGirlyModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isEllipsesModalOpen, setIsEllipsesModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedGirlyForDetails, setSelectedGirlyForDetails] = useState(null)
  const [addToListType, setAddToListType] = useState(null) // 'coming' or 'waiting'
  const [addToClassId, setAddToClassId] = useState(null) // Track which class we're adding girlies to
  const [expandedClassId, setExpandedClassId] = useState(null)
  const isAddingGirliesRef = useRef(false) // Track if we're in the process of adding girlies
  const [selectedGirlyForPayment, setSelectedGirlyForPayment] = useState(null)
  const [selectedGirlyForEllipses, setSelectedGirlyForEllipses] = useState(null)
  const [classes, setClasses] = useState([])
  const [classDate, setClassDate] = useState('')
  const [classTime, setClassTime] = useState('')
  const [girlies, setGirlies] = useState([]) // Local state for girlies - can be connected to Ladies page later
  const [selectedGirlies, setSelectedGirlies] = useState([])
  const [newGirlyFirstName, setNewGirlyFirstName] = useState('')
  const [newGirlySecondName, setNewGirlySecondName] = useState('')
  const [newGirlyPhoneNumber, setNewGirlyPhoneNumber] = useState('')
  const [paymentType, setPaymentType] = useState(null) // 'credit', 'oneoff', 'addCredits'
  const [oneOffPaid, setOneOffPaid] = useState(null)
  const [creditsToAdd, setCreditsToAdd] = useState('')
  const [selectedTab, setSelectedTab] = useState('coming') // 'coming' or 'waitlist'
  const [mainViewTab, setMainViewTab] = useState('nextClass') // 'nextClass', 'upcoming', 'previous'
  const [selectedPreviousTab, setSelectedPreviousTab] = useState({}) // Track selected tab per previous class
  const [expandedUpcomingClassId, setExpandedUpcomingClassId] = useState(null) // Expanded class in Upcoming tab only

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

  // Auto-expand next class when it changes (but don't override if user has expanded a different class)
  useEffect(() => {
    // Don't auto-expand if we're in the middle of adding girlies
    if (isAddingGirliesRef.current) {
      return
    }
    
    const now = new Date()
    const upcoming = classes.filter(c => c.dateTime > now).sort((a, b) => a.dateTime - b.dateTime)
    const next = upcoming[0]
    // Only auto-expand next class if:
    // 1. There's no expanded class, OR
    // 2. The currently expanded class is the next class (it changed)
    // Don't override if user has manually expanded a different class
    if (next) {
      if (!expandedClassId) {
        setExpandedClassId(next.id)
      } else if (expandedClassId === next.id) {
        // Next class is already expanded, keep it that way
        setExpandedClassId(next.id)
      }
      // If expandedClassId is set to a different class, don't change it
    }
  }, [classes, expandedClassId])

  const formatClassTitle = (dateString, timeString) => {
    if (!dateString || !timeString) return ''
    
    const date = new Date(dateString + 'T' + timeString)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    const dayOfWeek = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    
    // Format time as HH:MM
    const time = timeString.substring(0, 5)
    
    // Get ordinal suffix for day
    const getOrdinal = (n) => {
      const s = ['th', 'st', 'nd', 'rd']
      const v = n % 100
      return n + (s[(v - 20) % 10] || s[v] || s[0])
    }
    
    return `${dayOfWeek} ${time} • ${getOrdinal(day)} ${month} ${year}`
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setClassDate('')
    setClassTime('')
  }

  const handleAddClass = async () => {
    if (classDate && classTime) {
      const title = formatClassTitle(classDate, classTime)
      const classDateTime = new Date(classDate + 'T' + classTime)
      try {
        await addClass({
          title: title,
          dateTime: classDateTime,
          date: classDate,
          time: classTime,
          coming: [],
          waitingList: [],
          payments: {}
        })
        handleCloseModal()
      } catch (error) {
        console.error('Error adding class:', error)
        alert('Failed to add class. Please try again.')
      }
    }
  }

  const handleToggleExpand = (classId) => {
    // Don't allow collapsing nextClass - it's always expanded
    const now = new Date()
    const upcoming = classes.filter(c => c.dateTime > now).sort((a, b) => a.dateTime - b.dateTime)
    const next = upcoming[0]
    if (next && classId === next.id) {
      return // Next class is always expanded
    }
    setExpandedClassId(expandedClassId === classId ? null : classId)
    if (expandedClassId !== classId) {
      setSelectedTab('coming') // Reset to coming tab when expanding
    }
  }

  const handleOpenAddGirliesModal = (listType, classId = null) => {
    if (classId) {
      setAddToClassId(classId)
      // Expand the class if it's not already expanded
      if (expandedClassId !== classId) {
        setExpandedClassId(classId)
      }
    } else {
      // For next class, use expandedClassId
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
    // Explicitly preserve the expanded class ID
    if (addToClassId) {
      setExpandedClassId(addToClassId)
    }
    // Don't reset addToClassId - keep it for reference
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

      // Check if this is the next class or an upcoming/previous class
      const now = new Date()
      const upcoming = classes.filter(c => c.dateTime > now).sort((a, b) => a.dateTime - b.dateTime)
      const nextClass = upcoming[0]
      const isNextClass = nextClass && targetClassId === nextClass.id

      const listKey = addToListType === 'coming' ? 'coming' : 'waitingList'
      const existingIds = classItem[listKey] || []
      const newIds = [...new Set([...existingIds, ...selectedGirlies])]
      
      // Initialize payment status for new girlies
      const payments = { ...(classItem.payments || {}) }
      
      selectedGirlies.forEach(girlyId => {
        const girly = girlies.find(g => g.id === girlyId)
        if (girly) {
          // Only assign credits if adding to 'coming' list, not 'waitingList'
          // Waiting list doesn't use credits
          if (!payments[girlyId]) {
            if (addToListType === 'waitingList') {
              // Don't assign credits for waiting list
              payments[girlyId] = null
            } else if (isNextClass) {
              // Next class: auto-use credit if they have credits and are added to coming list
              if (girly.credits > 0) {
                payments[girlyId] = { type: 'credit', status: 'used' }
              } else {
                payments[girlyId] = null // No payment set yet
              }
            } else {
              // Upcoming or previous class: MUST use credit if they have remaining credits
              const remainingCredits = getRemainingCredits(girlyId)
              if (remainingCredits > 0) {
                payments[girlyId] = { type: 'credit', status: 'used' }
              } else {
                // No credits available - still add them but require payment selection later
                payments[girlyId] = null
              }
            }
          }
        }
      })
      
      try {
        // Mark that we're adding girlies to prevent useEffect from resetting expanded state
        isAddingGirliesRef.current = true
        
        // Update class in Firebase
        await updateClass(targetClassId, {
          [listKey]: newIds,
          payments: payments
        })
        
        // Explicitly keep the class expanded after adding girlies
        setExpandedClassId(targetClassId)
        handleCloseAddGirliesModal()
        
        // Reset the flag after a short delay to allow Firebase update to complete
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

  // Calculate remaining credits for a girly (after deducting classes where credit was used)
  const getRemainingCredits = (girlyId) => {
    const girly = girlies.find(g => g.id === girlyId)
    if (!girly) return 0
    
    // Count how many classes (past or upcoming) they're in where a credit was used
    // Only count credits for people in 'coming' list, not 'waitingList' (waiting list doesn't use credits)
    // Any class with payment.type === 'credit' should permanently consume a credit
    const classesWithCreditUsedAll = classes.filter(c => 
      c.coming?.includes(girlyId) &&
      c.payments?.[girlyId]?.type === 'credit'
    ).length
    
    // girly.credits is the total credits they have
    // Subtract ALL classes where credits were used (past + upcoming) to get remaining
    const totalCredits = girly.credits || 0
    const remaining = totalCredits - classesWithCreditUsedAll
    
    return Math.max(0, remaining)
  }

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

  const handleOpenPaymentModal = (girlyId, e, classId = null) => {
    e.stopPropagation()
    setSelectedGirlyForPayment(girlyId)
    
    // Use provided classId or fall back to expandedClassId
    const targetClassId = classId || expandedClassId
    // Check if client has chosen one-off payment but hasn't paid
    const classItem = classes.find(c => c.id === targetClassId)
    const payment = classItem?.payments?.[girlyId]
    
    if (classId && classId !== expandedClassId) {
      setExpandedClassId(classId)
    }
    
    if (payment && payment.type === 'credit') {
      // Show only clear payment option for credit used
      setPaymentType('clearCredit')
      setOneOffPaid(null)
    } else if (payment && payment.type === 'oneoff' && payment.paid === false) {
      // Skip directly to paid/not paid options for unpaid one-off payments
      setPaymentType('oneoff')
      setOneOffPaid(false)
    } else {
      // Always show payment type selection to allow changing the payment option
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

  const handleMoveToWaitlist = async () => {
    if (expandedClassId && selectedGirlyForEllipses) {
      const classItem = classes.find(c => c.id === expandedClassId)
      if (!classItem) return

      try {
        // Remove from coming, add to waitlist
        const coming = (classItem.coming || []).filter(id => id !== selectedGirlyForEllipses)
        const waitingList = [...new Set([...(classItem.waitingList || []), selectedGirlyForEllipses])]
        
        // Clear credit payment when moving to waiting list (waiting list doesn't use credits)
        const payments = { ...(classItem.payments || {}) }
        if (payments[selectedGirlyForEllipses]?.type === 'credit') {
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

  const handleMoveToClass = async () => {
    if (expandedClassId && selectedGirlyForEllipses) {
      const classItem = classes.find(c => c.id === expandedClassId)
      if (!classItem) return

      const girly = girlies.find(g => g.id === selectedGirlyForEllipses)
      if (!girly) return

      try {
        // Remove from waitlist, add to coming
        const waitingList = (classItem.waitingList || []).filter(id => id !== selectedGirlyForEllipses)
        const coming = [...new Set([...(classItem.coming || []), selectedGirlyForEllipses])]
        
        // For upcoming/previous classes, MUST use credit if available
        const payments = { ...(classItem.payments || {}) }
        const now = new Date()
        const isUpcomingOrPrevious = classItem.dateTime && classItem.dateTime.toDate ? classItem.dateTime.toDate() : new Date(classItem.dateTime)
        const isUpcoming = isUpcomingOrPrevious > now
        
        if (isUpcoming && girly.credits > 0 && !payments[selectedGirlyForEllipses]) {
          payments[selectedGirlyForEllipses] = { type: 'credit', status: 'used' }
        }
        
        await updateClass(expandedClassId, {
          coming,
          waitingList,
          payments
        })
        
        handleCloseEllipsesModal()
      } catch (error) {
        console.error('Error moving to class:', error)
        alert('Failed to move to class. Please try again.')
      }
    }
  }

  const handleCancelGirly = async () => {
    if (expandedClassId && selectedGirlyForEllipses) {
      const classItem = classes.find(c => c.id === expandedClassId)
      if (!classItem) return

      const girly = girlies.find(g => g.id === selectedGirlyForEllipses)
      if (!girly) return

      try {
        // Remove from coming and waitlist
        const coming = (classItem.coming || []).filter(id => id !== selectedGirlyForEllipses)
        const waitingList = (classItem.waitingList || []).filter(id => id !== selectedGirlyForEllipses)
        
        // Check if credit was used
        const payments = { ...(classItem.payments || {}) }
        const payment = payments[selectedGirlyForEllipses]
        
        // Remove payment entry
        // This automatically updates credits remaining and credits in use because:
        // - getRemainingCredits() filters classes where payment.type === 'credit'
        // - getCreditsInUse() filters classes where payment.type === 'credit'
        // - When payment is deleted, those calculations will no longer count this class
        // - Credits aren't decremented when used, so no need to manually restore girly.credits
        delete payments[selectedGirlyForEllipses]
        
        // Update class - this will trigger recalculation of credits remaining/in use
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
        // If switching from another payment type to credit, restore the previous payment's credit first
        if (existingPayment && existingPayment.type === 'credit') {
          // Already using credit, do nothing
          handleClosePaymentModal()
          return
        }

        // Set payment to credit (don't decrement credits - calculation handles it)
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
      const existingPayment = payments[selectedGirlyForPayment]
      const girly = girlies.find(g => g.id === selectedGirlyForPayment)
      
      try {
        if (paymentType === 'credit') {
          // Set payment to credit (don't decrement credits - calculation handles it)
          payments[selectedGirlyForPayment] = { type: 'credit', status: 'used' }
          await updateClass(expandedClassId, { payments })
        } else if (paymentType === 'oneoff') {
          if (oneOffPaid === null) {
            // Don't save if no option selected
            return
          }
          // No need to restore credit - credits aren't decremented when used
          const existingOneOffPayment = payments[selectedGirlyForPayment]
          if (existingOneOffPayment && existingOneOffPayment.type === 'oneoff') {
            // Update existing one-off payment
            payments[selectedGirlyForPayment] = { 
              type: 'oneoff', 
              paid: oneOffPaid,
              oneOffCount: oneOffPaid ? existingOneOffPayment.oneOffCount : existingOneOffPayment.oneOffCount + 1
            }
          } else {
            // New one-off payment
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
            const currentCredits = girly.credits || 0
            const creditsToAddAmount = targetAmount - currentCredits
            
            // Set credits to target amount (no need to restore credit - credits aren't decremented)
            await updateGirly(selectedGirlyForPayment, {
              name: girly.name,
              firstName: girly.firstName || girly.name.split(' ')[0],
              secondName: girly.secondName || girly.name.split(' ').slice(1).join(' '),
              phoneNumber: girly.phoneNumber || '',
              credits: targetAmount
            })
            // After adding credits, reset to payment type selection but keep modal open
            setPaymentType(null)
            setCreditsToAdd('')
            return // Don't close the modal
          }
        }
        handleClosePaymentModal()
      } catch (error) {
        console.error('Error saving payment:', error)
        alert('Failed to save payment. Please try again.')
      }
    }
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
        // Auto-select the newly added girly (girlyId is the document ID)
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

  // Sort classes: upcoming first, then past
  const now = new Date()
  const upcomingClasses = classes
    .filter(c => c.dateTime > now)
    .sort((a, b) => a.dateTime - b.dateTime)
  const pastClasses = classes
    .filter(c => c.dateTime <= now)
    .sort((a, b) => b.dateTime - a.dateTime)

  const nextClass = upcomingClasses[0]
  const otherUpcomingClasses = upcomingClasses // All upcoming classes including the next one
  const recentClasses = pastClasses // All past classes

  return (
    <div className="page">
      <div className="page-content">
        <div className="classes-header">
          <h1 className="classes-title">Classes</h1>
          <button className="add-class-btn" onClick={handleOpenModal}>
            + Add Class
          </button>
        </div>

        {/* Main view tabs */}
        <div className="main-class-tabs">
          <button
            className={`main-class-tab ${mainViewTab === 'nextClass' ? 'active' : ''}`}
            onClick={() => setMainViewTab('nextClass')}
          >
            Next Class
          </button>
          <button
            className={`main-class-tab ${mainViewTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setMainViewTab('upcoming')}
          >
            Upcoming Classes
          </button>
          <button
            className={`main-class-tab ${mainViewTab === 'previous' ? 'active' : ''}`}
            onClick={() => setMainViewTab('previous')}
          >
            Previous Classes
          </button>
        </div>

        {/* Next Class - always expanded */}
        {mainViewTab === 'nextClass' && nextClass && (
          <div className="next-class-section">
            <ClassTile
              classItem={nextClass}
              girlies={girlies}
              classes={classes}
              isExpanded={true}
              onToggleExpand={null}
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
              isPastClass={false}
              onOpenPaymentModal={handleOpenPaymentModal}
              onOpenEllipsesModal={handleOpenEllipsesModal}
              onOpenAddGirliesModal={handleOpenAddGirliesModal}
              onOpenDetailsModal={handleOpenDetailsModal}
              getRemainingCredits={getRemainingCredits}
              getPaymentStatus={getPaymentStatus}
              getCreditsInUse={getCreditsInUse}
              expandedClassId={expandedClassId}
              setExpandedClassId={setExpandedClassId}
            />
          </div>
        )}

        {/* Upcoming Classes tab */}
        {mainViewTab === 'upcoming' && (
          <div className="upcoming-classes-section">
            <div className="classes-list">
              {otherUpcomingClasses.map((classItem) => (
                <ClassTile
                  key={classItem.id}
                  classItem={classItem}
                  girlies={girlies}
                  classes={classes}
                  isExpanded={expandedUpcomingClassId === classItem.id}
                  onToggleExpand={() => {
                    const isExpanded = expandedUpcomingClassId === classItem.id
                    setExpandedUpcomingClassId(isExpanded ? null : classItem.id)
                    if (!isExpanded) {
                      setExpandedClassId(classItem.id)
                      setSelectedTab('coming')
                    }
                  }}
                  selectedTab={selectedTab}
                  onTabChange={setSelectedTab}
                  isPastClass={false}
                  onOpenPaymentModal={handleOpenPaymentModal}
                  onOpenEllipsesModal={handleOpenEllipsesModal}
                  onOpenAddGirliesModal={handleOpenAddGirliesModal}
                  onOpenDetailsModal={handleOpenDetailsModal}
                  getRemainingCredits={getRemainingCredits}
                  getPaymentStatus={getPaymentStatus}
                  getCreditsInUse={getCreditsInUse}
                  expandedClassId={expandedClassId}
                  setExpandedClassId={setExpandedClassId}
                />
              ))}
              {otherUpcomingClasses.length === 0 && (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No upcoming classes</p>
              )}
            </div>
          </div>
        )}

        {/* Previous Classes tab */}
        {mainViewTab === 'previous' && (
          <div className="previous-classes-section">
            <div className="classes-list">
              {recentClasses.map((classItem) => {
                const classSelectedTab = selectedPreviousTab[classItem.id] || 'coming'
                return (
                  <ClassTile
                    key={classItem.id}
                    classItem={classItem}
                    girlies={girlies}
                    classes={classes}
                    isExpanded={expandedClassId === classItem.id}
                    onToggleExpand={() => handleToggleExpand(classItem.id)}
                    selectedTab={classSelectedTab}
                    onTabChange={(tab) => setSelectedPreviousTab({ ...selectedPreviousTab, [classItem.id]: tab })}
                    isPastClass={true}
                    onOpenPaymentModal={handleOpenPaymentModal}
                    onOpenEllipsesModal={handleOpenEllipsesModal}
                    onOpenAddGirliesModal={handleOpenAddGirliesModal}
                    onOpenDetailsModal={handleOpenDetailsModal}
                    getRemainingCredits={getRemainingCredits}
                    getPaymentStatus={getPaymentStatus}
                    getCreditsInUse={getCreditsInUse}
                    expandedClassId={expandedClassId}
                    setExpandedClassId={setExpandedClassId}
                  />
                )
              })}
              {recentClasses.length === 0 && (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No previous classes</p>
              )}
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Add Class</h2>
              <div className="modal-form">
                <div className="form-group">
                  <label htmlFor="classDate">Date</label>
                  <input
                    type="date"
                    id="classDate"
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="classTime">Time</label>
                  <input
                    type="time"
                    id="classTime"
                    value={classTime}
                    onChange={(e) => setClassTime(e.target.value)}
                  />
                </div>
                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button 
                    className="add-btn" 
                    onClick={handleAddClass}
                    disabled={!classDate || !classTime}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                                // No need to restore credit - credits aren't decremented when used
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
                                    // No need to restore credit - credits aren't decremented when used
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
                            onClick={() => {
                              setOneOffPaid(true)
                            }}
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
                            onClick={() => {
                              setOneOffPaid(false)
                            }}
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
                      // Note: Edit functionality not available on Classes page
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

export default Classes
