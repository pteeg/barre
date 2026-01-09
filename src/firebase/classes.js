import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION_NAME = 'classes'

// Get all classes
export const getClasses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    const classes = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      classes.push({ 
        id: doc.id, 
        ...data,
        dateTime: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(data.dateTime)
      })
    })
    return classes
  } catch (error) {
    console.error('Error getting classes:', error)
    throw error
  }
}

// Subscribe to classes changes (real-time updates)
export const subscribeToClasses = (callback) => {
  return onSnapshot(collection(db, COLLECTION_NAME), (querySnapshot) => {
    const classes = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      classes.push({ 
        id: doc.id, 
        ...data,
        dateTime: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(data.dateTime)
      })
    })
    callback(classes)
  }, (error) => {
    console.error('Error subscribing to classes:', error)
  })
}

// Add a new class
export const addClass = async (classData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      title: classData.title,
      dateTime: Timestamp.fromDate(classData.dateTime),
      date: classData.date,
      time: classData.time,
      coming: classData.coming || [],
      waitingList: classData.waitingList || [],
      payments: classData.payments || {},
      createdAt: Timestamp.now()
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding class:', error)
    throw error
  }
}

// Update a class
export const updateClass = async (classId, classData) => {
  try {
    const classRef = doc(db, COLLECTION_NAME, classId)
    const updateData = { ...classData }
    
    // Convert dateTime to Timestamp if it's a Date object
    if (updateData.dateTime instanceof Date) {
      updateData.dateTime = Timestamp.fromDate(updateData.dateTime)
    }
    
    // Remove dateTime from update if it's not being changed
    if (!classData.dateTime) {
      delete updateData.dateTime
    }
    
    updateData.updatedAt = Timestamp.now()
    
    await updateDoc(classRef, updateData)
  } catch (error) {
    console.error('Error updating class:', error)
    throw error
  }
}

// Delete a class
export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, classId))
  } catch (error) {
    console.error('Error deleting class:', error)
    throw error
  }
}
