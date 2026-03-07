// ============================================================
//  LYFA – Firestore Database Service
//  All read/write operations to Firebase Firestore
// ============================================================

import {
  doc, collection, addDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, query, orderBy, setDoc, getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

// ─── USER PROFILE ─────────────────────────────────────────
/**
 * Save or update a user's profile (name + caregiver email)
 * Called during onboarding and when updating settings
 */
export async function saveUserProfile(uid, profileData) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { ...profileData, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Get a user's profile once
 */
export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── MEDICATIONS ──────────────────────────────────────────
/**
 * Add a new medication to Firestore
 * Path: users/{uid}/medications/{auto-id}
 */
export async function addMedication(uid, medData) {
  const ref = collection(db, "users", uid, "medications");
  const docRef = await addDoc(ref, {
    ...medData,
    status: "pending",
    createdAt: serverTimestamp(),
    loggedAt: null,
  });
  return docRef.id;
}

/**
 * Update medication status (taken / missed)
 */
export async function updateMedicationStatus(uid, medId, status) {
  const ref = doc(db, "users", uid, "medications", medId);
  await updateDoc(ref, {
    status,
    loggedAt: serverTimestamp(),
  });
}

/**
 * Delete a medication
 */
export async function deleteMedication(uid, medId) {
  const ref = doc(db, "users", uid, "medications", medId);
  await deleteDoc(ref);
}

/**
 * Real-time listener for medications
 * Calls `callback` whenever medications change
 * Returns an unsubscribe function — call it on component unmount
 */
export function listenMedications(uid, callback) {
  const ref = collection(db, "users", uid, "medications");
  const q = query(ref, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const meds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(meds);
  });
}

// ─── SOS ALERTS ───────────────────────────────────────────
/**
 * Log an SOS alert to Firestore
 * Path: users/{uid}/sosAlerts/{auto-id}
 */
export async function logSOSAlert(uid, userName, caregiverEmail) {
  const ref = collection(db, "users", uid, "sosAlerts");
  const docRef = await addDoc(ref, {
    triggeredAt: serverTimestamp(),
    userName,
    caregiverEmail,
    message: "Emergency SOS triggered. Immediate assistance required.",
    acknowledged: false,
  });
  return docRef.id;
}

/**
 * Real-time listener for SOS alerts
 */
export function listenSOSAlerts(uid, callback) {
  const ref = collection(db, "users", uid, "sosAlerts");
  const q = query(ref, orderBy("triggeredAt", "desc"));
  return onSnapshot(q, (snap) => {
    const alerts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(alerts);
  });
}

/**
 * Mark an SOS alert as acknowledged by caregiver
 * Called from the public acknowledgement page
 */
export async function acknowledgeSOSAlert(uid, alertId, caregiverName) {
  const ref = doc(db, "users", uid, "sosAlerts", alertId);
  await updateDoc(ref, {
    acknowledged: true,
    acknowledgedAt: serverTimestamp(),
    acknowledgedBy: caregiverName || "Caregiver",
  });
}

/**
 * Get a single SOS alert (used by ack page)
 */
export async function getSOSAlert(uid, alertId) {
  const ref = doc(db, "users", uid, "sosAlerts", alertId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function getDashboardData(uid) {
  const [medSnap, sosSnap] = await Promise.all([
    getDocs(collection(db, "users", uid, "medications")),
    getDocs(query(collection(db, "users", uid, "sosAlerts"), orderBy("triggeredAt", "desc"))),
  ]);
  return {
    medications: medSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    sosAlerts: sosSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
}
