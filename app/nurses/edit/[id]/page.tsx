import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { Nurse } from "../../../../types/nurse";
import NurseForm from "../../../../components/nurses/NurseForm";

interface EditNursePageProps {
  params: {
    id: string;
  };
}

async function getNurse(id: string): Promise<Nurse | null> {
  try {
    const nurseDoc = await getDoc(doc(db, "nurses", id));

    if (!nurseDoc.exists()) {
      return null;
    }

    const nurseData = nurseDoc.data() as Omit<Nurse, "id">;
    return {
      id: nurseDoc.id,
      ...nurseData,
    };
  } catch (error) {
    console.error("Error fetching nurse:", error);
    return null;
  }
}

export default async function EditNursePage({ params }: EditNursePageProps) {
  const nurse = await getNurse(params.id);

  if (!nurse) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Nurse not found</h1>
        <p>
          The nurse you are trying to edit does not exist or has been deleted.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Edit Nurse</h1>

      <div className="bg-slate-800 rounded-lg shadow p-6">
        <NurseForm nurse={nurse} isEditing />
      </div>
    </div>
  );
}
