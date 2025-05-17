This is a Schedule Maker Web App for Hospital Nurses

A dashboard

Requirements:

This app should be mobile friendly

The user can save Nurses to database using Firebase firestore

- I alread setup .env.local
- The user can add a nurse profile
- First Name
- Last Name
- Mobile Number (Optional)
- Nurse position (Nurse 1, Nurse 2, Nurse 3, Nurse 4)
  - Dropdown
- The user can edit nurse profiles

The user can create a schedule

    - Schedules should be evenly distributed for a 40 hour weekly shift
    - Schedules can be created for specific date ranges (ie. May 01 - May 15)
    - The user can assign a Point person for every shift (Optional checkbox)
    - The Nurses have requested day offs so the user can input requested day off for every Nurse
        - Requested day offs should be considered when creating schedule
        - There should be a senior nurse present in every shift (Nurse 3)
        - If possible there should be a Nursing attendant and a Midwife present in every shift
        - The user can choose to create a schedule for 8 hour shifts
            - 7am - 3pm
            - 3pm - 11pm
            - 11pm - 7am

        - The user can choose to create a schedule for 12 hour shifts
            - 7am - 7pm
            - 7pm - 7am
