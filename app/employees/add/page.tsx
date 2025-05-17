import EmployeeForm from "../../../components/employees/EmployeeForm";

export default function AddEmployeePage() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Add New Employee</h1>

      <div className="bg-[var(--card-bg)] rounded-lg shadow p-6 border border-[var(--card-border)]">
        <EmployeeForm />
      </div>
    </div>
  );
}
