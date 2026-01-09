import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  onSnapshot 
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION_NAME = 'girlies'

// Get all girlies
export const getGirlies = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    const girlies = []
    querySnapshot.forEach((doc) => {
      girlies.push({ id: doc.id, ...doc.data() })
    })
    return girlies
  } catch (error) {
    console.error('Error getting girlies:', error)
    throw error
  }
}

// Subscribe to girlies changes (real-time updates)
export const subscribeToGirlies = (callback) => {
  return onSnapshot(collection(db, COLLECTION_NAME), (querySnapshot) => {
    const girlies = []
    querySnapshot.forEach((doc) => {
      girlies.push({ id: doc.id, ...doc.data() })
    })
    callback(girlies)
  }, (error) => {
    console.error('Error subscribing to girlies:', error)
  })
}

// Add a new girly
export const addGirly = async (girlyData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name: girlyData.name,
      firstName: girlyData.firstName,
      secondName: girlyData.secondName || '',
      phoneNumber: girlyData.phoneNumber || '',
      credits: girlyData.credits || 0,
      createdAt: new Date()
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding girly:', error)
    throw error
  }
}

// Update a girly
export const updateGirly = async (girlyId, girlyData) => {
  try {
    const girlyRef = doc(db, COLLECTION_NAME, girlyId)
    await updateDoc(girlyRef, {
      name: girlyData.name,
      firstName: girlyData.firstName,
      secondName: girlyData.secondName || '',
      phoneNumber: girlyData.phoneNumber || '',
      credits: girlyData.credits || 0,
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Error updating girly:', error)
    throw error
  }
}

// Delete a girly
export const deleteGirly = async (girlyId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, girlyId))
  } catch (error) {
    console.error('Error deleting girly:', error)
    throw error
  }
}
