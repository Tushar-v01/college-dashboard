import { Day, PrismaClient, UserSex } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

// Default password for every seeded account — log in with this, then change it from Settings.
const DEFAULT_PASSWORD = "password123";

// Login usernames/ids stay as teacherN / studentN / parentIdN — only the
// human-facing name/contact fields below are localized to Indian names.
const MALE_FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Sai", "Krishna",
  "Ishaan", "Rohan", "Karan", "Aryan", "Dhruv", "Kabir", "Yash", "Rudra",
  "Aayush", "Om", "Shaurya", "Atharv", "Vedant", "Pranav", "Harsh", "Nikhil",
  "Siddharth",
];
const FEMALE_FIRST_NAMES = [
  "Saanvi", "Ananya", "Diya", "Aadhya", "Pari", "Myra", "Anika", "Ira",
  "Riya", "Sara", "Kiara", "Navya", "Aarohi", "Ishita", "Kavya", "Meera",
  "Tara", "Zara", "Anvi", "Prisha", "Aditi", "Nisha", "Sneha", "Pooja",
  "Rhea",
];
const SURNAMES = [
  "Sharma", "Verma", "Gupta", "Patel", "Kumar", "Singh", "Reddy", "Nair",
  "Iyer", "Menon", "Rao", "Joshi", "Kapoor", "Chandran", "Desai", "Mehta",
  "Agarwal", "Choudhary", "Bansal", "Malhotra", "Trivedi", "Pillai", "Bhatt",
  "Saxena", "Chatterjee", "Bose", "Mukherjee", "Das", "Pandey", "Tiwari",
];
const CITIES = [
  "Mumbai, Maharashtra", "New Delhi", "Bengaluru, Karnataka",
  "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Hyderabad, Telangana",
  "Pune, Maharashtra", "Ahmedabad, Gujarat", "Jaipur, Rajasthan",
  "Lucknow, Uttar Pradesh", "Chandigarh", "Bhopal, Madhya Pradesh",
  "Kochi, Kerala", "Nagpur, Maharashtra", "Indore, Madhya Pradesh",
];

const TEACHERS: { name: string; surname: string; sex: UserSex }[] = [
  { name: "Priya", surname: "Sharma", sex: UserSex.FEMALE },
  { name: "Rajesh", surname: "Kumar", sex: UserSex.MALE },
  { name: "Anjali", surname: "Gupta", sex: UserSex.FEMALE },
  { name: "Vikram", surname: "Singh", sex: UserSex.MALE },
  { name: "Kavita", surname: "Nair", sex: UserSex.FEMALE },
  { name: "Suresh", surname: "Iyer", sex: UserSex.MALE },
  { name: "Deepa", surname: "Menon", sex: UserSex.FEMALE },
  { name: "Manoj", surname: "Verma", sex: UserSex.MALE },
  { name: "Neha", surname: "Kapoor", sex: UserSex.FEMALE },
  { name: "Arun", surname: "Joshi", sex: UserSex.MALE },
  { name: "Pooja", surname: "Desai", sex: UserSex.FEMALE },
  { name: "Sanjay", surname: "Rao", sex: UserSex.MALE },
  { name: "Meera", surname: "Pillai", sex: UserSex.FEMALE },
  { name: "Ravi", surname: "Chandran", sex: UserSex.MALE },
  { name: "Sunita", surname: "Reddy", sex: UserSex.FEMALE },
];

// Department (Class) names, in creation order — index-aligned with
// DEPARTMENT_SUBJECTS and everywhere else that needs a department index.
const DEPARTMENT_NAMES = [
  "Computer Science",
  "Mechanical Engineering",
  "Electronics & Communication",
  "Civil Engineering",
  "Information Technology",
  "Business Administration",
];

// Each department's subjects — this is what makes Subjects, Teachers, and
// Lessons all agree on which department they belong to, instead of cycling
// through unrelated ids independently.
const DEPARTMENT_SUBJECTS: string[][] = [
  ["Data Structures and Algorithms", "Database Management Systems", "Operating Systems"],
  ["Thermodynamics", "Fluid Mechanics", "Machine Design"],
  ["Digital Electronics", "Signals and Systems", "Communication Systems"],
  ["Structural Analysis", "Surveying", "Concrete Technology"],
  ["Web Technologies", "Cloud Computing", "Software Engineering"],
  ["Marketing Management", "Financial Accounting", "Human Resource Management"],
];

