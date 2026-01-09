import React from 'react'
import '../pages/Classes.css'

function ClassTile({
  classItem,
  girlies,
  classes,
  isExpanded,
  onToggleExpand,
  selectedTab,
  onTabChange,
  isPastClass = false,
  onOpenPaymentModal,
  onOpenEllipsesModal,
  onOpenAddGirliesModal,
  onOpenDetailsModal,
  getRemainingCredits,
  getPaymentStatus,
  getCreditsInUse,
  expandedClassId,
  setExpandedClassId
}) {
  if (!classItem) return null

  const comingLabel = isPastClass ? 'Came' : 'Coming'
  const comingCount = classItem.coming?.length || 0
  const waitlistCount = classItem.waitingList?.length || 0

  // Format date for mobile view: "Wednesday 20:00 • 31st Dec '25"
  const formatMobileDate = () => {
    if (!classItem.dateTime) return classItem.title
    
    const date = classItem.dateTime.toDate ? classItem.dateTime.toDate() : new Date(classItem.dateTime)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const dayOfWeek = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear().toString().slice(-2)
    
    // Format time as HH:MM
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const time = `${hours}:${minutes}`
    
    // Get ordinal suffix for day
    const getOrdinal = (n) => {
      const s = ['th', 'st', 'nd', 'rd']
      const v = n % 100
      return n + (s[(v - 20) % 10] || s[v] || s[0])
    }
    
    return `${dayOfWeek} ${time} • ${getOrdinal(day)} ${month} '${year}`
  }

  const mobileTitle = formatMobileDate()

  return (
    <div 
      className={`class-tile ${isExpanded ? 'expanded' : ''} ${isExpanded && !isPastClass ? 'next-class-tile' : ''}`}
      onClick={onToggleExpand || undefined}
      style={onToggleExpand ? { cursor: 'pointer' } : {}}
    >
      {!isExpanded ? (
        <>
          <span className="class-title">{classItem.title}</span>
          <span className="class-title-mobile">{mobileTitle}</span>
          <div className="next-class-summary">
            <div className="next-class-coming">
              <span className="next-class-label">{comingLabel}</span>
              <span className="coming-count">{comingCount}</span>
            </div>
            <div className="next-class-waitlist">
              <span className="next-class-label">Waitlist</span>
              <span className="waiting-count">{waitlistCount}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <span className="class-title">{classItem.title}</span>
          <span className="class-title-mobile">{mobileTitle}</span>
          <div className="class-expanded-content">
            <div className="class-tabs">
              <div className="class-tabs-buttons">
                <button
                  className={`class-tab ${selectedTab === 'coming' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabChange('coming')
                  }}
                >
                  {comingLabel} <span className="bullet-separator">•</span> <span className="coming-count">{comingCount}</span>
                </button>
                <button
                  className={`class-tab ${selectedTab === 'waitlist' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabChange('waitlist')
                  }}
                >
                  Waitlist <span className="bullet-separator">•</span> <span className="waiting-count">{waitlistCount}</span>
                </button>
              </div>
              <button 
                className={`add-girlies-btn ${selectedTab === 'waitlist' ? 'add-girlies-btn-waitlist' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenAddGirliesModal(selectedTab === 'coming' ? 'coming' : 'waiting', classItem.id)
                }}
              >
                <span className="add-girlies-icon">+</span>
                <span className="add-girlies-text">{selectedTab === 'coming' ? ' Add Girlies to Class' : ' Add Girlies to Waitlist'}</span>
              </button>
            </div>
            {selectedTab === 'coming' && (
              <div className="class-list-section">
                <div className="girlies-list">
                  {classItem.coming?.map((girlyId) => {
                    const girly = girlies.find(g => g.id === girlyId)
                    if (!girly) return null
                    const remainingCredits = getRemainingCredits(girlyId)
                    const paymentStatus = getPaymentStatus(girlyId, classItem)
                    return (
                      <div 
                        key={girlyId} 
                        className="class-girly-tile"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onOpenDetailsModal) {
                            onOpenDetailsModal(girlyId)
                          }
                        }}
                        style={onOpenDetailsModal ? { cursor: 'pointer' } : {}}
                      >
                        <div className="class-girly-info">
                          <div className="class-girly-name">
                            <span className="girly-first-name">{girly.firstName || girly.name.split(' ')[0]}</span>
                            <span className="girly-surname">{girly.secondName || girly.name.split(' ').slice(1).join(' ')}</span>
                          </div>
                        </div>
                        <div className="class-girly-actions">
                          {remainingCredits > 0 && (
                            <span className="class-girly-credits">{remainingCredits} {remainingCredits === 1 ? 'credit' : 'credits'} remaining</span>
                          )}
                          {paymentStatus && paymentStatus !== 'Credit used' && paymentStatus !== 'Paid' && !paymentStatus.startsWith('Owes') && (
                            <span className="payment-status">{paymentStatus}</span>
                          )}
                          <button 
                            className={`payment-btn ${paymentStatus === 'Credit used' ? 'payment-btn-credit-used' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenPaymentModal(girlyId, e, classItem.id)
                            }}
                          >
                            {paymentStatus || 'Payment'}
                          </button>
                          <button 
                            className="ellipses-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenEllipsesModal(girlyId, e)
                            }}
                          >
                            <i className="fa-solid fa-ellipsis"></i>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {selectedTab === 'waitlist' && (
              <div className="class-list-section">
                <div className="girlies-list">
                  {classItem.waitingList?.map((girlyId) => {
                    const girly = girlies.find(g => g.id === girlyId)
                    if (!girly) return null
                    const remainingCredits = getRemainingCredits(girlyId)
                    const paymentStatus = getPaymentStatus(girlyId, classItem)
                    return (
                      <div 
                        key={girlyId} 
                        className="class-girly-tile"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onOpenDetailsModal) {
                            onOpenDetailsModal(girlyId)
                          }
                        }}
                        style={onOpenDetailsModal ? { cursor: 'pointer' } : {}}
                      >
                        <div className="class-girly-info">
                          <div className="class-girly-name">
                            <span className="girly-first-name">{girly.firstName || girly.name.split(' ')[0]}</span>
                            <span className="girly-surname">{girly.secondName || girly.name.split(' ').slice(1).join(' ')}</span>
                          </div>
                        </div>
                        <div className="class-girly-actions">
                          {remainingCredits > 0 && (
                            <span className="class-girly-credits">{remainingCredits} {remainingCredits === 1 ? 'credit' : 'credits'} remaining</span>
                          )}
                          {paymentStatus && paymentStatus !== 'Credit used' && paymentStatus !== 'Paid' && !paymentStatus.startsWith('Owes') && (
                            <span className="payment-status">{paymentStatus}</span>
                          )}
                          <button 
                            className={`payment-btn ${paymentStatus === 'Credit used' ? 'payment-btn-credit-used' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenPaymentModal(girlyId, e, classItem.id)
                            }}
                          >
                            {paymentStatus || 'Payment'}
                          </button>
                          <button 
                            className="ellipses-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenEllipsesModal(girlyId, e)
                            }}
                          >
                            <i className="fa-solid fa-ellipsis"></i>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ClassTile
