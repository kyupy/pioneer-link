import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { OrgScopedDb } from "./types";

initializeApp();

export const db = getFirestore();

export function orgDb(orgId: string): OrgScopedDb {
  const ref = db.collection("organizations").doc(orgId);
  return {
    orgRef: ref,
    collection: (name: string) => ref.collection(name),
    doc: (collection: string, docId: string) => ref.collection(collection).doc(docId),
  };
}

export function orgRef(orgId: string) {
  return db.collection("organizations").doc(orgId);
}
