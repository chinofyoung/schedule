import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { Employee } from "../../../../types/employee";
import EmployeeForm from "../../../../components/employees/EmployeeForm";

interface EditEmployeePageProps {
  params: {
    id: string;
  };
}

async function getEmployee(id: string): Promise<Employee | null> {
  try {
    const employeeDoc = await getDoc(doc(db, "employees", id));

    if (!employeeDoc.exists()) {
      return null;
    }

    const employeeData = employeeDoc.data() as Omit<Employee, "id">;
    return {
      id: employeeDoc.id,
      ...employeeData,
    };
  } catch (error) {
    console.error("Error fetching employee:", error);
    return null;
  }
}

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const employee = await getEmployee(params.id);

  if (!employee) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          Employee not found
        </h1>
        <p>
          The employee you are trying to edit does not exist or has been
          deleted.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Edit Employee</h1>

      <div className="bg-[var(--card-bg)] rounded-lg shadow p-6 border border-[var(--card-border)]">
        <EmployeeForm employee={employee} isEditing />
      </div>
    </div>
  );
}
