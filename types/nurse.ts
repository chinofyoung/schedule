export type NursePosition =
  | "Nurse 1"
  | "Nurse 2"
  | "Nurse 3"
  | "Nurse 4"
  | "Midwife 1"
  | "Midwife 2"
  | "NA 1"
  | "NA 2";

export interface Nurse {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber?: string; // Optional as per requirements
  position: NursePosition;
  requestedDaysOff?: string[]; // Array of ISO date strings
}

export type ShiftType = "8hour" | "12hour";

export interface ShiftTime {
  start: string; // Format: "HH:mm"
  end: string; // Format: "HH:mm"
}

export type ShiftTimes = {
  "8hour": {
    morning: ShiftTime;
    afternoon: ShiftTime;
    night: ShiftTime;
  };
  "12hour": {
    day: ShiftTime;
    night: ShiftTime;
  };
};

export interface ScheduleShift {
  date: string; // ISO date string
  shiftType: ShiftType;
  shiftName: string; // e.g., "morning", "day", "night", etc.
  nurseId: string;
  isPointPerson: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  shiftType: ShiftType;
  shifts: ScheduleShift[];
}
