import NurseForm from "../../../components/nurses/NurseForm";

export default function AddNursePage() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Add New Nurse</h1>

      <div className="bg-slate-800 rounded-lg shadow p-6">
        <NurseForm />
      </div>
    </div>
  );
}
