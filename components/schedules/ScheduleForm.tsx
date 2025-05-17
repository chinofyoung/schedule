"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Employee, ShiftType, ScheduleShift } from "../../types/employee";
import Link from "next/link";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Define the form data structure
type FormData = {
  name: string;
  startDate: string;
  endDate: string;
  shiftType: ShiftType;
  employees: string[]; // Array of selected employee IDs
  scheduleDayOffRequests: Record<string, string[]>; // Map of employee ID to array of dates
};

// Add LoadingProgress component
const LoadingProgress = ({ progress, message }: { progress: number; message: string }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-[var(--card-bg)] p-6 rounded-lg shadow-xl w-full max-w-md">
      <div className="mb-4">
        <div className="h-2 bg-[var(--highlight-bg)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--accent-primary)] transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="text-center text-[var(--foreground)]">{message}</p>
    </div>
  </div>
);

export default function ScheduleForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeForDayOff, setSelectedEmployeeForDayOff] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      shiftType: "8hour",
      employees: [],
      scheduleDayOffRequests: {},
    },
  });

  // Watch form values
  const selectedShiftType = watch("shiftType");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const scheduleDayOffRequests = watch("scheduleDayOffRequests");
  const selectedEmployees = watch("employees");

  // Generate date range for the date picker
  const generateDateRange = (start: string, end: string): string[] => {
    if (!start || !end) return [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dateArray = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dateArray.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
  };

  // Add day off request
  const addDayOffRequest = () => {
    if (!selectedEmployeeForDayOff || !selectedDate) return;

    const currentRequests = scheduleDayOffRequests[selectedEmployeeForDayOff.id] || [];
    if (!currentRequests.includes(selectedDate)) {
      setValue("scheduleDayOffRequests", {
        ...scheduleDayOffRequests,
        [selectedEmployeeForDayOff.id]: [...currentRequests, selectedDate],
      });
    }

    setSelectedEmployeeForDayOff(null);
    setSelectedDate("");
  };

  // Remove day off request
  const removeDayOffRequest = (employeeId: string, date: string) => {
    const currentRequests = scheduleDayOffRequests[employeeId] || [];
    setValue("scheduleDayOffRequests", {
      ...scheduleDayOffRequests,
      [employeeId]: currentRequests.filter(d => d !== date),
    });
  };

  // Fetch employees from Firestore
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesCollection = collection(db, "employees");
        const employeesSnapshot = await getDocs(employeesCollection);

        const employeesList: Employee[] = [];
        employeesSnapshot.forEach((doc) => {
          const employeeData = doc.data();
          employeesList.push({
            id: doc.id,
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            position: employeeData.position,
            mobileNumber: employeeData.mobileNumber,
            requestedDaysOff: employeeData.requestedDaysOff || [],
          });
        });

        setEmployees(employeesList);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  // Helper to check if an employee is a senior nurse (Nurse 3 or Nurse 4)
  const isSeniorNurse = (employee: Employee): boolean => {
    return employee.position === "Nurse 3" || employee.position === "Nurse 4";
  };

  // Helper to check if employee is a nursing attendant
  const isNursingAttendant = (employee: Employee): boolean => {
    return employee.position === "NA 1" || employee.position === "NA 2";
  };

  // Helper to check if employee is a midwife
  const isMidwife = (employee: Employee): boolean => {
    return (
      employee.position === "Midwife 1" || employee.position === "Midwife 2"
    );
  };

  // Get shift names based on shift type
  const getShiftNames = (shiftType: ShiftType): string[] => {
    return shiftType === "8hour"
      ? ["morning", "afternoon", "night"]
      : ["day", "night"];
  };

  // Handle select all for a category
  const handleSelectAll = (category: string) => {
    const categoryEmployees = employees.filter(emp => {
      if (category === "Nurse") return emp.position.startsWith("Nurse");
      if (category === "Midwife") return emp.position.startsWith("Midwife");
      if (category === "NA") return emp.position.startsWith("NA");
      return false;
    });

    const categoryEmployeeIds = categoryEmployees.map(emp => emp.id);
    const otherSelectedEmployees = selectedEmployees.filter(id => !categoryEmployeeIds.includes(id));

    // If all category employees are already selected, deselect them
    const allSelected = categoryEmployeeIds.every(id => selectedEmployees.includes(id));
    
    setValue("employees", allSelected ? otherSelectedEmployees : [...otherSelectedEmployees, ...categoryEmployeeIds]);
  };

  // Check if all employees in a category are selected
  const areAllSelected = (category: string) => {
    const categoryEmployees = employees.filter(emp => {
      if (category === "Nurse") return emp.position.startsWith("Nurse");
      if (category === "Midwife") return emp.position.startsWith("Midwife");
      if (category === "NA") return emp.position.startsWith("NA");
      return false;
    });

    return categoryEmployees.length > 0 && categoryEmployees.every(emp => selectedEmployees.includes(emp.id));
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setLoadingProgress(0);
      setLoadingMessage("Fetching employees...");

      // Fetch all employees
      const employeesCollection = collection(db, "employees");
      const employeesSnapshot = await getDocs(employeesCollection);
      const employees = employeesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];

      setLoadingProgress(20);
      setLoadingMessage("Preparing schedule data...");

      // Filter selected employees
      const selectedEmployees = employees.filter((emp) =>
        data.employees.includes(emp.id)
      );

      // Generate dates for the schedule
      const dates = generateDateRange(data.startDate, data.endDate);
      const scheduleDuration = dates.length;

      setLoadingProgress(40);
      setLoadingMessage("Calculating shift assignments...");

      // Calculate required shifts per employee to reach 80 hours
      const hoursPerShift = data.shiftType === "8hour" ? 8 : 12;
      const totalRequiredShifts = Math.ceil(80 / hoursPerShift);

      // Initialize tracking
      const employeeHours: Record<string, number> = {};
      const employeeShifts: Record<string, ScheduleShift[]> = {};
      const shiftsPerDay: Record<string, number> = {};
      const shiftsPerDayShift: Record<string, number> = {};
      
      selectedEmployees.forEach((emp) => {
        employeeHours[emp.id] = 0;
        employeeShifts[emp.id] = [];
      });

      // Initialize shifts per day tracking
      dates.forEach(date => {
        shiftsPerDay[date] = 0;
        getShiftNames(data.shiftType).forEach(shiftName => {
          shiftsPerDayShift[`${date}-${shiftName}`] = 0;
        });
      });

      // Get shift names based on shift type
      const shiftNames = getShiftNames(data.shiftType);

      setLoadingProgress(60);
      setLoadingMessage("Assigning shifts to employees...");

      // Calculate target shifts per day and per shift
      const totalShifts = selectedEmployees.length * totalRequiredShifts;
      const targetShiftsPerDay = Math.ceil(totalShifts / dates.length);
      const targetShiftsPerDayShift = Math.ceil(targetShiftsPerDay / shiftNames.length);

      // Create a matrix of all possible shifts (dates × shift names)
      const allShifts = dates.flatMap(date => 
        shiftNames.map(shiftName => ({ date, shiftName }))
      );

      // Sort shifts by current count to ensure even distribution
      const sortedShifts = [...allShifts].sort((a, b) => {
        const aCount = shiftsPerDayShift[`${a.date}-${a.shiftName}`];
        const bCount = shiftsPerDayShift[`${b.date}-${b.shiftName}`];
        return aCount - bCount;
      });

      // First pass: Distribute shifts evenly
      for (const { date, shiftName } of sortedShifts) {
        // Skip if this day/shift already has enough employees
        if (shiftsPerDayShift[`${date}-${shiftName}`] >= targetShiftsPerDayShift) continue;
        if (shiftsPerDay[date] >= targetShiftsPerDay) continue;

        // Sort employees by hours worked and number of consecutive shifts
        const availableEmployees = [...selectedEmployees]
          .filter(emp => {
            const hasDayOff = emp.requestedDaysOff?.includes(date);
            if (hasDayOff) return false;
            return employeeHours[emp.id] + hoursPerShift <= 80;
          })
          .sort((a, b) => {
            // First sort by hours worked
            const hoursDiff = employeeHours[a.id] - employeeHours[b.id];
            if (hoursDiff !== 0) return hoursDiff;

            // Then sort by number of consecutive shifts
            const aConsecutive = getConsecutiveShifts(employeeShifts[a.id], date);
            const bConsecutive = getConsecutiveShifts(employeeShifts[b.id], date);
            return aConsecutive - bConsecutive;
          });

        // Calculate how many more employees we need for this shift
        const currentShiftCount = shiftsPerDayShift[`${date}-${shiftName}`];
        const remainingSlots = targetShiftsPerDayShift - currentShiftCount;
        const employeesToAssign = Math.min(remainingSlots, availableEmployees.length);

        // Assign employees to this shift
        for (let i = 0; i < employeesToAssign; i++) {
          const employee = availableEmployees[i];
          if (!employee) continue;

          const shift: ScheduleShift = {
            date,
            shiftType: data.shiftType,
            shiftName,
            employeeId: employee.id,
            isPointPerson: i === 0 && currentShiftCount === 0, // First employee of first assignment is point person
          };

          employeeShifts[employee.id].push(shift);
          employeeHours[employee.id] += hoursPerShift;
          shiftsPerDay[date]++;
          shiftsPerDayShift[`${date}-${shiftName}`]++;
        }
      }

      setLoadingProgress(80);
      setLoadingMessage("Finalizing schedule...");

      // Second pass: Fill remaining shifts to reach 80 hours
      for (const employee of selectedEmployees) {
        while (employeeHours[employee.id] < 80) {
          // Find available shifts that maintain even distribution
          const availableShift = sortedShifts.find(({ date, shiftName }) => {
            const hasDayOff = employee.requestedDaysOff?.includes(date);
            if (hasDayOff) return false;

            const existingShift = employeeShifts[employee.id].find(
              (s) => s.date === date && s.shiftName === shiftName
            );
            if (existingShift) return false;

            // Check if this would create too many consecutive shifts
            const consecutiveShifts = getConsecutiveShifts(employeeShifts[employee.id], date);
            if (consecutiveShifts >= 3) return false;

            // Check if this would exceed target shifts per day/shift
            if (shiftsPerDayShift[`${date}-${shiftName}`] >= targetShiftsPerDayShift) return false;
            if (shiftsPerDay[date] >= targetShiftsPerDay) return false;

            return true;
          });

          if (!availableShift) break; // No more available shifts

          const shift: ScheduleShift = {
            date: availableShift.date,
            shiftType: data.shiftType,
            shiftName: availableShift.shiftName,
            employeeId: employee.id,
            isPointPerson: false,
          };

          employeeShifts[employee.id].push(shift);
          employeeHours[employee.id] += hoursPerShift;
          shiftsPerDay[availableShift.date]++;
          shiftsPerDayShift[`${availableShift.date}-${availableShift.shiftName}`]++;
        }
      }

      // Flatten all shifts into a single array
      const shifts = Object.values(employeeShifts).flat();

      // Check if any employee didn't reach 80 hours
      const understaffedEmployees = selectedEmployees.filter(
        (emp) => employeeHours[emp.id] < 80
      );

      if (understaffedEmployees.length > 0) {
        const warningMessage = `Warning: The following employees will not reach 80 hours:\n${understaffedEmployees
          .map(
            (emp) =>
              `${emp.firstName} ${emp.lastName} (${employeeHours[emp.id]} hours)`
          )
          .join("\n")}`;
        alert(warningMessage);
      }

      setLoadingProgress(90);
      setLoadingMessage("Saving schedule to database...");

      // Create the schedule document
      const scheduleData = {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        shiftType: data.shiftType,
        shifts,
        scheduleDayOffRequests: data.scheduleDayOffRequests,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "schedules"), scheduleData);
      
      setLoadingProgress(100);
      setLoadingMessage("Schedule created successfully!");
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push(`/schedules/${docRef.id}`);
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("Failed to create schedule. Please try again.");
    } finally {
      setIsSubmitting(false);
      setLoadingProgress(0);
      setLoadingMessage("");
    }
  };

  // Helper function to count consecutive shifts
  const getConsecutiveShifts = (shifts: ScheduleShift[], currentDate: string): number => {
    const sortedShifts = [...shifts].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let consecutive = 0;
    const currentDateObj = new Date(currentDate);
    
    for (let i = sortedShifts.length - 1; i >= 0; i--) {
      const shiftDate = new Date(sortedShifts[i].date);
      const diffDays = Math.floor(
        (currentDateObj.getTime() - shiftDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === consecutive + 1) {
        consecutive++;
      } else {
        break;
      }
    }
    
    return consecutive;
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-10 text-[var(--muted-text)]">
        <p className="mb-4">
          You need to add employees before creating a schedule.
        </p>
        <Link
          href="/employees/add"
          className="text-[var(--accent-primary)] hover:underline"
        >
          Add your first employee
        </Link>
      </div>
    );
  }

  const availableDates = generateDateRange(startDate, endDate);

  return (
    <>
      {isSubmitting && (
        <LoadingProgress progress={loadingProgress} message={loadingMessage} />
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Schedule Name*
            </label>
            <input
              id="name"
              type="text"
              {...register("name", { required: "Schedule name is required" })}
              placeholder="e.g., May Schedule"
              className={`mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border ${
                errors.name
                  ? "border-[var(--accent-danger)]"
                  : "border-[var(--card-border)]"
              } rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-[var(--accent-danger)]">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Start Date*
            </label>
            <input
              id="startDate"
              type="date"
              {...register("startDate", { required: "Start date is required" })}
              className={`mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border ${
                errors.startDate
                  ? "border-[var(--accent-danger)]"
                  : "border-[var(--card-border)]"
              } rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-[var(--accent-danger)]">
                {errors.startDate.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              End Date*
            </label>
            <input
              id="endDate"
              type="date"
              {...register("endDate", { required: "End date is required" })}
              className={`mt-1 block w-full px-3 py-2 bg-[var(--highlight-bg)] border ${
                errors.endDate
                  ? "border-[var(--accent-danger)]"
                  : "border-[var(--card-border)]"
              } rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-[var(--foreground)]`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-[var(--accent-danger)]">
                {errors.endDate.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Shift Type*
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="8hour"
                  {...register("shiftType", {
                    required: "Shift type is required",
                  })}
                  className="h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--card-border)]"
                />
                <span className="ml-2 text-sm text-[var(--foreground)]">
                  8 Hour Shifts (7am-3pm, 3pm-11pm, 11pm-7am)
                </span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="12hour"
                  {...register("shiftType", {
                    required: "Shift type is required",
                  })}
                  className="h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--card-border)]"
                />
                <span className="ml-2 text-sm text-[var(--foreground)]">
                  12 Hour Shifts (7am-7pm, 7pm-7am)
                </span>
              </label>
            </div>
            {errors.shiftType && (
              <p className="mt-1 text-sm text-[var(--accent-danger)]">
                {errors.shiftType.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Select Employees*
            </label>
            <div className="border border-[var(--card-border)] bg-[var(--highlight-bg)] rounded-md p-4 max-h-80 overflow-y-auto">
              {/* Nurses Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--accent-primary)]">
                    Nurses
                  </h3>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={areAllSelected("Nurse")}
                      onChange={() => handleSelectAll("Nurse")}
                      className="h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--card-border)] rounded"
                    />
                    <span className="ml-2 text-sm text-[var(--foreground)]">
                      Select All
                    </span>
                  </label>
                </div>
                {employees
                  .filter((emp) => emp.position.startsWith("Nurse"))
                  .map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center mb-2 last:mb-0 pl-2"
                    >
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}`}
                        value={employee.id}
                        {...register("employees", {
                          required: "At least one employee must be selected",
                        })}
                        className="h-4 w-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--card-border)] rounded"
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="ml-2 text-sm text-[var(--foreground)]"
                      >
                        {employee.firstName} {employee.lastName} -{" "}
                        {employee.position}
                        {isSeniorNurse(employee) && (
                          <span className="ml-1 text-xs text-[var(--accent-primary)]">
                            (Senior)
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
              </div>

              {/* Midwives Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--accent-secondary)]">
                    Midwives
                  </h3>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={areAllSelected("Midwife")}
                      onChange={() => handleSelectAll("Midwife")}
                      className="h-4 w-4 text-[var(--accent-secondary)] focus:ring-[var(--accent-secondary)] border-[var(--card-border)] rounded"
                    />
                    <span className="ml-2 text-sm text-[var(--foreground)]">
                      Select All
                    </span>
                  </label>
                </div>
                {employees
                  .filter((emp) => emp.position.startsWith("Midwife"))
                  .map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center mb-2 last:mb-0 pl-2"
                    >
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}`}
                        value={employee.id}
                        {...register("employees", {
                          required: "At least one employee must be selected",
                        })}
                        className="h-4 w-4 text-[var(--accent-secondary)] focus:ring-[var(--accent-secondary)] border-[var(--card-border)] rounded"
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="ml-2 text-sm text-[var(--foreground)]"
                      >
                        {employee.firstName} {employee.lastName} -{" "}
                        {employee.position}
                      </label>
                    </div>
                  ))}
              </div>

              {/* Nursing Attendants Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--accent-success)]">
                    Nursing Attendants
                  </h3>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={areAllSelected("NA")}
                      onChange={() => handleSelectAll("NA")}
                      className="h-4 w-4 text-[var(--accent-success)] focus:ring-[var(--accent-success)] border-[var(--card-border)] rounded"
                    />
                    <span className="ml-2 text-sm text-[var(--foreground)]">
                      Select All
                    </span>
                  </label>
                </div>
                {employees
                  .filter((emp) => emp.position.startsWith("NA"))
                  .map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center mb-2 last:mb-0 pl-2"
                    >
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}`}
                        value={employee.id}
                        {...register("employees", {
                          required: "At least one employee must be selected",
                        })}
                        className="h-4 w-4 text-[var(--accent-success)] focus:ring-[var(--accent-success)] border-[var(--card-border)] rounded"
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="ml-2 text-sm text-[var(--foreground)]"
                      >
                        {employee.firstName} {employee.lastName} -{" "}
                        {employee.position}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
            {errors.employees && (
              <p className="mt-1 text-sm text-[var(--accent-danger)]">
                {errors.employees.message}
              </p>
            )}
          </div>

          {/* Schedule Day Off Requests Section */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Schedule Day Off Requests
            </label>
            <div className="border border-[var(--card-border)] bg-[var(--highlight-bg)] rounded-md p-4">
              {/* Add Day Off Request Form */}
              <div className="mb-4 p-4 bg-[var(--card-bg)] rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Select Employee
                    </label>
                    <select
                      value={selectedEmployeeForDayOff?.id || ""}
                      onChange={(e) => {
                        const employee = employees.find(emp => emp.id === e.target.value);
                        setSelectedEmployeeForDayOff(employee || null);
                      }}
                      className="w-full px-3 py-2 bg-[var(--highlight-bg)] border border-[var(--card-border)] rounded-md text-[var(--foreground)]"
                    >
                      <option value="">Select an employee</option>
                      {employees
                        .filter(emp => watch("employees").includes(emp.id))
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Select Date
                    </label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--highlight-bg)] border border-[var(--card-border)] rounded-md text-[var(--foreground)]"
                    >
                      <option value="">Select a date</option>
                      {availableDates.map(date => (
                        <option key={date} value={date}>
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addDayOffRequest}
                      disabled={!selectedEmployeeForDayOff || !selectedDate}
                      className="w-full px-4 py-2 bg-[var(--accent-primary)] text-white rounded-md hover:bg-[color-mix(in_srgb,var(--accent-primary),black_10%)] disabled:opacity-50"
                    >
                      Add Day Off
                    </button>
                  </div>
                </div>
              </div>

              {/* Display Day Off Requests */}
              <div className="space-y-4">
                {Object.entries(scheduleDayOffRequests).map(([employeeId, dates]) => {
                  const employee = employees.find(emp => emp.id === employeeId);
                  if (!employee) return null;

                  return (
                    <div key={employeeId} className="p-3 bg-[var(--card-bg)] rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-[var(--foreground)]">
                          {employee.firstName} {employee.lastName}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dates.map(date => (
                          <div
                            key={date}
                            className="flex items-center gap-1 px-2 py-1 bg-[var(--highlight-bg)] rounded-md text-sm"
                          >
                            <span className="text-[var(--foreground)]">
                              {new Date(date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDayOffRequest(employeeId, date)}
                              className="text-[var(--accent-danger)] hover:text-[color-mix(in_srgb,var(--accent-danger),black_10%)]"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(scheduleDayOffRequests).length === 0 && (
                  <p className="text-sm text-[var(--muted-text)] text-center py-4">
                    No day off requests added yet. Select an employee and date above to add one.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/schedules"
            className="px-4 py-2 border border-[var(--card-border)] rounded-md shadow-sm text-sm font-medium text-[var(--foreground)] bg-[var(--highlight-bg)] hover:bg-[color-mix(in_srgb,var(--highlight-bg),black_10%)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--accent-success)] hover:bg-[color-mix(in_srgb,var(--accent-success),black_10%)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-success)] disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Schedule"}
          </button>
        </div>
      </form>
    </>
  );
}
