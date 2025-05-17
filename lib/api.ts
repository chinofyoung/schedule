import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { Nurse } from "../types/nurse";

export async function fetchNurses(): Promise<Nurse[]> {
  const nursesCollection = collection(db, "nurses");
  const nursesSnapshot = await getDocs(nursesCollection);

  const nurses: Nurse[] = [];
  nursesSnapshot.forEach((doc) => {
    const nurseData = doc.data() as Omit<Nurse, "id">;
    nurses.push({
      id: doc.id,
      ...nurseData,
    });
  });

  return nurses;
}