async function main() {
  const defaultPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ADMIN
  await prisma.admin.create({
    data: {
      id: "admin1",
      username: "admin1",
      password: defaultPassword,
    },
  });
  await prisma.admin.create({
    data: {
      id: "admin2",
      username: "admin2",
      password: defaultPassword,
    },
  });

  // GRADE
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.create({
      data: {
        level: i,
      },
    });
  }

  // CLASS (department)
  for (let i = 1; i <= 6; i++) {
    await prisma.class.create({
      data: {
        name: DEPARTMENT_NAMES[i - 1],
        gradeId: i,
        capacity: Math.floor(Math.random() * (20 - 15 + 1)) + 15,
      },
    });
  }

  // SUBJECT — created department-by-department so ids come out grouped and
  // predictable; subjectIdsByDept[d] holds the real ids for department d.
  const subjectIdsByDept: number[][] = [];
  for (let d = 0; d < DEPARTMENT_SUBJECTS.length; d++) {
    const ids: number[] = [];
    for (const name of DEPARTMENT_SUBJECTS[d]) {
      const subject = await prisma.subject.create({ data: { name } });
      ids.push(subject.id);
    }
    subjectIdsByDept.push(ids);
  }

  // TEACHER — each teacher belongs to one department (round-robin over the
  // 15 teachers/6 departments) and teaches one of that department's subjects.
  // The first teacher assigned to a department is made its supervisor (HOD);
  // Class.supervisor is a single to-one field, so only one teacher per
  // department can hold it.
  const teachersByDept: string[][] = DEPARTMENT_NAMES.map(() => []);
  for (let i = 1; i <= 15; i++) {
    const teacher = TEACHERS[i - 1];
    const deptIndex = (i - 1) % DEPARTMENT_NAMES.length;
    const subjectsInDept = subjectIdsByDept[deptIndex];
    const occurrenceInDept = teachersByDept[deptIndex].length;
    const subjectId = subjectsInDept[occurrenceInDept % subjectsInDept.length];
    const isDeptHead = occurrenceInDept === 0;

    await prisma.teacher.create({
      data: {
        id: `teacher${i}`, // Unique ID for the teacher
        username: `teacher${i}`,
        password: defaultPassword,
        name: teacher.name,
        surname: teacher.surname,
        email: `${teacher.name.toLowerCase()}.${teacher.surname.toLowerCase()}${i}@gmail.com`,
        phone: `+91 90000 000${i.toString().padStart(2, "0")}`,
        address: CITIES[i % CITIES.length],
        bloodType: "A+",
        sex: teacher.sex,
        subjects: { connect: [{ id: subjectId }] },
        ...(isDeptHead ? { classes: { connect: [{ id: deptIndex + 1 }] } } : {}),
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
      },
    });

    teachersByDept[deptIndex].push(`teacher${i}`);
  }

  // LESSON — cycles through departments so each lesson's subject and
  // teacher both genuinely belong to that lesson's department.
  // Stable Monday reference so a lesson's startTime always falls on the same
  // weekday as its `day` field, regardless of when the seed is run — the
  // calendar (adjustScheduleToCurrentWeek) places events by startTime's actual
  // weekday, not by the `day` enum, so these must agree or every lesson piles
  // onto whatever day the seed happened to run on.
  const REFERENCE_MONDAY = new Date(2024, 0, 1); // 2024-01-01 is a Monday
  const weekdays: Day[] = [
    Day.MONDAY,
    Day.TUESDAY,
    Day.WEDNESDAY,
    Day.THURSDAY,
    Day.FRIDAY,
  ];
  const periodStartHours = [8, 9, 10, 11, 13, 14, 15]; // skips 12 for lunch

  const lessonDateTime = (dayIndex: number, hour: number) => {
    const date = new Date(REFERENCE_MONDAY);
    date.setDate(REFERENCE_MONDAY.getDate() + dayIndex);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  // Track each lesson's subject name by creation order (1-indexed, matches
  // the autoincrement id on a freshly-reset DB) so Exams/Assignments below
  // can reference the real subject instead of a generic "Lesson N" name.
  const lessonTopics: string[] = [];
  const deptLessonCount = DEPARTMENT_NAMES.map(() => 0);

  for (let i = 1; i <= 30; i++) {
    const dayIndex = (i - 1) % 5; // 0=Monday .. 4=Friday, 6 lessons per day
    const period = Math.floor((i - 1) / 5) % periodStartHours.length;
    const startHour = periodStartHours[period];

    const deptIndex = (i - 1) % DEPARTMENT_NAMES.length;
    const classId = deptIndex + 1;
    const occurrenceInDept = deptLessonCount[deptIndex]++;

    const subjectsInDept = subjectIdsByDept[deptIndex];
    const subjectId = subjectsInDept[occurrenceInDept % subjectsInDept.length];
    const subjectName = DEPARTMENT_SUBJECTS[deptIndex][occurrenceInDept % subjectsInDept.length];
    lessonTopics.push(subjectName);

    const teacherPool = teachersByDept[deptIndex];
    const teacherId = teacherPool[occurrenceInDept % teacherPool.length];

    await prisma.lesson.create({
      data: {
        name: subjectName,
        day: weekdays[dayIndex],
        startTime: lessonDateTime(dayIndex, startHour),
        endTime: lessonDateTime(dayIndex, startHour + 1),
        subjectId,
        classId,
        teacherId,
      },
    });
  }

  // PARENT
  for (let i = 1; i <= 25; i++) {
    const first =
      i % 2 === 0
        ? MALE_FIRST_NAMES[i % MALE_FIRST_NAMES.length]
        : FEMALE_FIRST_NAMES[i % FEMALE_FIRST_NAMES.length];
    const surname = SURNAMES[i % SURNAMES.length];

    await prisma.parent.create({
      data: {
        id: `parentId${i}`,
        username: `parentId${i}`,
        password: defaultPassword,
        name: first,
        surname,
        email: `${first.toLowerCase()}.${surname.toLowerCase()}${i}@gmail.com`,
        phone: `+91 92000 000${i.toString().padStart(2, "0")}`,
        address: CITIES[i % CITIES.length],
      },
    });
  }

  // STUDENT
  for (let i = 1; i <= 50; i++) {
    const isMale = i % 2 === 0;
    const first = isMale
      ? MALE_FIRST_NAMES[i % MALE_FIRST_NAMES.length]
      : FEMALE_FIRST_NAMES[i % FEMALE_FIRST_NAMES.length];
    const surname = SURNAMES[i % SURNAMES.length];

    await prisma.student.create({
      data: {
        id: `student${i}`,
        username: `student${i}`,
        password: defaultPassword,
        name: first,
        surname,
        email: `${first.toLowerCase()}.${surname.toLowerCase()}${i}@gmail.com`,
        phone: `+91 91000 000${i.toString().padStart(2, "0")}`,
        address: CITIES[i % CITIES.length],
        bloodType: "O-",
        sex: isMale ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parentId${Math.ceil(i / 2) % 25 || 25}`,
        gradeId: (i % 6) + 1,
        classId: (i % 6) + 1,
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
      },
    });
  }

  // EXAM
  for (let i = 1; i <= 10; i++) {
    const lessonId = (i % 30) + 1;
    await prisma.exam.create({
      data: {
        title: `${lessonTopics[lessonId - 1]} - Term Examination`,
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
        lessonId,
      },
    });
  }

  // ASSIGNMENT
  for (let i = 1; i <= 10; i++) {
    const lessonId = (i % 30) + 1;
    await prisma.assignment.create({
      data: {
        title: `${lessonTopics[lessonId - 1]} - Homework Assignment`,
        startDate: new Date(new Date().setHours(new Date().getHours() + 1)),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        lessonId,
      },
    });
  }

  // RESULT
  for (let i = 1; i <= 10; i++) {
    await prisma.result.create({
      data: {
        score: 60 + ((i * 7) % 41), // realistic spread, 60-100
        studentId: `student${i}`,
        ...(i <= 5 ? { examId: i } : { assignmentId: i - 5 }),
      },
    });
  }

  // ATTENDANCE
  for (let i = 1; i <= 10; i++) {
    await prisma.attendance.create({
      data: {
        date: new Date(),
        present: true,
        studentId: `student${i}`,
        lessonId: (i % 30) + 1,
      },
    });
  }

  // EVENT
  const eventData = [
    {
      title: "Independence Day Celebration",
      description: "Flag hoisting ceremony followed by cultural performances to mark India's Independence Day.",
    },
    {
      title: "Annual Sports Day",
      description: "A full day of track and field events, relay races, and inter-house competitions.",
    },
    {
      title: "Diwali Celebration",
      description: "School-wide Diwali celebration with rangoli-making, diya decoration, and a cultural program.",
    },
    {
      title: "Parent-Teacher Meeting",
      description: "Term progress discussion between parents and class teachers. Attendance is mandatory.",
    },
    {
      title: "Republic Day Celebration",
      description: "Flag hoisting and patriotic performances to celebrate Republic Day.",
    },
  ];
  for (let i = 1; i <= eventData.length; i++) {
    await prisma.event.create({
      data: {
        title: eventData[i - 1].title,
        description: eventData[i - 1].description,
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
        classId: (i % 5) + 1,
      },
    });
  }

  // ANNOUNCEMENT
  const announcementData = [
    {
      title: "Diwali Vacation Notice",
      description: "The school will remain closed from 20th October to 27th October for Diwali vacation. Classes resume on 28th October.",
    },
    {
      title: "Fee Payment Reminder",
      description: "Parents are requested to clear the pending term fees before the 10th of this month to avoid a late fee.",
    },
    {
      title: "Annual Day Function",
      description: "Our Annual Day function will be held in the school auditorium. All parents and students are cordially invited.",
    },
    {
      title: "Republic Day Celebration",
      description: "The school will celebrate Republic Day with a flag hoisting ceremony at 8:00 AM. All students must attend in full uniform.",
    },
    {
      title: "Parent-Teacher Meeting Schedule",
      description: "The next PTM is scheduled for this Saturday from 9:00 AM to 1:00 PM. Please book your slot with the class teacher.",
    },
  ];
  for (let i = 1; i <= announcementData.length; i++) {
    await prisma.announcement.create({
      data: {
        title: announcementData[i - 1].title,
        description: announcementData[i - 1].description,
        date: new Date(),
        classId: (i % 5) + 1,
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
